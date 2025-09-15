import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'

type Props = { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const car = await prisma.car.findUnique({ where: { id: params.id } })
  
  if (!car) {
    return {
      title: 'Car not found | CarStreets',
      description: 'This car is no longer available.'
    }
  }

  const site = 'https://carstreets-app.vercel.app'
  
  // FIX: Properly handle Prisma Json field and type assertion
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
      // FIX: Ensure string type for Twitter image
      images: [coverImage]
    }
  }
}

export default async function CarPage({ params }: Props) {
  const car = await prisma.car.findUnique({ where: { id: params.id } })
  
  if (!car) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Car Not Found</h1>
        <p className="text-gray-600">This car is no longer available.</p>
        <a href="/" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Back to Home
        </a>
      </div>
    )
  }

  // FIX: Properly convert types for client
  const imagesArray = Array.isArray(car.images) 
    ? car.images as string[]
    : typeof car.images === 'string' 
    ? JSON.parse(car.images as string) as string[]
    : []

  const imageUrl = imagesArray[0] || '/placeholder-car.jpg'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <a href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to All Cars
          </a>
          <h1 className="text-3xl font-bold text-gray-900">{car.title}</h1>
          <p className="text-gray-600 text-lg">{car.location}</p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Image */}
          <div className="aspect-[16/9] bg-gray-100">
            <img
              src={imageUrl}
              alt={car.title}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Car Details */}
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-blue-600 mb-2">
                  ₹{Number(car.price).toLocaleString('en-IN')}
                </h2>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>{car.year}</span>
                  <span>{car.fuelType}</span>
                  <span>{car.kmDriven?.toLocaleString()} km</span>
                  <span>{car.owners} owner</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                {car.isVerified && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    ✓ Verified
                  </span>
                )}
                {car.isFeatured && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    ⭐ Featured
                  </span>
                )}
              </div>
            </div>

            {/* Contact */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-4">Interested?</h3>
              <div className="flex gap-4">
                <a
                  href="tel:+919009008756"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
                  📞 Call Now
                </a>
                <a
                  href={`https://wa.me/919009008756?text=Hi, I'm interested in ${car.title}`}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  💬 WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
