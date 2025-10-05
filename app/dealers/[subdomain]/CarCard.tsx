'use client'

import { useState } from 'react'
import { Share2, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export function DealerCarCard({ car, dealerSubdomain }: { car: any; dealerSubdomain: string }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  const images = Array.isArray(car.images) ? car.images as string[] : []
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }
  
  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  // WhatsApp share with direct app link (mobile-friendly)
  const handleWhatsAppShare = () => {
    const phone = '919009008756' // Your WhatsApp business number
    const url = `https://${dealerSubdomain}.motoyard.mktgdime.com/cars/${car.id}`
    const message = `Check out this ${car.title}!\nPrice: ₹${Number(car.price).toLocaleString('en-IN')}\n${url}`
    
    // Use api.whatsapp.com for better mobile app detection
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
      {/* Image Carousel with 16:9 aspect ratio */}
      {images.length > 0 && (
        <div className="relative aspect-[16/9] bg-gray-200 group">
          {/* Main Image */}
          <img 
            src={images[currentImageIndex]} 
            alt={car.title}
            className="w-full h-full object-contain"
          />
          
          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Previous image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Next image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          
          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs font-medium">
              {currentImageIndex + 1}/{images.length}
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {car.isFeatured && (
              <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold">
                Featured
              </span>
            )}
            {car.isVerified && (
              <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                Verified
              </span>
            )}
          </div>
          
          {/* Dots Indicator */}
          {images.length > 1 && images.length <= 5 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentImageIndex ? 'bg-white w-6' : 'bg-white bg-opacity-50'
                  }`}
                  aria-label={`View image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Car Details */}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 text-gray-900 line-clamp-2 hover:text-blue-600 transition">
          {car.title}
        </h3>
        
        <p className="text-2xl font-bold text-blue-600 mb-3">
          ₹{Number(car.price).toLocaleString('en-IN')}
        </p>
        
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <span className="font-medium">Year:</span> {car.year}
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">KM:</span> {car.kmDriven.toLocaleString()}
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Fuel:</span> {car.fuelType}
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Trans:</span> {car.transmission}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link 
            href={`/cars/${car.id}`}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center text-sm"
          >
            <ExternalLink className="w-4 h-4 inline mr-1" />
            View Details
          </Link>
          
          <button
            onClick={handleWhatsAppShare}
            className="bg-green-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors text-sm"
            title="Share on WhatsApp"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
