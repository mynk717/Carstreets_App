export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { carStreetsOLXScraper } from '../../lib/scrapers/hybrid-olx-scraper'
import { fetchCars } from '../../lib/database/db' // ✅ Fixed import
import { prisma } from '../../lib/prisma' // ← ADD THIS: Import your existing Prisma singleton

export const revalidate = 3600

export async function GET(request: NextRequest) {
  console.log('🚀 /api/cars called - using database-backed scraping...')
  
  try {
    // ✨ ADD THIS: Quick database connection test
    console.log('🔍 Testing database connection...')
    await prisma.$connect()
    const dbCarCount = await prisma.car.count()
    console.log(`✅ Database connected! Current cars in DB: ${dbCarCount}`)
    
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === 'true'
    
    if (forceRefresh) {
      console.log('🔄 Force refresh requested - running fresh scraping...')
      const freshCars = await carStreetsOLXScraper.scrapeCarStreetsProfile()
      
      return NextResponse.json({
        success: true,
        cars: freshCars,
        count: freshCars.length,
        source: 'fresh-database-scraping',
        database: { connected: true, existingCars: dbCarCount }, // ← ADD THIS
        timestamp: new Date().toISOString(),
        message: 'Fresh data generated and saved to database'
      })
    }
    
    const cars = await carStreetsOLXScraper.scrapeCarStreetsProfile()
    
    return NextResponse.json({
      success: true,
      cars: cars,
      count: cars.length,
      source: 'database-managed-scraping',
      database: { connected: true, existingCars: dbCarCount }, // ← ADD THIS  
      timestamp: new Date().toISOString(),
      message: 'Data served from intelligent database system'
    })
    
  } catch (error) {
    console.error('❌ API Error:', error)
    
    try {
      const fallbackCars = await fetchCars() // ✅ Fixed function call
      
      return NextResponse.json({
        success: false,
        cars: fallbackCars,
        count: fallbackCars.length,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'database-fallback',
        database: { connected: false, error: 'Connection failed' }, // ← ADD THIS
        timestamp: new Date().toISOString()
      })
    } catch (dbError) {
      console.error('❌ Database fallback failed:', dbError)
      return NextResponse.json({
        success: false,
        cars: [],
        count: 0,
        error: 'Complete system failure - please try again later',
        source: 'total-failure',
        database: { connected: false, error: 'Total database failure' }, // ← ADD THIS
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
  }
}
