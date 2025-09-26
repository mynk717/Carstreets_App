import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT - Update existing car with async params
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // FIXED: Await params in Next.js 15
    const { id } = await params
    const updates = await request.json()
    
    // Get existing car to compare changes
    const existingCar = await prisma.car.findUnique({
      where: { id }
    })
    
    if (!existingCar) {
      return NextResponse.json({
        error: 'Car not found'
      }, { status: 404 })
    }

    // Track which fields were manually edited
    const currentEditedFields = Array.isArray(existingCar.editedFields) 
      ? existingCar.editedFields as string[]
      : []
    
    const fieldsToTrack = ['title', 'price', 'description', 'location', 'images', 'kmDriven', 'year', 'owners', 'brand', 'model', 'variant', 'fuelType', 'transmission']
    const newlyEditedFields = [...currentEditedFields]
    
    // Check which fields are being changed
    for (const field of fieldsToTrack) {
      if (updates[field] !== undefined) {
        let existingValue = existingCar[field as keyof typeof existingCar]
        let newValue = updates[field]
        
        // Special handling for different types
        if (field === 'price') {
          existingValue = existingCar.price?.toString()
          newValue = typeof updates.price === 'string' 
            ? updates.price.replace(/[\u20B9,\s]/g, '') // Remove rupee symbol and commas
            : updates.price?.toString()
        } else if (field === 'images') {
          existingValue = JSON.stringify(existingCar.images)
          newValue = JSON.stringify(
            Array.isArray(updates.images) ? updates.images : 
            typeof updates.images === 'string' ? 
            updates.images.split('\n').filter((url: string) => url.trim()) : []
          )
        }
        
        // If value changed and not already tracked, add to edited fields
        if (existingValue !== newValue && !newlyEditedFields.includes(field)) {
          newlyEditedFields.push(field)
        }
      }
    }

    // Convert data to match Prisma schema
    const dbUpdates: any = {
      title: updates.title,
      brand: updates.brand,
      model: updates.model,
      variant: updates.variant || null,
      price: updates.price ? BigInt(typeof updates.price === 'string' ? 
        parseInt(updates.price.replace(/[\u20B9,\s]/g, '')) || 0 : 
        updates.price) : undefined,
      year: updates.year ? parseInt(updates.year.toString()) : undefined,
      fuelType: updates.fuelType,
      transmission: updates.transmission,
      kmDriven: updates.kmDriven ? parseInt(updates.kmDriven.toString()) : undefined,
      location: updates.location,
      images: updates.images ? (Array.isArray(updates.images) ? updates.images : 
        typeof updates.images === 'string' ? 
        updates.images.split('\n').filter((url: string) => url.trim()) : []) : undefined,
      description: updates.description,
      sellerType: updates.sellerType,
      owners: updates.owners ? parseInt(updates.owners.toString()) : undefined,
      isVerified: updates.isVerified,
      isFeatured: updates.isFeatured,
      carStreetsListed: updates.carStreetsListed,
      updatedAt: new Date(),
      
      // Track manual edits
      manuallyEdited: true,
      editedFields: newlyEditedFields
    }
    
    // Remove undefined values
    Object.keys(dbUpdates).forEach(key => 
      dbUpdates[key] === undefined && delete dbUpdates[key])
    
    console.log('🔄 Updating car:', id, dbUpdates.title)
    console.log('📝 Tracking edited fields:', newlyEditedFields)
    
    const updatedCar = await prisma.car.update({
      where: { id },
      data: dbUpdates
    })
    
    console.log('✅ Car updated successfully with edit tracking')
    
    return NextResponse.json({
      success: true,
      message: 'Car updated successfully',
      car: {
        ...updatedCar,
        price: updatedCar.price.toString(), // Convert BigInt back to string
        images: Array.isArray(updatedCar.images) ? updatedCar.images : []
      }
    })
    
  } catch (error: any) {
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

// DELETE - Remove car with async params
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // FIXED: Await params in Next.js 15
    const { id } = await params
    
    console.log('🗑️ Deleting car:', id)
    
    const deletedCar = await prisma.car.delete({
      where: { id }
    })
    
    console.log('✅ Car deleted successfully:', deletedCar.title)
    
    return NextResponse.json({
      success: true,
      message: 'Car deleted successfully'
    })
    
  } catch (error: any) {
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

// GET - Fetch single car with async params
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // FIXED: Await params in Next.js 15
    const { id } = await params
    
    const car = await prisma.car.findUnique({
      where: { id }
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
