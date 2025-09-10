/* ----------  app/lib/database/db.ts  ---------- */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function normaliseCar(raw: any) {
  /* price → BigInt */
  const priceBig =
    raw.price === undefined
      ? BigInt(0)
      : typeof raw.price === 'string'
          ? BigInt(parseInt(raw.price.replace(/\D/g, ''), 10) || 0)
          : BigInt(raw.price)

  /* images → string[]  (handles array OR comma-joined string) */
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

/* ---------- WRITE ---------- */
export async function saveCars(cars: any[]) {
  await prisma.car.deleteMany()
  for (const car of cars) {
    await prisma.car.create({ data: normaliseCar(car) })
  }
}

/* ---------- READ ---------- */
export async function fetchCars() {
  const cars = await prisma.car.findMany({ orderBy: { createdAt: 'desc' } })
  return cars.map(c => ({
    ...c,
    images: Array.isArray(c.images) ? c.images : JSON.parse(c.images),
    price: Number(c.price).toLocaleString('en-IN')
  }))
}

/* ---------- CLOSE ---------- */
export async function close() {
  await prisma.$disconnect()
}

/* EOF */
