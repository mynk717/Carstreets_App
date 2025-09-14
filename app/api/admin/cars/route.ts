import { NextRequest, NextResponse } from 'next/server'
// import { prisma } from '@/lib/prisma'

// POST - Create new car
export async function POST(request: NextRequest) {
  try {
    const carData = await request.json()
    
    // Generate unique ID if not provided
    if (!carData.id || carData.id.includes('new_') || carData.id.includes('temp_')) {
      carData.id = `car_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // Set timestamps
    carData.createdAt = new Date()
    carData.updatedAt = new Date()
    
    // Save to database
    // const savedCar = await prisma.car.create({
    //   data: carData
    // })

    return NextResponse.json({
      success: true,
      message: 'Car added successfully',
      car: carData
    })
  } catch (error) {
    console.error('Error adding car:', error)
    return NextResponse.json({
      error: 'Failed to add car'
    }, { status: 500 })
  }
}
