/* ----------  app/api/scrape/route.ts  ---------- */
import { NextRequest, NextResponse } from 'next/server'
import { carStreetsOLXScraper } from '../../lib/scrapers/hybrid-olx-scraper'
import { smartMergeScrapedCars } from '../../lib/database/smartMerge'

export async function POST(request: NextRequest) {
  try {
    // Only allow scraping via POST for admin control
    const freshCars = await carStreetsOLXScraper.scrapeCarStreetsProfile()
    
    // Save to database
const mergeResults = await smartMergeScrapedCars(freshCars)
    console.log('Merge Results:', mergeResults)
    return NextResponse.json({
      success: true,
      message: 'Cars scraped and smart-merged successfully',
      count: freshCars.length,
      source: 'fresh-scraping',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
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
