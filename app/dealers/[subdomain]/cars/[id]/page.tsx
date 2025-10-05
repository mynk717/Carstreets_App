import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ subdomain: string; id: string }>
}

export default async function CarDetailPage({ params }: PageProps) {
  const { subdomain, id } = await params
  
  const car = await prisma.car.findUnique({
    where: { id },
    include: {
      dealer: true,
    },
  })

  if (!car || car.dealer?.subdomain !== subdomain) {
    notFound()
  }

  const images = Array.isArray(car.images) ? car.images as string[] : []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href={`/dealers/${subdomain}`} className="text-blue-600 hover:underline">
            ← Back to {car.dealer?.businessName || 'Listings'}
          </Link>
        </div>
      </div>

      {/* Car Details */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            {images.length > 0 && (
              <div className="bg-white rounded-lg overflow-hidden">
                <img src={images[0]} alt={car.title} className="w-full aspect-[16/9] object-contain" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="bg-white rounded-lg p-6">
            <h1 className="text-3xl font-bold mb-4">{car.title}</h1>
            <p className="text-4xl font-bold text-blue-600 mb-6">
              ₹{Number(car.price).toLocaleString('en-IN')}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="text-gray-500">Year:</span>
                <p className="font-medium">{car.year}</p>
              </div>
              <div>
                <span className="text-gray-500">KM Driven:</span>
                <p className="font-medium">{car.kmDriven.toLocaleString()} km</p>
              </div>
              <div>
                <span className="text-gray-500">Fuel:</span>
                <p className="font-medium">{car.fuelType}</p>
              </div>
              <div>
                <span className="text-gray-500">Transmission:</span>
                <p className="font-medium">{car.transmission}</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-700">{car.description}</p>
            </div>

            <div className="mt-6">
              <a
                href={`https://api.whatsapp.com/send?phone=919009008756&text=${encodeURIComponent(`I'm interested in ${car.title}`)}`}
                className="block w-full bg-green-500 text-white py-3 rounded-lg text-center font-medium hover:bg-green-600"
                target="_blank"
                rel="noopener noreferrer"
              >
                Contact on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
