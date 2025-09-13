// app/api/admin/scrape/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { carStreetsOLXScraper } from '@/lib/scrapers/hybrid-olx-scraper'
import { saveCars } from '@/lib/database/db'
import { verifyAdminAuth } from '@/lib/auth/admin'


export async function POST(request: NextRequest) {
  try {
    // Auth check (implement basic for now)
    const authResult = await verifyAdminAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fresh scrape with new profile
    const freshCars = await carStreetsOLXScraper.scrapeCarStreetsProfile()
    await saveCars(freshCars)

    return NextResponse.json({
      success: true,
      message: 'Fresh data scraped and saved',
      count: freshCars.length,
      profileId: '401445222',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}
