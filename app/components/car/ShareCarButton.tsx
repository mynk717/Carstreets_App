'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'

interface ShareCarButtonProps {
  car: {
    id: string
    title: string
    brand: string
    model: string
    year: number
    price: number | bigint
    fuelType: string
    transmission: string
    kmDriven?: number | null
    dealerId?: string
  }
  dealerSubdomain: string
  dealerId?: string
  dealerName?: string
  variant?: 'icon' | 'button' | 'full'
  className?: string
}

export function ShareCarButton({ 
  car, 
  dealerSubdomain,
  dealerId: propDealerId,
  dealerName,
  variant = 'icon',
  className = ''
}: ShareCarButtonProps) {
  const [copied, setCopied] = useState(false)
  
  const dealerId = propDealerId || car.dealerId || ''

  const handleShare = async () => {
    // Generate clean car detail URL
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'https://motoyard.mktgdime.com'
    
    const carUrl = `${baseUrl}/dealers/${dealerSubdomain}/cars/${car.id}`
    
    // UTM tracking
    const utmParams = new URLSearchParams({
      utm_source: 'share',
      utm_medium: 'whatsapp',
      utm_campaign: 'car_share',
      ref: `dealer_${dealerId}`
    })
    
    const shareUrl = `${carUrl}?${utmParams}`
    
    // ✅ CLEAN FORMAT - Just title and price (like Image 2)
    const priceInLakhs = (Number(car.price) / 100000).toFixed(2)
    const shareTitle = `${car.year} ${car.brand} ${car.model} - ₹${priceInLakhs} Lakh`
    
    // ✅ MINIMAL TEXT - Let OG tags do the work
    const shareText = `${car.fuelType} • ${car.transmission}${car.kmDriven ? ` • ${car.kmDriven.toLocaleString()} km` : ''}`

    // Try native share API (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,  // ✅ Short text only
          url: shareUrl
        })
        return
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
      }
    }

    // Fallback: Copy clean format to clipboard
    const richText = `${shareTitle}\n${shareText}\n${shareUrl}`
    
    try {
      await navigator.clipboard.writeText(richText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Silent fail
    }
  }

  if (variant === 'button') {
    return (
      <button
        onClick={handleShare}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors ${className}`}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </>
        )}
      </button>
    )
  }

  if (variant === 'full') {
    return (
      <button
        onClick={handleShare}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors ${className}`}
      >
        {copied ? (
          <>
            <Check className="w-5 h-5" />
            <span>Link Copied!</span>
          </>
        ) : (
          <>
            <Share2 className="w-5 h-5" />
            <span>Share This Car</span>
          </>
        )}
      </button>
    )
  }

  // Icon variant (default)
  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        handleShare()
      }}
      aria-label="Share this car"
      className={`p-2 rounded-full bg-white/90 hover:bg-white backdrop-blur-sm transition-all shadow-md ${className}`}
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-600" />
      ) : (
        <Share2 className="w-4 h-4 text-gray-700" />
      )}
    </button>
  )
}
