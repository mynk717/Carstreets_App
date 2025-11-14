import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { CarDetailClient } from '../../CarDetailClient' 

interface PageProps {
  params: Promise<{ subdomain: string; id: string }>
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
