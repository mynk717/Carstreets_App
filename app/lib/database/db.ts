/* ----------  app/lib/database/db.ts  ---------- */
import { PrismaClient } from '@prisma/client'

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
      imgs = raw.images
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
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
  images: Array.isArray(c.images) 
    ? c.images.filter(img => img && img.length > 10 && (img.startsWith('http') || img.startsWith('/')))
    : []
})


/* ---------- WRITE ---------- */
export async function saveCars(cars: any[]) {
  await prisma.car.deleteMany()
  for (const car of cars) {
    // Apply both normalizations: normaliseCar + toDbCar adapter
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
