'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Car } from '../../types'

// Helper function to get optimized image URL
function getOptimizedImageUrl(originalUrl: string, width = 400, height = 300): string {
  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dn7cmywtm'
  
  if (!originalUrl) return '/placeholder-car.jpg'
  
  // If it's already a Cloudinary URL, add transformations
  if (originalUrl.includes(`res.cloudinary.com/${CLOUD_NAME}`)) {
    const parts = originalUrl.split('/upload/')
    if (parts.length === 2) {
      return `${parts[0]}/upload/w_${width},h_${height},c_fill,f_auto,q_auto,dpr_auto/${parts[1]}`
    }
  }
  
  // For OLX images, use Cloudinary fetch to optimize (optional - you can remove this if you want to keep OLX images as-is)
  if (originalUrl.includes('apollo.olx.in') || originalUrl.includes('olx.in')) {
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/w_${width},h_${height},c_fill,f_auto,q_auto,dpr_auto/${encodeURIComponent(originalUrl)}`
  }
  
  // For any other external images, use fetch
  if (originalUrl.startsWith('http')) {
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/w_${width},h_${height},c_fill,f_auto,q_auto,dpr_auto/${encodeURIComponent(originalUrl)}`
  }
  
  // Return original URL for local images
  return originalUrl
}

export function CarImage({ car }: { car: Car }) {
  const [imgSrc, setImgSrc] = useState<string>(
    car.images && car.images.length > 0
      ? getOptimizedImageUrl(car.images[0], 400, 300)
      : '/placeholder-car.jpg'
  )
  const [imageError, setImageError] = useState(false)

  const handleError = () => {
    // If Cloudinary optimization fails, try original URL
    if (car.images && car.images.length > 0 && imgSrc !== car.images[0]) {
      setImgSrc(car.images[0])
    } else {
      // If original also fails, use placeholder
      setImgSrc('/placeholder-car.jpg')
      setImageError(true)
    }
  }

  // Check if image is external (OLX or any other source)
  const isExternal = imgSrc.startsWith('http://') || imgSrc.startsWith('https://')

  return (
    <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-gray-100">
      {imageError ? (
        // Fallback UI when image fails to load
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
          <div className="text-4xl mb-2">🚗</div>
          <div className="text-sm">Image not available</div>
        </div>
      ) : (
        <img
          src={imgSrc}
          alt={car.title}
          onError={handleError}
          className="w-full h-full object-contain rounded-lg"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      )}
      
      {/* Image count indicator */}
      {car.images && car.images.length > 1 && !imageError && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          1/{car.images.length}
        </div>
      )}
      
      {/* Cloudinary optimization indicator (optional - remove if you don't want to show this) */}
      {imgSrc.includes('res.cloudinary.com') && !imageError && (
        <div className="absolute bottom-2 left-2 bg-blue-500 bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          ⚡ Optimized
        </div>
      )}
    </div>
  )
}
