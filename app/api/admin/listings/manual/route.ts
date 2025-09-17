import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateImageUrls } from '@/lib/utils/image-validator'
import { verifyAdminAuth } from '@/lib/auth/admin'

interface ManualListingRequest {
  title: string
  brand: string
  model: string
  year: number
  price: number
  kmDriven: number
  fuelType: string
  transmission: string
  owners: number
  imageUrls: string[]
  dealerId: string
  location: string
}

export async function POST(request: NextRequest) {
  try {
    const listingData: ManualListingRequest = await request.json()
    const validatedImages = await validateImageUrls(listingData.imageUrls)

    // Create car record with all required fields explicitly
    const createdCar = await prisma.car.create({
      data: {
        // Basic car information
        title: listingData.title,
        brand: listingData.brand,
        model: listingData.model,
        variant: null,
        year: listingData.year,
        price: BigInt(listingData.price), // Convert to BigInt for Prisma
        kmDriven: listingData.kmDriven,
        fuelType: listingData.fuelType,
        transmission: listingData.transmission,
        owners: listingData.owners,
        location: listingData.location || 'Raipur',
        images: validatedImages,
        description: `Well-maintained ${listingData.year} ${listingData.brand} ${listingData.model} with ${listingData.kmDriven}km on odometer. ${listingData.fuelType} engine with ${listingData.transmission} transmission.`,
        sellerType: 'Dealer',
        
        // Required schema fields (note the correct casing)
        dataSource: 'manual', // Fixed from 'datasource'
        postedDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        originalUrl: null,
        olxProfile: null,
        olxProfileId: null,
        attribution: null,
        
        // Tracking and status fields
        manuallyEdited: true, // Mark as manually added
        editedFields: [],
        lastScrapedAt: new Date(),
        isUserAdded: true, // This is a manual addition
        scrapedData: null,
        isVerified: true,
        isFeatured: false,
        carStreetsListed: true
      }
    })

    return NextResponse.json({ success: true, car: createdCar })
  } catch (error) {
    console.error('Manual listing creation error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
