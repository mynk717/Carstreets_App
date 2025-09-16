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
  imageUrls: string[]  // External URLs only
  dealerId: string
  location: string
}

export async function POST(request: NextRequest) {
  try {
    // Optional: Verify admin authorization before proceeding
    // await verifyAdminAuth(request)

    const listingData: ManualListingRequest = await request.json()

    // Validate image URLs
    const validatedImages = await validateImageUrls(listingData.imageUrls)

    // Prepare the manual car record
    const car = {
      ...listingData,
      images: validatedImages,
      source: 'manual',
      carStreetsListed: true,
      createdAt: new Date(),
      description: `Well-maintained ${listingData.year} ${listingData.brand} ${listingData.model} with ${listingData.kmDriven}km on odometer. ${listingData.fuelType} engine with ${listingData.transmission} transmission.`,
      location: listingData.location || 'Raipur',
      sellerType: 'Dealer' as const,
      condition: 'Used' as const,
      postedDate: new Date().toISOString(),
      isFeatured: false,
      isVerified: true,
      // Additional fields as needed
    }

    // Use prisma create to add new car without deleting others
    const createdCar = await prisma.car.create({
      data: car
    })

    return NextResponse.json({ success: true, car: createdCar })
  } catch (error) {
    console.error('Manual listing creation error:', error)
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
