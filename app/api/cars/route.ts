/* ----------  app/api/cars/route.ts  ---------- */
export const dynamic = 'force-dynamic'

import { normalizeCar } from '@/lib/parsers/car-normalizer'
import { NextRequest, NextResponse } from 'next/server'
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

    // Only fetch from database - no more scraping on reload
    const cars = await fetchCars()
    const safeCars = makeSafe(cars)

    return NextResponse.json({
      success: true,
      cars: safeCars,
      count: safeCars.length,
      source: 'database',
      database: { connected: true, existingCars: dbCarCount },
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    return NextResponse.json({
      success: false,
      cars: [],
      count: 0,
      error: err instanceof Error ? err.message : 'Database fetch failed',
      source: 'database-error',
      database: { connected: false, error: 'Connection failed' },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/* EOF */
