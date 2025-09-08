import { NextRequest, NextResponse } from 'next/server'
import { carStreetsOLXScraper } from '../../../lib/scrapers/olx-profile'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const maxItems = parseInt(searchParams.get('maxItems') || '50')
    
    // Scrape CarStreets OLX profile
    const profileCars = await carStreetsOLXScraper.scrapeCarStreetsProfile({
      maxItems
    })
    
    const attribution = carStreetsOLXScraper.getAttribution()
    
    return NextResponse.json({
      cars: profileCars,
      count: profileCars.length,
      attribution,
      source: 'olx-carstreets-profile',
      profileId: '569969876',
      profileUrl: 'https://www.olx.in/profile/569969876'
    })
  } catch (error) {
    console.error('Error fetching profile cars:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile cars' },
      { status: 500 }
    )
  }
}
