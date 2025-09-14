import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT - Update existing car
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const updates = await request.json()
    
    // Convert data to match your Prisma schema
    const dbUpdates = {
      title: updates.title,
      brand: updates.brand,
      model: updates.model,
      variant: updates.variant || null,
      price: updates.price ? BigInt(typeof updates.price === 'string' ? 
        parseInt(updates.price.replace(/[₹,\s]/g, '')) || 0 : 
        updates.price) : undefined,
      year: updates.year ? parseInt(updates.year) : undefined,
      fuelType: updates.fuelType,
      transmission: updates.transmission,
      kmDriven: updates.kmDriven ? parseInt(updates.kmDriven) : undefined,
      location: updates.location,
      images: updates.images ? (Array.isArray(updates.images) ? updates.images : 
        typeof updates.images === 'string' ? 
        updates.images.split('\n').filter(url => url.trim()) : []) : undefined,
      description: updates.description,
      sellerType: updates.sellerType,
      owners: updates.owners ? parseInt(updates.owners) : undefined,
      isVerified: updates.isVerified,
      isFeatured: updates.isFeatured,
      carStreetsListed: updates.carStreetsListed,
      updatedAt: new Date()
    }
    
    // Remove undefined values
    Object.keys(dbUpdates).forEach(key => 
      dbUpdates[key] === undefined && delete dbUpdates[key])
    
    console.log('🔄 Updating car:', params.id, dbUpdates.title)
    
    const updatedCar = await prisma.car.update({
      where: { id: params.id },
      data: dbUpdates
    })
    
    console.log('✅ Car updated successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Car updated successfully',
      car: {
        ...updatedCar,
        price: updatedCar.price.toString(), // Convert BigInt back to string
        images: Array.isArray(updatedCar.images) ? updatedCar.images : []
      }
    })
    
  } catch (error) {
    console.error('❌ Error updating car:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json({
        error: 'Car not found'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      error: 'Failed to update car',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Remove car
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('🗑️ Deleting car:', params.id)
    
    const deletedCar = await prisma.car.delete({
      where: { id: params.id }
    })
    
    console.log('✅ Car deleted successfully:', deletedCar.title)
    
    return NextResponse.json({
      success: true,
      message: 'Car deleted successfully'
    })
    
  } catch (error) {
    console.error('❌ Error deleting car:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json({
        error: 'Car not found'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      error: 'Failed to delete car',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET - Fetch single car (bonus)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const car = await prisma.car.findUnique({
      where: { id: params.id }
    })
    
    if (!car) {
      return NextResponse.json({
        error: 'Car not found'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      car: {
        ...car,
        price: car.price.toString(), // Convert BigInt back to string
        images: Array.isArray(car.images) ? car.images : []
      }
    })
    
  } catch (error) {
    console.error('❌ Error fetching car:', error)
    return NextResponse.json({
      error: 'Failed to fetch car'
    }, { status: 500 })
  }
}
