// app/admin/content/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { fetchCarById } from '@/lib/database/db'
import { verifyAdminAuth } from '@/lib/auth/admin'
import { CarMarketIntelligence } from '@/lib/intelligence/carScoring'
import { prisma } from '@/lib/database/db'
import { QualityControlledPipeline } from '@/lib/agents/pipeline'
import { ContentRateLimiter } from '@/lib/rateLimit'

interface ContentGenerationRequest {
  carId?: string
  contentType: 'description' | 'social_post' | 'youtube_title' | 'thumbnail_text' | 'batch_content'
  platform?: 'facebook' | 'instagram' | 'linkedin' | 'youtube'
  useIntelligentSelection?: boolean
}

export async function POST(request: NextRequest) {
  try {
    console.log("🟡 [API] POST request received at /admin/content/generate")
    
    const authResult = await verifyAdminAuth(request)
    if (!authResult.success) {
      console.log("🔴 [API] Authentication failed")
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log("🟡 [API] Request body:", body)
    
    const { carId, contentType, platform, useIntelligentSelection } = body
    // ✅ NEW: Agentic Pipeline for Intelligent Selection
    if (useIntelligentSelection && contentType === 'batch_content') {
      console.log("🤖 [API] Starting agentic content pipeline")
      
      const pipeline = new QualityControlledPipeline()
      const rateLimiter = new ContentRateLimiter()
      
      const rawCars = await prisma.car.findMany({ 
        orderBy: { createdAt: 'desc' }
      })
      // Use top 5 cars for content generation
      const topCarIds = rawCars.slice(0, 5).map(car => car.id)
      
      try {
        const agenticContent = await pipeline.generateWeeklyContent('admin', topCarIds)
        
        return NextResponse.json({
          success: true,
          agentic: true,
          pipeline_type: 'multi_agent_quality_controlled',
          content: agenticContent,
          quality_metrics: {
            uniqueness_threshold: '90%',
            accuracy_threshold: '80%',
            monitoring: 'enabled'
          }
        })
        
      } catch (pipelineError) {
        console.error("💥 [API] Agentic pipeline failed:", pipelineError.message)
        
        // Fallback to basic intelligent selection
        const topCars = await CarMarketIntelligence.selectTopCarsForContent(rawCars, 5)
        
        const fallbackContent = await Promise.all(
          topCars.map(async (scoredCar) => ({
            car: {
              ...scoredCar.car,
              price: scoredCar.car.price.toString(),
              displayPrice: `₹${Number(scoredCar.car.price).toLocaleString('en-IN')}`,
            },
            score: scoredCar.score,
            reasons: scoredCar.reasons,
            marketProbability: scoredCar.marketProbability,
            content: await generateCarContent(scoredCar.car, 'social_post', platform)
          }))
        )
        
        return NextResponse.json({
          success: true,
          agentic: false,
          fallback_mode: 'basic_intelligent_selection',
          pipeline_error: pipelineError.message,
          batchContent: fallbackContent,
          totalCars: rawCars.length,
          selectedCount: topCars.length
        })
      }
    }

    // Single car content generation
    console.log(`🟡 [API] Single car content generation for: ${carId}`)
    const car = await fetchCarById(carId)
    if (!car) {
      console.log("🔴 [API] Car not found")
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }

    const generatedContent = await generateCarContent(car, contentType, platform)
    console.log("🟢 [API] Single car content generated")
    
    return NextResponse.json({
      success: true,
      content: generatedContent,
      carId,
      contentType,
      platform
    })
  } catch (error) {
    console.error("🔴 [API] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Enhanced content generation using accurate price data
async function generateCarContent(car: any, contentType: string, platform?: string) {
  // Use raw price for accurate display
  const accuratePrice = `₹${Number(car.price).toLocaleString('en-IN')}`
  const carProfile = `${car.year} ${car.brand} ${car.model} ${car.variant || ''}`
  const carFacts = `${carProfile}, ${car.kmDriven}km, ${car.fuelType}, ${car.transmission}, ${accuratePrice}`
  
  // Highlight if price was manually corrected (shows data accuracy)
  const dataQuality = car.manuallyEdited ? '✓ Price Verified' : 'Scraped Data'
  
  const appealFactors = []
  if (car.kmDriven < 50000) appealFactors.push('Low mileage')
  if (car.isVerified) appealFactors.push('Verified listing')
  if (car.manuallyEdited) appealFactors.push('Accurate pricing')
  if (car.fuelType === 'CNG') appealFactors.push('Fuel efficient')
  if (car.transmission === 'Automatic') appealFactors.push('Automatic transmission')
  
  switch (contentType) {
    case 'social_post':
      const platforms = {
        facebook: `🚗 ${carFacts}\n\n✨ Why this car stands out:\n${appealFactors.map(f => `• ${f}`).join('\n')}\n\n📍 Location: ${car.location}\n🏷️ ${dataQuality}\n\n📞 Contact CarStreets for immediate viewing!\n\n#CarStreets #UsedCars #${car.brand.replace(' ', '')} #Raipur`,
        
        instagram: `🚗 ${carProfile} ✨\n${accuratePrice} | ${car.kmDriven}km\n\n${appealFactors.slice(0, 3).map(f => `✓ ${f}`).join(' • ')}\n\n📍 ${car.location}\n\n#CarStreets #UsedCars #${car.brand.replace(' ', '')} #${car.model.replace(' ', '')} #Raipur #TrustedDealer`,
        
        linkedin: `🚗 Professional vehicle listing: ${carProfile}\n\n💰 Price: ${accuratePrice} (${dataQuality})\n📊 Specifications: ${car.kmDriven}km, ${car.fuelType}, ${car.transmission}\n📍 Location: ${car.location}\n\n✅ Key benefits: ${appealFactors.join(', ')}\n\nIdeal for business professionals seeking reliable transportation with transparent pricing.\n\nContact CarStreets for detailed inspection and documentation.`
      }
      return platforms[platform] || platforms.facebook
    
    default:
      return `Generated content for ${carProfile} - ${accuratePrice}`
  }
}
