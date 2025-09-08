import { NextRequest } from 'next/server'
import { carStreetsOLXScraper } from '../../lib/scrapers/hybrid-olx-scraper'

export const revalidate = 3600 // Cache for 1 hour

// BigInt serializer
const replacer = (key: string, value: any) => {
  if (typeof value === 'bigint') {
    return value.toString()
  }
  return value
}


import { NextRequest, NextResponse } from 'next/server'
import { carStreetsOLXScraper } from '../../lib/scrapers/hybrid-olx-scraper'
import { getCarsFromDatabase } from '../../lib/database/db'

export const revalidate = 3600 // Cache for 1 hour

export async function GET(request: NextRequest) {
  console.log('🚀 /api/cars called - using database-backed scraping...')
  
  try {
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === 'true'
    
    if (forceRefresh) {
      console.log('🔄 Force refresh requested - running fresh scraping...')
      const freshCars = await carStreetsOLXScraper.scrapeCarStreetsProfile()
      
      return new Response(JSON.stringify({

      return NextResponse.json({
        success: true,
        cars: freshCars,
        count: freshCars.length,
        source: 'fresh-database-scraping',
        timestamp: new Date().toISOString(),
        message: 'Fresh data generated and saved to database'
      }, replacer), {
        headers: { 'Content-Type': 'application/json' }

      })
    }
    
    // Normal flow - use database (will scrape weekly automatically)
    const cars = await carStreetsOLXScraper.scrapeCarStreetsProfile()
    
    return new Response(JSON.stringify({

    return NextResponse.json({
      success: true,
      cars: cars,
      count: cars.length,
      source: 'database-managed-scraping',
      timestamp: new Date().toISOString(),
      message: 'Data served from intelligent database system'
 
    }, replacer), {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('❌ API Error:', error)
    
    return new Response(JSON.stringify({
      success: false,
      cars: [],
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'total-failure'
    }, replacer), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })

    // Final fallback - try to get any existing database data
    try {
      const fallbackCars = await getCarsFromDatabase()
      return NextResponse.json({
        success: false,
        cars: fallbackCars,
        count: fallbackCars.length,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'database-fallback'
      })
    } catch (dbError) {
      return NextResponse.json({
        success: false,
        cars: [],
        count: 0,
        error: 'Complete system failure - please try again later',
        source: 'total-failure'
      }, { status: 500 })
    }
  }
}
