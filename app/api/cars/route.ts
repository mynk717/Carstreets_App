/* ----------  app/api/cars/route.ts  ---------- */
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { carStreetsOLXScraper } from '../../lib/scrapers/hybrid-olx-scraper'
import { fetchCars } from '../../lib/database/db'
import { prisma } from '../../lib/prisma'

export const revalidate = 3600               // ISR – 1 h

export async function GET(request: NextRequest) {
  try {
    /* ----- quick DB-health check ----- */
    await prisma.$connect()
    const dbCarCount = await prisma.car.count()

    const url = new URL(request.url)
    const forceRefresh = url.searchParams.get('refresh') === 'true'

    /* ---------- force scrape ---------- */
    if (forceRefresh) {
      const freshCars = await carStreetsOLXScraper.scrapeCarStreetsProfile()

      return NextResponse.json({
        success: true,
        cars: freshCars,
        count: freshCars.length,
        source: 'fresh-database-scraping',
        database: { connected: true, existingCars: dbCarCount },
        timestamp: new Date().toISOString(),
        message: 'Fresh data generated and saved to database'
      })
    }

    /* ---------- normal path ---------- */
    const cars = await carStreetsOLXScraper.scrapeCarStreetsProfile()

    return NextResponse.json({
      success: true,
      cars,
      count: cars.length,
      source: 'database-managed-scraping',
      database: { connected: true, existingCars: dbCarCount },
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    /* ---------- DB failed – fall back ---------- */
    try {
      const fallbackCars = await fetchCars()

      return NextResponse.json({
        success: false,
        cars: fallbackCars,
        count: fallbackCars.length,
        error: err instanceof Error ? err.message : 'Unknown error',
        source: 'database-fallback',
        database: { connected: false, error: 'Connection failed' },
        timestamp: new Date().toISOString()
      })
    } catch (fallbackErr) {
      /* ---------- fallback failed too ---------- */
      return NextResponse.json({
        success: false,
        cars: [],
        count: 0,
        error: 'Complete system failure – please try again later',
        source: 'total-failure',
        database: { connected: false, error: 'Total database failure' },
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
  }
}

/* EOF */
