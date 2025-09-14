// app/api/admin/scrape/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { carStreetsOLXScraper } from '@/lib/scrapers/hybrid-olx-scraper'
import { saveCars } from '@/lib/database/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 API ROUTE: Starting scrape process...')
    console.log('🚀 DATABASE_URL exists:', !!process.env.DATABASE_URL)
    console.log('🚀 OLX_PROFILE_ID:', process.env.OLX_PROFILE_ID)
    
    // Only allow scraping via POST for admin control
    console.log('🚀 Calling carStreetsOLXScraper.scrapeCarStreetsProfile()...')
    const freshCars = await carStreetsOLXScraper.scrapeCarStreetsProfile()
    console.log('🚀 Scraper returned:', freshCars ? freshCars.length : 'null', 'cars')
    
    if (freshCars && freshCars.length > 0) {
      console.log('🚀 Saving', freshCars.length, 'cars to database...')
      await saveCars(freshCars)
      console.log('🚀 Successfully saved cars to database')
    }
    
    return NextResponse.json({
      success: true,
      message: 'Cars scraped and saved successfully',
      count: freshCars.length,
      source: 'fresh-scraping',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('🚀 SCRAPE ERROR:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Scraping failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    error: 'Scraping should be done via POST method only',
    message: 'Use POST /api/scrape to trigger new car scraping'
  }, { status: 405 })
}
/* EOF */