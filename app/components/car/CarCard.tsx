'use client'

import Image from 'next/image'
import { Heart, MapPin, Fuel, Calendar, Users, Shield, ExternalLink, CheckCircle } from 'lucide-react'
import { Car } from '../../types'
import { formatPrice, formatDistance } from '../../lib/utils'
import { Button } from '../ui/Button'
import { CarImage } from './CarImage'
import { Share2 } from 'lucide-react'

interface CarCardProps {
  car: Car
  onFavorite?: (carId: string) => void
  isFavorited?: boolean
}

export function CarCard({ car, onFavorite, isFavorited = false }: CarCardProps) {
  const handleFavorite = () => {
    onFavorite?.(car.id)
  }

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {/* Image Section */}
      <div className="relative h-48">
        <CarImage car={car} />

        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {car.isFeatured && (
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
              Featured
            </span>
          )}
          {car.isVerified && (
            <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Verified
            </span>
          )}
        </div>
        
        {/* Favorite Button */}
        <button
          onClick={handleFavorite}
          className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
            isFavorited
              ? 'bg-red-100 text-red-600'
              : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-600'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Title & Price */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
            {car.title}
          </h3>
          <p className="text-2xl font-bold text-blue-600">
            {formatPrice(car.price)}
          </p>
        </div>

        {/* Key Details */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{car.year}</span>
          </div>
          <div className="flex items-center gap-1">
            <Fuel className="w-4 h-4" />
            <span>{car.fuelType}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{formatDistance(car.kmDriven)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 text-center">⚙️</span>
            <span>{car.transmission}</span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
          <MapPin className="w-4 h-4" />
          <span>{car.location}</span>
        </div>
{/* NEW: Enhanced Attribution Section */}
<div className="mb-4">
  {car.olxProfile === 'carstreets' ? (
    <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center gap-1 text-sm text-green-700 font-medium">
        <Shield className="w-4 h-4" />
        <span>CarStreets Listing</span>
      </div>
      <a 
        href={car.originalUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-xs text-green-600 hover:underline flex items-center gap-1"
      >
        <ExternalLink className="w-3 h-3" />
        View on OLX
      </a>
    </div>
  ) : car.dataSource === 'olx-external' ? (
    <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center gap-1 text-sm text-blue-700">
        <ExternalLink className="w-4 h-4" />
        <span>OLX Listing</span>
      </div>
      <a 
        href={car.originalUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-xs text-blue-600 hover:underline"
      >
        View Original
      </a>
    </div>
  ) : (
    <div className="flex items-center gap-1 text-sm text-gray-600">
      <CheckCircle className="w-4 h-4" />
      <span>Direct Listing</span>
    </div>
  )}
</div>

        <div className="flex gap-2">
  {car.carStreetsListed ? (
    <>
      <Button
  variant="outline"
  size="sm"
  className="flex items-center gap-1"
  onClick={() => {
    const url = window.location.origin + '/cars/' + car.id
    const message = encodeURIComponent(
      `Check out this car on CarStreets:\n${car.title}\nPrice: ₹${car.price.toLocaleString()}\n${url}`
    )
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }}
>
  <Share2 className="w-4 h-4" />
  Share
</Button>
      <Button 
        className="flex-1 flex items-center gap-1" 
        size="sm"
        onClick={() => {
          // Add booking functionality
          console.log('Car booking requested:', car.title)
          alert(`Booking inquiry sent for ${car.title}! Our team will call you within 2 hours.`)
        }}
      >
        📞 Book Now
      </Button>
    </>
  ) : (
    <>
      <Button variant="outline" className="flex-1" size="sm">
        View Details
      </Button>
      <Button className="flex-1" size="sm">
        Contact Seller
      </Button>
    </>
  )}
</div>
      </div>
    </div>
  )
}
