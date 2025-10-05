import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { DealerCarCard } from './CarCard'

interface PageProps {
  params: Promise<{ subdomain: string }>
}

export default async function DealerStorefront({ params }: PageProps) {
  const { subdomain } = await params
  
  const dealer = await prisma.dealer.findUnique({
    where: { subdomain },
    include: {
      cars: {
        where: { carStreetsListed: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  if (!dealer) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dealer Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            {dealer.logo && (
              <img src={dealer.logo} alt={dealer.name} className="w-16 h-16 rounded-full object-cover" />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {dealer.businessName || dealer.name}
              </h1>
              {dealer.location && (
                <p className="text-gray-600 flex items-center gap-1">
                  <span>📍</span> {dealer.location}
                </p>
              )}
            </div>
          </div>
          {dealer.description && (
            <p className="mt-4 text-gray-700">{dealer.description}</p>
          )}
        </div>
      </header>

      {/* Car Grid */}
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Available Cars ({dealer.cars.length})</h2>
        
        {dealer.cars.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">No cars available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dealer.cars.map((car) => (
              <DealerCarCard key={car.id} car={car} dealerSubdomain={subdomain} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-12 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-300">© 2025 {dealer.businessName || dealer.name}</p>
          <p className="text-sm text-gray-500 mt-2">
            Powered by <span className="text-blue-400">MotoYard</span>
          </p>
        </div>
      </footer>
    </div>
  )
}
