import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth/admin'
import { prisma } from '@/lib/database/db'

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete all cars from database
    const result = await prisma.car.deleteMany({})
    
    return NextResponse.json({ 
      success: true, 
      deleted: result.count,
      message: 'All cars purged from database' 
    })
  } catch (error) {
    console.error('Purge failed:', error)
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}
