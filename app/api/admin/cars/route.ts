import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkUsageLimit, incrementUsage, decrementUsage } from '@/lib/usage-limits'

// POST - Create new car
export async function POST(request: NextRequest) {
  try {
    const carData = await request.json()
    
    // Get dealerId (from request body or default to carstreets)
    const dealerId = carData.dealerId || 'cmge1qglb0000zqf08w6xdflz'
    
    // ✅ CHECK USAGE LIMIT BEFORE CREATING CAR
    const limitCheck = await checkUsageLimit(dealerId, 'cars')
    
    if (!limitCheck.allowed) {
      console.log(`❌ Car limit reached for dealer: ${dealerId}`)
      return NextResponse.json({
        success: false,
        error: limitCheck.message,
        current: limitCheck.current,
        limit: limitCheck.limit,
        upgradeRequired: true
      }, { status: 403 })
    }
    
    console.log(`✅ Usage check passed: ${limitCheck.current}/${limitCheck.limit} cars used`)
    
    // Convert data to match your Prisma schema
    const dbCarData = {
      id: carData.id?.includes('new_') || carData.id?.includes('temp_') ? undefined : carData.id,
      dealerId: dealerId,
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
      isVerified: carData.isVerified ?? true,
      isFeatured: carData.isFeatured ?? false,
      dataSource: carData.dataSource || 'direct',
      olxProfile: carData.olxProfile || null,
      olxProfileId: carData.olxProfileId || null,
      originalUrl: carData.originalUrl || null,
      attribution: carData.attribution || null,
      carStreetsListed: carData.carStreetsListed ?? true
    }

    console.log('🚀 Creating new car:', dbCarData.title)
    
    const savedCar = await prisma.car.create({
      data: dbCarData
    })
    
    // ✅ INCREMENT USAGE COUNTER
    await incrementUsage(dealerId, 'cars')
    console.log(`📊 Usage counter incremented: ${limitCheck.current + 1}/${limitCheck.limit}`)
    
    console.log('✅ Car created successfully with ID:', savedCar.id)
    
    return NextResponse.json({
      success: true,
      message: 'Car added successfully',
      usageInfo: {
        current: limitCheck.current + 1,
        limit: limitCheck.limit,
        remaining: limitCheck.limit - (limitCheck.current + 1)
      },
      car: {
        ...savedCar,
        price: savedCar.price.toString(),
        images: Array.isArray(savedCar.images) ? savedCar.images : []
      }
    })
    
  } catch (error) {
    console.error('❌ Error creating car:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to add car',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Remove car and decrement counter
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const carId = searchParams.get('id')
    
    if (!carId) {
      return NextResponse.json({
        success: false,
        error: 'Car ID is required'
      }, { status: 400 })
    }

    const car = await prisma.car.findUnique({
      where: { id: carId },
      select: { dealerId: true }
    })

    if (!car) {
      return NextResponse.json({
        success: false,
        error: 'Car not found'
      }, { status: 404 })
    }

    await prisma.car.delete({
      where: { id: carId }
    })

    // ✅ DECREMENT COUNTER
    if (car.dealerId) {
      await decrementUsage(car.dealerId, 'cars')
      console.log(`📊 Usage counter decremented for dealer: ${car.dealerId}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Car deleted successfully'
    })

  } catch (error) {
    console.error('❌ Error deleting car:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete car',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
