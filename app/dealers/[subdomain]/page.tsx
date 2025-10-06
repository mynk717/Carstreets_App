import { notFound } from 'next/navigation'
import {prisma} from '@/lib/prisma'
import { DealerCarCard } from './CarCard'

interface PageProps {
  params: Promise<{ subdomain: string }>
}

export default async function DealerStorefront({ params }: PageProps) {
  // FIXED: Properly await and validate params
  const resolvedParams = await params
  const { subdomain } = resolvedParams
  
  if (!subdomain) {
    console.error('Missing subdomain parameter')
    notFound()
  }

  console.log('Dealer storefront params:', { subdomain }) // Debug log
  
  try {
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
      console.log('Dealer not found:', subdomain)
      notFound()
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Clean Dealer Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-6">
              {dealer.logo && (
                <img 
                  src={dealer.logo} 
                  alt={dealer.name} 
                  className="w-20 h-20 rounded-2xl object-cover shadow-lg border-2 border-gray-100" 
                />
              )}
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {dealer.businessName || dealer.name}
                </h1>
                {dealer.location && (
                  <p className="text-gray-600 flex items-center gap-2 text-lg">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {dealer.location}
                  </p>
                )}
                {dealer.description && (
                  <p className="mt-3 text-gray-700 text-lg leading-relaxed max-w-2xl">
                    {dealer.description}
                  </p>
                )}
                
                {/* Contact Info with Fixed URLs */}
                <div className="mt-4 flex items-center gap-4">
                  {dealer.phoneNumber && (
                    <a 
                      href={`tel:${dealer.phoneNumber}`}
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {dealer.phoneNumber}
                    </a>
                  )}
                  <a 
                    href={`https://api.whatsapp.com/send?phone=${dealer.phoneNumber}&text=${encodeURIComponent('Hi! I am interested in your car inventory.')}`}
                    className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.309"/>
                    </svg>
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Car Grid */}
        <main className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Available Cars ({dealer.cars.length})
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-gray-500">Showing {dealer.cars.length} cars</span>
              {/* Future: Add sort/filter dropdown */}
            </div>
          </div>

          {dealer.cars.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No cars available</h3>
              <p className="text-gray-600 mb-6">We're updating our inventory. Check back soon for new arrivals!</p>
              <a 
                href={`https://api.whatsapp.com/send?phone=${dealer.phoneNumber}&text=${encodeURIComponent('Hi! When will you have new cars available?')}`}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
                target="_blank" 
                rel="noopener noreferrer"
              >
                Get Notified
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {dealer.cars.map((car) => (
                <DealerCarCard 
                  key={car.id} 
                  car={car} 
                  dealerSubdomain={subdomain} 
                />
              ))}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white mt-20 py-12">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-2xl font-bold mb-2">{dealer.businessName || dealer.name}</h3>
            <p className="text-gray-300 mb-4">{dealer.location}</p>
            <p className="text-sm text-gray-400">
              © 2025 {dealer.businessName || dealer.name}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Powered by <span className="text-blue-400 font-medium">MotoYard</span>
            </p>
          </div>
        </footer>
      </div>
    )
  } catch (error) {
    console.error('Database error in dealer storefront:', error)
    notFound()
  }
}
