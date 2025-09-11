/* ----------  app/api/cars/profile/route.ts  ---------- */
import { normalizeCar } from '@/lib/parsers/car-normalizer'
import { NextRequest, NextResponse } from 'next/server'
import { carStreetsOLXScraper } from '../../../lib/scrapers/olx-profile'

export async function GET(request: NextRequest) {
  // GET should not trigger scraping - redirect to proper scraping endpoint
  return NextResponse.json({
    error: 'Profile scraping should be done via POST method',
    message: 'Use POST /api/cars/profile?maxItems=50 to scrape profile data',
    recommendedEndpoint: 'POST /api/cars/profile'
  }, { status: 405 })
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const maxItems = parseInt(searchParams.get('maxItems') || '50')
    
    // Only scrape when explicitly requested via POST
    const profileCars = await carStreetsOLXScraper.scrapeCarStreetsProfile({ maxItems })

    // Convert prices and ensure attribution to satisfy Car type
    const safeCars = profileCars.map(car => ({
      ...car,
      price: typeof car.price === 'bigint' ? Number(car.price) : car.price,
      attribution: car.attribution ?? undefined
    }))

    const attribution = carStreetsOLXScraper.getAttribution()

    return NextResponse.json({
      cars: safeCars,
      count: safeCars.length,
      attribution,
      source: 'olx-carstreets-profile-scrape',
      profileId: '569969876',
      profileUrl: 'https://www.olx.in/profile/569969876',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error scraping profile cars:', error)
    return NextResponse.json(
      { error: 'Failed to scrape profile cars', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/* EOF */
