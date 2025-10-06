'use client'

import { Car } from '../../types'
import { CarImage } from './CarImage'
import Link from 'next/link'

interface CarGridProps {
  cars: Car[]
  loading: boolean
  dealerSubdomain?: string // Optional dealer context for links
}

export function CarGrid({ cars, loading, dealerSubdomain = 'carstreets' }: CarGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
            <div className="w-full aspect-[16/9] bg-gray-200" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-6 bg-gray-200 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (cars.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🚗</div>
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No cars found</h3>
        <p className="text-gray-500">Try adjusting your filters or check back later.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cars.map((car) => {
        // FIXED: Use dealerSubdomain prop for all cars (since Car type doesn't have dealer field)
        const carDetailUrl = `/dealers/${dealerSubdomain}/cars/${car.id}`
        
        return (
          <div key={car.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200">
            <Link href={carDetailUrl} className="block">
              <CarImage car={car} />
            </Link>
            
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2 text-gray-900 line-clamp-2">
                {car.title}
              </h3>
              
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-600 text-sm">{car.location}</p>
                {car.isVerified && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    ✓ Verified
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <p className="text-blue-600 font-bold text-xl">
                  {typeof car.price === 'string' && car.price.includes('₹') 
                    ? car.price 
                    : `₹${car.price?.toString().replace(/₹/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`}
                </p>
                {car.isFeatured && (
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                    ⭐ Featured
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4">
                <span>{car.year} • {car.fuelType}</span>
                <span>{car.kmDriven?.toLocaleString()} km</span>
                <span>{car.transmission}</span>
                <span>{car.owners} owner{car.owners !== 1 ? 's' : ''}</span>
              </div>

              {/* FIXED: Multi-tenant URL using dealerSubdomain prop */}
              <Link 
                href={carDetailUrl}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center block"
              >
                View Details
              </Link>
              
              {car.carStreetsListed && (
                <div className="mt-3 pt-2 border-t border-gray-100">
                  <span className="text-xs text-blue-600 font-medium">
                    🏷️ CarStreets Exclusive
                  </span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
