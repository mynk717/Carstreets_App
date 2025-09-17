// app/api/admin/scrape/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { carStreetsOLXScraper } from '@/lib/scrapers/hybrid-olx-scraper'
import { smartMergeScrapedCars } from '@/lib/database/smartMerge'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 API ROUTE: Starting scrape process...')
    
    const freshCars = await carStreetsOLXScraper.scrapeCarStreetsProfile()
    
    // Use smart merge instead of destructive save
    const mergeResults = await smartMergeScrapedCars(freshCars)

    return NextResponse.json({
      success: true,
      message: 'Cars scraped and smart-merged successfully',
      results: mergeResults, // Returns added, updated, preserved, removed, errors counts
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
    message: 'Use POST /api/admin/scrape to trigger new car scraping'
  }, { status: 405 })
}