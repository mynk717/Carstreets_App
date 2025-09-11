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

  // Check if image is from OLX (needs unoptimized)
  const isOLXImage = imgSrc.includes('apollo.olx.in') || imgSrc.includes('olx.in')

  return (
    <div className="relative h-48 w-full rounded-lg overflow-hidden bg-gray-100">
      <Image
        src={imgSrc}
        alt={car.title}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        quality={75}
        onError={handleError}
        priority={car.isFeatured}
        className="rounded-lg object-cover"
        // Add unoptimized for OLX images to prevent 400 errors
        unoptimized={isOLXImage}
      />
    </div>
  )
}
