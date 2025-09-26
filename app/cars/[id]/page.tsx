import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import Link from 'next/link'
import { CarDetailClient } from './CarDetailClient'

// FIXED: Make params async for Next.js 15
type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // FIXED: Await params in Next.js 15
  const { id } = await params
  const car = await prisma.car.findUnique({ where: { id } })
  
  if (!car) {
    return {
      title: 'Car not found | CarStreets',
      description: 'This car is no longer available.'
    }
  }

  const site = 'https://carstreets-app.vercel.app'
  const imagesArray = Array.isArray(car.images) 
    ? car.images as string[]
    : typeof car.images === 'string' 
    ? JSON.parse(car.images as string) as string[]
    : []
    
  const coverImage = imagesArray[0] || `${site}/placeholder-car.jpg`
  const url = `${site}/cars/${car.id}`
  const priceStr = `₹${Number(car.price).toLocaleString('en-IN')}`
  const title = `${car.title} | ${priceStr} | CarStreets`
  const description = `${car.brand} ${car.model} • ${car.year} • ${car.fuelType} • ${car.kmDriven?.toLocaleString()} km • ${car.location}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'CarStreets - Buy & Sell Used Cars',
      type: 'article',
      images: [{ 
        url: coverImage, 
        width: 1200, 
        height: 630, 
        alt: car.title 
      }]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [coverImage]
    }
  }
}

export default async function CarPage({ params }: Props) {
  // FIXED: Await params in Next.js 15
  const { id } = await params
  const car = await prisma.car.findUnique({ where: { id } })
  
  if (!car) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚗</div>
          <h1 className="text-2xl font-bold mb-4">Car Not Found</h1>
          <p className="text-gray-600 mb-6">This car is no longer available.</p>
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to All Cars
          </Link>
        </div>
      </div>
    )
  }

  return <CarDetailClient car={car} />
}
