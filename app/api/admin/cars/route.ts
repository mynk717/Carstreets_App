import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Create new car
export async function POST(request: NextRequest) {
  try {
    const carData = await request.json()
    
    // Convert data to match your Prisma schema
    const dbCarData = {
      id: carData.id?.includes('new_') || carData.id?.includes('temp_') ? undefined : carData.id, // Let Prisma generate cuid() if temp ID
      title: carData.title,
      brand: carData.brand || 'Other',
      model: carData.model || 'Unknown',
      variant: carData.variant || null,
      price: BigInt(typeof carData.price === 'string' ? 
        parseInt(carData.price.replace(/[₹,\s]/g, '')) || 0 : 
        carData.price || 0),
      year: parseInt(carData.year) || new Date().getFullYear(),
      fuelType: carData.fuelType || 'Petrol',
      transmission: carData.transmission || 'Manual',
      kmDriven: parseInt(carData.kmDriven) || 0,
      location: carData.location || 'Unknown',
      images: Array.isArray(carData.images) ? carData.images : 
        typeof carData.images === 'string' ? 
        carData.images.split('\n').filter(url => url.trim()) : [],
      description: carData.description || '',
      sellerType: carData.sellerType || 'Individual',
      postedDate: carData.postedDate || new Date().toISOString(),
      owners: parseInt(carData.owners) || 1,
      isVerified: carData.isVerified ?? true, // Default to verified for manual entries
      isFeatured: carData.isFeatured ?? false,
      dataSource: carData.dataSource || 'direct',
      olxProfile: carData.olxProfile || null,
      olxProfileId: carData.olxProfileId || null,
      originalUrl: carData.originalUrl || null,
      attribution: carData.attribution || null,
      carStreetsListed: carData.carStreetsListed ?? true // Default to true for new entries
    }

    console.log('🚀 Creating new car:', dbCarData.title)
    
    const savedCar = await prisma.car.create({
      data: dbCarData
    })
    
    console.log('✅ Car created successfully with ID:', savedCar.id)
    
    return NextResponse.json({
      success: true,
      message: 'Car added successfully',
      car: {
        ...savedCar,
        price: savedCar.price.toString(), // Convert BigInt back to string for client
        images: Array.isArray(savedCar.images) ? savedCar.images : []
      }
    })
    
  } catch (error) {
    console.error('❌ Error creating car:', error)
    return NextResponse.json({
      error: 'Failed to add car',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
