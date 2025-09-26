/* ----------  app/lib/database/db.ts  ---------- */
import { PrismaClient } from '@prisma/client'
import { smartMergeScrapedCars } from './smartMerge'

const prisma = new PrismaClient()

function normaliseCar(raw: any) {
  /* price -> BigInt */
  const priceBig =
    raw.price === undefined
      ? BigInt(0)
      : typeof raw.price === 'string'
          ? BigInt(parseInt(raw.price.replace(/\D/g, ''), 10) || 0)
          : BigInt(raw.price)

  /* images -> string[]  (handles array OR comma-joined string) */
  let imgs: string[] = []
  if (raw.images) {
    if (Array.isArray(raw.images)) {
      imgs = raw.images
    } else if (typeof raw.images === 'string') {
      try {
        // Handle Json field - might be stringified JSON
        const parsed = JSON.parse(raw.images)
        imgs = Array.isArray(parsed) ? parsed : [raw.images]
      } catch {
        // If not valid JSON, treat as single image or comma-separated
        imgs = raw.images.split(',').map(s => s.trim()).filter(Boolean)
      }
    } else if (typeof raw.images === 'object') {
      // Already parsed Json object
      imgs = Array.isArray(raw.images) ? raw.images : []
    }
  }

  /* upgrade OLX thumb size */
  imgs = imgs.map(u => u.replace(/;s=\d+x\d+/, ';s=780'))

  return { ...raw, price: priceBig, images: imgs }
}

// toDbCar adapter - ensures all fields are properly typed for Prisma
const toDbCar = (c: any) => ({
  ...c,
  year:
    typeof c.year === 'number'
      ? c.year
      : parseInt(String(c.year).replace(/[^0-9]/g, ''), 10) ||
        new Date().getFullYear() - 3,
  kmDriven:
    typeof c.kmDriven === 'number'
      ? c.kmDriven
      : parseInt(String(c.kmDriven).replace(/[^0-9]/g, ''), 10) || 0,
  owners:
    typeof c.owners === 'number'
      ? c.owners
      : parseInt(String(c.owners).replace(/[^0-9]/g, ''), 10) || 1,
  price:
    typeof c.price === 'bigint'
      ? Number(c.price)
      : typeof c.price === 'string'
      ? parseInt(c.price.replace(/[^0-9]/g, ''), 10) || 0
      : c.price,
  // RELAXED image filtering - accept any reasonable image URLs
  images: (() => {
  let imageArray: string[] = []
  
  if (Array.isArray(c.images)) {
    imageArray = c.images
  } else if (typeof c.images === 'string') {
    try {
      imageArray = JSON.parse(c.images)
    } catch {
      imageArray = [c.images]
    }
  }
  
  return imageArray.filter(img => img && img.length > 10 && (img.startsWith('http') || img.startsWith('/')))
})()
})

/* ---------- SMART MERGE WRITE ---------- */
export async function saveScrapedCars(cars: any[]) {
  console.log(`🚀 Starting smart save of ${cars.length} scraped cars...`)
  
  // Normalize cars before merging
  const normalizedCars = cars.map(car => normaliseCar(car))
  
  // Use smart merge instead of destructive replace
  const results = await smartMergeScrapedCars(normalizedCars)
  
  console.log(`✅ Smart save completed:
    📥 ${results.added} new cars added
    🔄 ${results.updated} cars updated  
    🛡️ ${results.preserved} manual edits preserved
    🗑️ ${results.removed} old cars removed
    ❌ ${results.errors} errors`)
    
  return results
}

/* ---------- LEGACY DESTRUCTIVE WRITE (for initial import) ---------- */
export async function saveCars(cars: any[]) {
  console.log('⚠️ DESTRUCTIVE: Bulk replacing all cars')
  await prisma.car.deleteMany()
  for (const car of cars) {
    await prisma.car.create({ data: toDbCar(normaliseCar(car)) })
  }
}

/* ---------- READ ---------- */
export async function fetchCars() {
  const cars = await prisma.car.findMany({ orderBy: { createdAt: 'desc' } })
  return cars.map(c => ({
    ...c,
    images: Array.isArray(c.images)
      ? c.images
      : typeof c.images === 'string'
        ? JSON.parse(c.images)
        : [],
    price: c.price && Number(c.price) > 0 
  ? `₹${Number(c.price).toLocaleString('en-IN')}`
  : 'Contact for price'
  }))
}

export async function fetchCarById(carId: string) {
  const car = await prisma.car.findUnique({
    where: { id: carId }
  })
  return car
}

/* ---------- CLOSE ---------- */
export async function close() {
  await prisma.$disconnect()
}

export { prisma }
/* EOF */
