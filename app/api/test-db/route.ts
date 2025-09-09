export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '../../lib/prisma'

export async function GET() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    const carCount = await prisma.car.count()
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      carCount: carCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
