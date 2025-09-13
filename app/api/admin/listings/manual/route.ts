// In your admin route files, add these imports:
import { NextRequest, NextResponse } from 'next/server'
import { saveCars } from '@/lib/database/db'
import { validateImageUrls } from '@/lib/utils/image-validator'
import { verifyAdminAuth } from '@/lib/auth/admin'


// app/api/admin/listings/manual/route.ts
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
  const listingData: ManualListingRequest = await request.json()
  
  // Validate image URLs
  const validatedImages = await validateImageUrls(listingData.imageUrls)
  
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
    postedDate: new Date().toISOString(), // ← Add this missing field
    // Add any other potentially missing fields:
    id: crypto.randomUUID(), // Generate unique ID
    url: `https://carstreets-app.vercel.app/cars/${crypto.randomUUID()}`, // Generate URL
    contact: '+91-9876543210', // Default contact
    isFeatured: false,
    isVerified: true
}
  
  await saveCars([car])
  return NextResponse.json({ success: true, car })
}
