'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { 
  ArrowLeft, 
  Share2, 
  Phone, 
  MapPin, 
  Calendar, 
  Gauge, 
  Fuel, 
  Settings2,
  Users,
  Shield,
  Star,
  Clock,
  CheckCircle
} from 'lucide-react'

interface CarDetailClientProps {
  car: any
  dealerSubdomain: string
  dealerId?: string
}

export function CarDetailClient({ car, dealerSubdomain, dealerId }: CarDetailClientProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [currentUrl, setCurrentUrl] = useState('')
  
  useEffect(() => {
    // ✅ FIXED: Dynamic URL for multi-tenant
    const url = typeof window !== 'undefined' 
      ? `${window.location.origin}/dealers/${dealerSubdomain}/cars/${car?.id}`
      : `/dealers/${dealerSubdomain}/cars/${car?.id}`
    setCurrentUrl(url)
  }, [dealerSubdomain, car?.id])

  const images = Array.isArray(car?.images) ? (car?.images as string[]) : [];
  
  const nextImage = () => setCurrentImageIndex(prev => (prev + 1) % images.length)
  const prevImage = () => setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length)

  const getDealerPhone = () => {
    return car?.dealer?.whatsappBusinessNumber || 
           car?.dealer?.phoneNumber || 
           car?.dealer?.phone || 
           car?.dealer?.contactNumber || 
           ''
  }
    const handleWhatsAppShare = () => {
    const dealerPhone = getDealerPhone()
    
    if (!dealerPhone) {
      alert('Dealer contact number not available. Please contact via other methods.')
      return
    }
    
    const shareText = `Hi, I'm interested in this ${car?.title} listed for ₹${car?.price.toLocaleString('en-IN')}`
    const whatsappUrl = `https://wa.me/${dealerPhone}?text=${encodeURIComponent(shareText)}`
    window.open(whatsappUrl, '_blank')
  }


  const handleCallDealer = () => {
    const dealerPhone = getDealerPhone()
    
    if (!dealerPhone) {
      alert('Dealer contact number not available.')
      return
    }
    
    window.location.href = `tel:${dealerPhone}`
  }


  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: car?.title,
          text: `Check out this ${car?.title}`,
          url: currentUrl
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      navigator.clipboard.writeText(currentUrl)
      alert('Link copied to clipboard!')
    }
  }

  const carSpecs = [
    { icon: Calendar, label: 'Year', value: car?.year },
    { icon: Gauge, label: 'KM Driven', value: `${car?.kmDriven?.toLocaleString()} km` },
    { icon: Fuel, label: 'Fuel Type', value: car?.fuelType },
    { icon: Settings2, label: 'Transmission', value: car?.transmission },
    { icon: Users, label: 'Owners', value: `${car?.owners} Previous` },
    { icon: MapPin, label: 'Location', value: car?.location },
  ]

  return (
    <>
    <Header />
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header Navigation */}
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href={`/dealers/${dealerSubdomain}`}
              className="flex items-center gap-3 text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to {car?.dealer?.businessName || 'Listings'}</span>
            </Link>
            
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Car Title & Quick Info */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                  {car?.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{car?.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Listed {new Date(car?.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  ₹{car?.price.toLocaleString('en-IN')}
                </div>
                <div className="flex items-center gap-2 justify-end">
                  {car?.isVerified && (
                    <span className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Verified
                    </span>
                  )}
                  {car?.isFeatured && (
                    <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                      <Star className="w-4 h-4" />
                      Featured
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Images & Details - Left Side */}
            <div className="lg:col-span-2 space-y-8">
              {/* Enhanced Image Gallery */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {images.length > 0 ? (
                  <div className="relative aspect-[16/10] bg-gray-100">
                    {/* Main Image */}
                    <img 
                      src={images[currentImageIndex]} 
                      alt={car?.title}
                      className="w-full h-full object-contain rounded-xl"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-car?.jpg'
                      }}
                    />
                    
                    {/* Navigation Arrows */}
                    {images.length > 1 && (
                      <>
                        <button 
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all duration-200"
                          aria-label="Previous image"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all duration-200"
                          aria-label="Next image"
                        >
                          <ArrowLeft className="w-5 h-5 rotate-180" />
                        </button>
                      </>
                    )}

                    {/* Image Counter */}
                    {images.length > 1 && (
                      <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-lg font-medium">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-[16/10] bg-gray-200 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-300 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p>No images available</p>
                    </div>
                  </div>
                )}

                {/* Thumbnail Strip */}
                {images.length > 1 && (
                  <div className="p-4 bg-gray-50 border-t">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                            index === currentImageIndex 
                              ? 'border-blue-500 scale-105' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img 
                            src={image} 
                            alt={`${car?.title} ${index + 1}`}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Car Specifications */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Specifications</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {carSpecs.map((spec, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <spec.icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{spec.label}</p>
                        <p className="font-semibold text-gray-900">{spec.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              {car?.description && (
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {car?.description}
                  </p>
                </div>
              )}
            </div>

            {/* Contact Sidebar - Right Side */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-8 sticky top-24">
                {/* Price Display */}
                <div className="text-center mb-8 pb-8 border-b border-gray-200">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    ₹{car?.price.toLocaleString('en-IN')}
                  </div>
                  <p className="text-gray-600">Best Price Available</p>
                </div>

                {/* Contact Actions */}
                <div className="space-y-4">
                  <button 
                    onClick={handleWhatsAppShare}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-4 px-6 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.309"/>
                    </svg>
                    Contact on WhatsApp
                  </button>

                  <button
                    onClick={handleCallDealer}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all duration-200 shadow-lg"
                  >
                    <Phone className="w-6 h-6" />
                    Call Now
                  </button>



                  <button 
                    onClick={handleShare}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-6 rounded-xl font-medium flex items-center justify-center gap-3 transition-all duration-200 border border-gray-300"
                  >
                    <Share2 className="w-5 h-5" />
                    Share This Car
                  </button>
                </div>

                {/* Dealer Info */}
                {car?.dealer && (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4">Sold by</h3>
                    <div className="flex items-center gap-3 mb-4">
                      {car?.dealer.logo && (
                        <img 
                          src={car?.dealer.logo} 
                          alt={car?.dealer.businessName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">
                          {car?.dealer.businessName || car?.dealer.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {car?.dealer.location}
                        </p>
                      </div>
                    </div>
                    <Link 
                      href={`/dealers/${dealerSubdomain}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View all cars from this dealer →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
