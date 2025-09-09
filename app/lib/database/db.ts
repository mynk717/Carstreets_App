import { PrismaClient } from '@prisma/client'
import { Car } from '../../types'

// Prisma setup for Google Cloud PostgreSQL
const prisma = new PrismaClient()

// Save cars using Prisma (Google Cloud PostgreSQL)
export async function saveCars(cars: any[]) {
  await prisma.car.deleteMany() // Clear old data

  for (const car of cars) {
    await prisma.car.create({
      data: {
        title: car.title,
        brand: car.brand,
        model: car.model,
        variant: car.variant || null,
        price: car.price,
        year: car.year,
        fuelType: car.fuelType,
        transmission: car.transmission,
        kmDriven: car.kmDriven,
        location: car.location,
        images: JSON.stringify(car.images),
        description: car.description,
        sellerType: car.sellerType,
        postedDate: car.postedDate,
        owners: car.owners,
        isVerified: car.isVerified,
        isFeatured: car.isFeatured,
        dataSource: car.dataSource,
        olxProfile: car.olxProfile,
        olxProfileId: car.olxProfileId,
        originalUrl: car.originalUrl,
        attribution: car.attribution,
        carStreetsListed: car.carStreetsListed,
      },
    })
  }
}

// Fetch cars from Google Cloud PostgreSQL
export async function fetchCars() {
  const cars = await prisma.car.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return cars.map(car => ({
    ...car,
    images: JSON.parse(car.images),
  }))
}

// Clean up Prisma connection
export async function closePrisma() {
  await prisma.$disconnect()
}
