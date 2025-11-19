import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { CarDetailClient } from '../../CarDetailClient' 
import type { Metadata } from 'next'


interface PageProps {
  params: Promise<{ subdomain: string; id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain, id } = await params

  try {
    const car = await prisma.car.findUnique({
      where: { id },
      include: {
        dealer: {
          select: {
            subdomain: true,
            businessName: true,
            name: true,
            location: true,
            phoneNumber: true,
            logo: true,
            description: true,
          }
        }
      }
    })

    if (!car || !car.dealer) {
      return { title: 'Car Not Found' }
    }

    // Validate subdomain match (if provided)
    if (subdomain && car.dealer.subdomain !== subdomain) {
      return { title: 'Car Not Found' }
    }

    const dealer = car.dealer
    const dealerName = dealer.businessName || dealer.name || 'MotoYard'
    
    // Car title and pricing
    const carTitle = `${car.year} ${car.brand} ${car.model}`
    const fullTitle = car.variant 
      ? `${carTitle} ${car.variant}` 
      : carTitle
    
    const priceInLakhs = (Number(car.price) / 100000).toFixed(2)
    const priceText = `₹${priceInLakhs} Lakh`
    
    // Build rich description
    const specs = [
      `${car.kmDriven?.toLocaleString()} km`,
      car.fuelType,
      car.transmission,
      `${car.owners} owner${car.owners > 1 ? 's' : ''}`
    ].join(' • ')
    
    const description = 
      `${fullTitle} for sale at ${dealerName}. Price: ${priceText}. ` +
      `${specs}. Located in ${car.location || dealer.location || 'India'}. ` +
      `${car.description ? car.description.substring(0, 100) + '...' : 'Contact dealer for more details.'}`

    // Get images from Car.images JSON array
    const carImages = Array.isArray(car.images) 
      ? (car.images as string[])
      : []
    
    // Priority: Car image > Dealer logo > Fallback
    const primaryImage = carImages[0] || 
                        dealer.logo || 
                        'https://motoyard.mktgdime.com/og-default-car.jpg'

    // Canonical URL
    const canonicalUrl = `https://motoyard.mktgdime.com/dealers/${car.dealer.subdomain}/cars/${id}`

    return {
      title: `${fullTitle} - ${priceText} | ${dealerName}`,
      description: description.substring(0, 160),

      // Open Graph (Facebook, WhatsApp, LinkedIn)
      openGraph: {
        title: `${fullTitle} - ${priceText}`,
        description: description.substring(0, 200),
        url: canonicalUrl,
        siteName: 'MotoYard',
        locale: 'en_IN',
        type: 'website',
        images: [
          {
            url: primaryImage,
            width: 1200,
            height: 630,
            alt: `${fullTitle} - ${priceText}`,
            type: 'image/jpeg',
          },
          // ✅ Additional images for platforms that support galleries
          ...carImages.slice(1, 4).map((img) => ({
            url: img,
            width: 1200,
            height: 630,
            alt: fullTitle,
            type: 'image/jpeg' as const,
          }))
        ],
      },

      // Twitter Card
      twitter: {
        card: 'summary_large_image',
        title: `${fullTitle} - ${priceText}`,
        description: specs,
        images: [primaryImage],
      },

      // Canonical URL
      alternates: {
        canonical: canonicalUrl,
      },

      // Additional metadata for rich snippets
      other: {
        'product:price:amount': Number(car.price).toString(),
        'product:price:currency': 'INR',
        'product:condition': car.condition || 'used',
        'product:availability': car.availability || 'in_stock',
        'og:phone_number': dealer.phoneNumber || '',
      },

      // SEO metadata
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    }
  } catch (error) {
    console.error('❌ [CarDetail Metadata] Error:', error)
    return { 
      title: 'Car Details',
      description: 'Browse quality used cars on MotoYard'
    }
  }
}
export default async function CarDetailPage({ params }: PageProps) {
  const { subdomain, id } = await params
  
  console.log('🚀 [CarDetail] Params:', { subdomain, id })
  
  if (!id) {
    notFound()
  }

  try {
    const car = await prisma.car.findUnique({
      where: { id },
      include: { dealer: true },
    })

    if (!car) {
      console.error('❌ [CarDetail] Car not found:', id)
      notFound()
    }

    if (!car.dealer) {
      console.error('❌ [CarDetail] Car has no dealer')
      notFound()
    }

    // ✅ Allow access if:
    // 1. No subdomain provided (main domain access)
    // 2. Subdomain matches car's dealer
    if (subdomain && car.dealer.subdomain !== subdomain) {
      console.error('❌ [CarDetail] Wrong dealer:', {
        expected: car.dealer.subdomain,
        got: subdomain,
      })
      notFound()
    }

    console.log('✅ [CarDetail] Loaded:', car.title)

    return <CarDetailClient car={car} dealerSubdomain={car.dealer.subdomain} />
    
  } catch (error) {
    console.error('❌ [CarDetail] Error:', error)
    notFound()
  }
}
