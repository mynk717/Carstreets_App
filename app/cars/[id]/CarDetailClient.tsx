'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CarImageCarousel } from './CarImageCarousel'

export function CarDetailClient({ car }: { car: any }) {
  const [currentUrl, setCurrentUrl] = useState('')

  useEffect(() => {
    setCurrentUrl(window.location.href)
  }, [])

  const imagesArray = Array.isArray(car.images) 
    ? car.images as string[]
    : typeof car.images === 'string' 
    ? JSON.parse(car.images as string) as string[]
    : []

  const whatsappNumber = '+919009008756'
  const phoneNumber = '+919009008756'
  const whatsappMessage = encodeURIComponent(`Hi! I'm interested in ${car.title}. Is it still available?`)

  const handleShareClick = () => {
    const text = `Check out this ${car.title} on CarStreets!`
    if (navigator.share) {
      navigator.share({ title: car.title, text, url: currentUrl })
    } else {
      navigator.clipboard.writeText(`${text} ${currentUrl}`)
      alert('Link copied to clipboard!')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-blue-600 hover:underline inline-flex items-center">
            ← Back to All Cars
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Car Title & Location */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{car.title}</h1>
            <p className="text-gray-600 text-lg flex items-center">
              <span className="mr-2">📍</span>
              {car.location}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Images & Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* FIXED: Image Carousel with Navigation */}
              <CarImageCarousel images={imagesArray} title={car.title} />

              {/* Car Details */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Car Details</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-gray-500 text-sm">Brand</span>
                    <p className="font-medium">{car.brand}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Model</span>
                    <p className="font-medium">{car.model}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Year</span>
                    <p className="font-medium">{car.year}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Fuel Type</span>
                    <p className="font-medium">{car.fuelType}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Transmission</span>
                    <p className="font-medium">{car.transmission}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">KM Driven</span>
                    <p className="font-medium">{car.kmDriven?.toLocaleString()} km</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Owners</span>
                    <p className="font-medium">{car.owners} Previous</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Seller Type</span>
                    <p className="font-medium">{car.sellerType}</p>
                  </div>
                </div>

                {car.description && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-gray-700 leading-relaxed">{car.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Price & Contact Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    ₹{Number(car.price).toLocaleString('en-IN')}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    {car.isVerified && (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        ✓ Verified
                      </span>
                    )}
                    {car.isFeatured && (
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                        ⭐ Featured
                      </span>
                    )}
                  </div>
                </div>

                {/* Contact Buttons */}
                <div className="space-y-3 mb-6">
                  <a
                    href={`tel:${phoneNumber}`}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    📞 Call Now
                  </a>
                  
                  <a
                    href={`https://wa.me/${whatsappNumber.replace('+', '')}?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                  >
                    💬 WhatsApp Chat
                  </a>
                </div>

                {/* Share Options */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 text-gray-700">Share this car</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={handleShareClick}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-200 transition-colors"
                    >
                      📋 Copy Link
                    </button>
                    
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Check out this ${car.title} on CarStreets! ${currentUrl}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-green-100 text-green-700 py-2 px-3 rounded text-sm hover:bg-green-200 transition-colors text-center"
                    >
                      💬 Share
                    </a>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="text-xs text-gray-500">
                    Car ID: {car.id}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
