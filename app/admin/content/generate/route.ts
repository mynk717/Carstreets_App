// app/admin/content/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { fetchCarById } from '@/lib/database/db'
import { verifyAdminAuth } from '@/lib/auth/admin'
import { CarMarketIntelligence } from '@/lib/intelligence/carScoring'
import { prisma } from '@/lib/database/db'

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
    
    const { carId, contentType, platform, useIntelligentSelection }: ContentGenerationRequest = body
    
    // Intelligent car selection using RAW Prisma data
    if (useIntelligentSelection && contentType === 'batch_content') {
      console.log("🟡 [API] Starting intelligent batch content generation")
      
      // Get raw cars with correct user-edited prices
      const rawCars = await prisma.car.findMany({ 
        orderBy: { createdAt: 'desc' }
      })
      console.log(`🟡 [API] Found ${rawCars.length} cars in database`)
      
      const topCars = await CarMarketIntelligence.selectTopCarsForContent(rawCars, 5)
      console.log(`🟡 [API] Selected ${topCars.length} top cars for content`)
      
      const batchContent = await Promise.all(
        topCars.map(async (scoredCar) => ({
          car: {
            ...scoredCar.car,
            displayPrice: `₹${Number(scoredCar.car.price).toLocaleString('en-IN')}`,
            wasManuallyEdited: scoredCar.car.manuallyEdited,
            editedFields: scoredCar.car.editedFields
          },
          score: scoredCar.score,
          reasons: scoredCar.reasons,
          marketProbability: scoredCar.marketProbability,
          content: await generateCarContent(scoredCar.car, 'social_post', platform)
        }))
      )
      
      console.log("🟢 [API] Batch content generated successfully")
      
      return NextResponse.json({
        success: true,
        intelligentSelection: true,
        batchContent,
        totalCars: rawCars.length,
        selectedCount: topCars.length,
        dataAccuracy: {
          manuallyEditedCars: rawCars.filter(car => car.manuallyEdited).length,
          verifiedCars: rawCars.filter(car => car.isVerified).length
        }
      })
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
