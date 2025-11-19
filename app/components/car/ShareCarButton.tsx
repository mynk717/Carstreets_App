'use client'

import { useState } from 'react'
import { Share2, Check, ShoppingBag } from 'lucide-react'

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
  useCatalog?: boolean  // ✅ NEW: Enable catalog sharing
  variant?: 'icon' | 'button' | 'catalog'
  className?: string
}

export function ShareCarButton({ 
  car, 
  dealerSubdomain,
  dealerId: propDealerId,
  dealerName,
  useCatalog = true,  // ✅ Default to catalog mode
  variant = 'button',
  className = ''
}: ShareCarButtonProps) {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const dealerId = propDealerId || car.dealerId || ''
  // ✅ NEW: Share via WhatsApp Catalog
  const handleCatalogShare = async () => {
    setLoading(true)
    try {
      // Send catalog message via your WhatsApp API
      const response = await fetch(`/api/dealers/${dealerSubdomain}/whatsapp/share-catalog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carId: car.id,
          dealerId: dealerId,
          method: 'catalog'  // Use catalog instead of text
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // Copy shareable catalog link
        await navigator.clipboard.writeText(result.catalogLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } else {
        alert('Failed to generate catalog link')
      }
    } catch (error) {
      console.error('Catalog share error:', error)
      alert('Error sharing via catalog')
    } finally {
      setLoading(false)
    }
  }

  // Original share (OG card fallback)
  const handleRegularShare = async () => {
    const carUrl = `${window.location.origin}/dealers/${dealerSubdomain}/cars/${car.id}`
    const priceInLakhs = (Number(car.price) / 100000).toFixed(2)
    const shareTitle = `${car.year} ${car.brand} ${car.model} - ₹${priceInLakhs} Lakh`
    const shareText = `${car.fuelType} • ${car.transmission}${car.kmDriven ? ` • ${car.kmDriven.toLocaleString()} km` : ''}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: carUrl
        })
        return
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
      }
    }

    await navigator.clipboard.writeText(`${shareTitle}\n\n${shareText}\n\n${carUrl}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = useCatalog ? handleCatalogShare : handleRegularShare

  // Catalog variant (for dealer dashboard)
  if (variant === 'catalog') {
    return (
      <button
        onClick={handleShare}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 ${className}`}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Generating...</span>
          </>
        ) : copied ? (
          <>
            <Check className="w-4 h-4" />
            <span>Link Copied!</span>
          </>
        ) : (
          <>
            <ShoppingBag className="w-4 h-4" />
            <span>Share Catalog</span>
          </>
        )}
      </button>
    )
  }

  // Button variant
  if (variant === 'button') {
    return (
      <button
        onClick={handleShare}
        disabled={loading}
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
            <span>{useCatalog ? 'Share Catalog' : 'Share'}</span>
          </>
        )}
      </button>
    )
  }

  // Icon variant (for cards)
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
        <ShoppingBag className="w-4 h-4 text-gray-700" />
      )}
    </button>
  )
}
