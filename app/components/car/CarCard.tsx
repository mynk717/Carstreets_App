/* ----------  app/components/car/CarCard.tsx  ---------- */
'use client'

import {
  Heart,
  MapPin,
  Fuel,
  Calendar,
  Users,
  Shield,
  ExternalLink,
  CheckCircle,
  Share2
} from 'lucide-react'
import { Car } from '../../types'
import { formatDistance } from '../../lib/utils'
import { Button } from '../ui/Button'
import { CarImage } from './CarImage'

interface CarCardProps {
  car: Car
  onFavorite?: (id: string) => void
  isFavorited?: boolean
}

/* ───────────────── Price helper ───────────────── */
// Improve formatPriceSafe function:
const formatPriceSafe = (price: any): string => {
  if (!price || price === 0) return 'Contact for price'
  
  const numPrice = typeof price === 'string' 
    ? parseInt(price.replace(/[^0-9]/g, ''), 10)
    : Number(price)
    
  return isNaN(numPrice) || numPrice === 0
    ? 'Contact for price' 
    : `₹${numPrice.toLocaleString('en-IN')}`
}


export function CarCard({ car, onFavorite, isFavorited = false }: CarCardProps) {
  const handleFavorite = () => onFavorite?.(car.id)

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
      {/* ── image / carousel ── */}
      <div className="relative h-48">
        <CarImage car={car} />

        {/* badges */}
        <div className="absolute top-3 left-0 flex gap-2 p-2">
          {car.isFeatured && (
            <span className="bg-blue-600 text-white text-xs px-2 rounded font-semibold">
              Featured
            </span>
          )}
          {car.isVerified && (
            <span className="bg-green-600 text-white text-xs px-2 rounded font-semibold flex items-center gap-1">
              <Shield className="w-3 h-3" /> Verified
            </span>
          )}
        </div>

        {/* favourite */}
        <button
          onClick={handleFavorite}
          aria-label="Favourite"
          className={`absolute top-3 right-3 p-2 rounded-full ${
            isFavorited
              ? 'bg-red-100 text-red-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Heart className={`w-4 ${isFavorited ? 'fill-red-600' : ''}`} />
        </button>
      </div>

      {/* ── body ── */}
      <div className="p-4 space-y-3">
        {/* title + price */}
        <div>
          <h3 className="text-lg font-semibold truncate" title={car.title}>
            {car.title}
          </h3>
          <p className="text-xl font-bold text-blue-600">
            {formatPriceSafe(car.price)}
          </p>
        </div>

        {/* specs */}
        <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4" /> {car.year}
          </div>
          <div className="flex items-center gap-2">
            <Fuel className="w-4" /> {car.fuelType}
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4" /> {formatDistance(car.kmDriven)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">&#9881;</span> {car.transmission}
          </div>
        </div>

        {/* location */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MapPin className="w-4" /> {car.location}
        </div>

        {/* attribution */}
        <div>
          {car.olxProfile === 'carstreets' ? (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded p-2">
              <Shield className="w-4" /> CarStreets Listing
              <a
                href={car.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline ml-1"
              >
                View on OLX
              </a>
            </div>
          ) : car.dataSource === 'olx-external' ? (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 rounded p-2">
              <ExternalLink className="w-4" /> OLX Listing
              <a
                href={car.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline ml-1"
              >
                View Original
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-700 rounded p-2">
              <CheckCircle className="w-4" /> Direct Listing
            </div>
          )}
        </div>

        {/* buttons */}
<div className="flex gap-2">
  {car.carStreetsListed ? (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          // Use full path to avoid middleware confusion
          const url = `${window.location.origin}/dealers/${window.location.hostname.split('.')[0]}/cars/${car.id}`
          const msg = encodeURIComponent(
            `Check out this car on CarStreets:\n${car.title}\nPrice: ${formatPriceSafe(
              car.price
            )}\n${url}`
          )
          window.open(`https://wa.me/?text=${msg}`, '_blank')
        }}
      >
        <Share2 className="w-4 mr-1" /> Share
      </Button>
      {/* ✅ FIX: Use subdomain from URL */}
      <a href={`/dealers/${window.location.hostname.split('.')[0]}/cars/${car.id}`} className="flex-1">
        <Button size="sm" className="w-full">
          Book Now
        </Button>
      </a>
    </>
  ) : (
    <>
      {/* ✅ FIX: Use subdomain from URL */}
      <a href={`/dealers/${window.location.hostname.split('.')[0]}/cars/${car.id}`} className="flex-1">
        <Button variant="outline" size="sm" className="w-full">
          View Details
        </Button>
      </a>
      <Button size="sm" className="flex-1">
        Contact Seller
      </Button>
    </>
  )}
</div>
      </div>
    </div>
  )
}

/* EOF */
