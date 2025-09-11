/* ----------  app/api/cars/route.ts  ---------- */
export const dynamic = 'force-dynamic'

import { normalizeCar } from '@/lib/parsers/car-normalizer'
import { NextRequest, NextResponse } from 'next/server'
import { carStreetsOLXScraper } from '../../lib/scrapers/hybrid-olx-scraper'
import { fetchCars } from '../../lib/database/db'
import { prisma } from '../../lib/prisma'
import { Car } from '../../types'

export const revalidate = 3600  // ISR - 1 hour

/* ───────────────── Helper Functions ───────────────── */
const normalizePrice = (price: unknown) =>
  typeof price === 'bigint' ? Number(price) : price

function normalizeFuelType(fuel: string): Car['fuelType'] {
  const validTypes = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'] as const
  return validTypes.includes(fuel as any) ? (fuel as Car['fuelType']) : 'Petrol'
}

function normalizeTransmission(transmission: string): Car['transmission'] {
  const validTypes = ['Manual', 'Automatic'] as const
  return validTypes.includes(transmission as any) ? (transmission as Car['transmission']) : 'Manual'
}

function normalizeSellerType(seller: string): Car['sellerType'] {
  const validTypes = ['Dealer', 'Individual'] as const
  return validTypes.includes(seller as any) ? (seller as Car['sellerType']) : 'Individual'
}

const makeSafe = <T extends {
  price: unknown
  attribution?: unknown
  fuelType?: string
  transmission?: string
  sellerType?: string
}>(cars: T[]) =>
  cars.map(c => ({
    ...c,
    price: normalizePrice(c.price),
    attribution: c.attribution ?? undefined,
    fuelType: normalizeFuelType(c.fuelType || 'Petrol'),
    transmission: normalizeTransmission(c.transmission || 'Manual'),
    sellerType: normalizeSellerType(c.sellerType || 'Individual')
  }))

/* ───────────────── Route Handler ───────────────── */
export async function GET(request: NextRequest) {
  try {
    await prisma.$connect()
    const dbCarCount = await prisma.car.count()

    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === 'true'

    /* ---------- force scrape ---------- */
    if (forceRefresh) {
      const freshCars = await carStreetsOLXScraper.scrapeCarStreetsProfile()
      // @ts-ignore - TODO: Fix literal type inference
      const safeCars = makeSafe(freshCars)

      return NextResponse.json({
        success: true,
        cars: safeCars,
        count: safeCars.length,
        source: 'fresh-database-scraping',
        database: { connected: true, existingCars: dbCarCount },
        timestamp: new Date().toISOString(),
        message: 'Fresh data generated and saved to database'
      })
    }

    /* ---------- normal path ---------- */
    const cars = await carStreetsOLXScraper.scrapeCarStreetsProfile()
    // @ts-ignore - TODO: Fix literal type inference
    const safeCars = makeSafe(cars)

    return NextResponse.json({
      success: true,
      cars: safeCars,
      count: safeCars.length,
      source: 'database-managed-scraping',
      database: { connected: true, existingCars: dbCarCount },
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    /* ---------- DB failed – fall back ---------- */
    try {
      const fallbackCars = await fetchCars()
      const safeCars = makeSafe(fallbackCars)

      return NextResponse.json({
        success: false,
        cars: safeCars,
        count: safeCars.length,
        error: err instanceof Error ? err.message : 'Unknown error',
        source: 'database-fallback',
        database: { connected: false, error: 'Connection failed' },
        timestamp: new Date().toISOString()
      })
    } catch {
      /* ---------- fallback failed too ---------- */
      return NextResponse.json(
        {
          success: false,
          cars: [],
          count: 0,
          error: 'Complete system failure – please try again later',
          source: 'total-failure',
          database: { connected: false, error: 'Total database failure' },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }
  }
}

/* EOF */
