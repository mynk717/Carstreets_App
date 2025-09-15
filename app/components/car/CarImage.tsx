'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Car } from '../../types'

export function CarImage({ car }: { car: Car }) {
  const [imgSrc, setImgSrc] = useState<string>(
    car.images && car.images.length > 0
      ? car.images[0]
      : '/placeholder-car.jpg'
  )

  const handleError = () => {
    setImgSrc('/placeholder-car.jpg')
  }

  // Check if image is external (OLX or any other source)
  const isExternal = imgSrc.startsWith('http://') || imgSrc.startsWith('https://')

  return (
    // FIXED: Changed from h-48 to aspect-[16/9] for better ratio
    <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-gray-100">
      <img
        src={imgSrc}
        alt={car.title}
        onError={handleError}
        // FIXED: Changed from object-cover to object-contain to show full car
        className="w-full h-full object-contain rounded-lg"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      
      {/* Optional: Show image count if multiple images */}
      {car.images && car.images.length > 1 && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          1/{car.images.length}
        </div>
      )}
    </div>
  )
}
