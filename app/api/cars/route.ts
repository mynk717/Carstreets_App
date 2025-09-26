import { NextRequest, NextResponse } from 'next/server'
import { fetchCars } from '@/lib/database/db' // Use your existing helper

export async function GET(request: NextRequest) {
  try {
    console.log('📡 Fetching cars from database...')
    
    // Use your existing fetchCars function which handles normalization
    const cars = await fetchCars()
    
    console.log(`✅ Fetched ${cars.length} cars from database`)
    
    return NextResponse.json({
      success: true,
      cars: cars,
      source: 'database',
      cacheInfo: `${cars.length} cars from PostgreSQL`,
      count: cars.length
    })
    
  } catch (error) {
    console.error('❌ Error fetching cars:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch cars from database',
      cars: [], // Return empty array as fallback
      source: 'error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
