/* ----------  app/api/cars/profile/route.ts  ---------- */
import { normalizeCar } from '@/lib/parsers/car-normalizer'
import { NextRequest, NextResponse } from 'next/server'
import { carStreetsOLXScraper } from '../../../lib/scrapers/olx-profile'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const maxItems = parseInt(searchParams.get('maxItems') || '50')
    
    // Scrape CarStreets OLX profile
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

/* EOF */
