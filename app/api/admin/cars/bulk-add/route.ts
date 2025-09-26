import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { urls } = await request.json()
    
    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({
        error: 'No URLs provided'
      }, { status: 400 })
    }
    
    if (urls.length > 15) {
      return NextResponse.json({
        error: 'Maximum 15 URLs allowed per batch'
      }, { status: 400 })
    }
    
    const results = []
    
    for (const url of urls) {
      try {
        // Extract item ID from URL
        const itemIdMatch = url.match(/iid-(\d+)/)
        if (!itemIdMatch) {
          results.push({
            url,
            success: false,
            error: 'Could not extract item ID from URL'
          })
          continue
        }
        
        const itemId = itemIdMatch[1]
        
        // Check if car already exists
        const existingCar = await prisma.car.findFirst({
          where: { originalUrl: url }
        })
        
        if (existingCar) {
          results.push({
            url,
            success: false,
            error: 'Car already exists in database',
            existingId: existingCar.id
          })
          continue
        }
        
        // Create placeholder car for manual editing
        const placeholderCar = await prisma.car.create({
          data: {
            title: `Imported from OLX - Item ${itemId}`,
            brand: 'To be updated',
            model: 'To be updated',
            price: BigInt(0),
            year: new Date().getFullYear(),
            fuelType: 'Petrol',
            transmission: 'Manual',
            kmDriven: 0,
            location: 'To be updated',
            images: [],
            description: 'Imported from OLX - Please update details',
            sellerType: 'Individual',
            postedDate: new Date().toISOString(),
            owners: 1,
            isVerified: false, // Requires manual verification
            isFeatured: false,
            dataSource: 'olx-external',
            originalUrl: url,
            carStreetsListed: false
          }
        })
        
        results.push({
          url,
          success: true,
          title: placeholderCar.title,
          id: placeholderCar.id,
          message: 'Placeholder created - please edit details'
        })
        
      } catch (error) {
        console.error(`❌ Error processing URL ${url}:`, error)
        results.push({
          url,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    const successCount = results.filter(r => r.success).length
    console.log(`✅ Bulk import completed: ${successCount}/${urls.length} successful`)
    
    return NextResponse.json({
      success: true,
      message: `Processed ${urls.length} URLs, ${successCount} successful`,
      results
    })
    
  } catch (error) {
    console.error('❌ Bulk import error:', error)
    return NextResponse.json({
      error: 'Bulk import failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
