// components/CarDetailModal.tsx
import { Car } from '../types'
import Image from 'next/image'
import { useState } from 'react'

interface CarDetailModalProps {
  car: Car
  isOpen: boolean
  onClose: () => void
}

export function CarDetailModal({ car, isOpen, onClose }: CarDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">{car.title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        
        <div className="p-6">
          {/* Image Gallery */}
          <div className="mb-6">
            <div className="relative aspect-video mb-4">
              <Image
                src={car.images[currentImageIndex]}
                alt={car.title}
                fill
                className="object-cover rounded-lg"
              />
            </div>
            
            {car.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {car.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative w-20 h-20 flex-shrink-0 rounded border-2 ${
                      index === currentImageIndex ? 'border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${car.title} ${index + 1}`}
                      fill
                      className="object-cover rounded"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Car Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-4">Car Details</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Brand:</span> {car.brand}</p>
                <p><span className="font-medium">Model:</span> {car.model}</p>
                {car.variant && <p><span className="font-medium">Variant:</span> {car.variant}</p>}
                <p><span className="font-medium">Year:</span> {car.year}</p>
                <p><span className="font-medium">Fuel Type:</span> {car.fuelType}</p>
                <p><span className="font-medium">Transmission:</span> {car.transmission}</p>
                <p><span className="font-medium">KM Driven:</span> {car.kmDriven.toLocaleString()} km</p>
                <p><span className="font-medium">Owners:</span> {car.owners}</p>
                <p><span className="font-medium">Location:</span> {car.location}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Price & Status</h3>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-blue-600">₹{car.price.toLocaleString()}</p>
                <p><span className="font-medium">Seller Type:</span> {car.sellerType}</p>
                <p><span className="font-medium">Posted:</span> {car.postedDate}</p>
                {car.isVerified && <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">✓ Verified</span>}
                {car.isFeatured && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">⭐ Featured</span>}
              </div>
            </div>
          </div>
          
          {car.description && (
            <div className="mt-6">
              <h3 className="font-semibold text-lg mb-2">Description</h3>
              <p className="text-gray-700">{car.description}</p>
            </div>
          )}
          
          <div className="mt-6 pt-4 border-t">
            <p className="text-sm text-gray-500">
              🏷️ CarStreets Listing • Data sourced from OLX Profile
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
