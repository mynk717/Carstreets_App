import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { CarDetailClient } from '../../CarDetailClient' 

interface PageProps {
  params: Promise<{ subdomain: string; id: string }>
}

export default async function CarDetailPage({ params }: PageProps) {
  const resolvedParams = await params
  const { subdomain, id } = resolvedParams
  
  // ✅ DEBUG: Log what we receive
  console.log('🔍 [CarDetail] Params received:', {
    subdomain,
    id,
    subdomainType: typeof subdomain,
    idType: typeof id,
  })
  
  if (!subdomain || !id) {
    console.error('❌ [CarDetail] Missing parameters')
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

    // ✅ DEBUG: Log dealer info
    console.log('✅ [CarDetail] Car found:', {
      carId: car.id,
      carDealerSubdomain: car.dealer?.subdomain,
      urlSubdomain: subdomain,
      match: car.dealer?.subdomain === subdomain,
    })

    // ❌ TEMPORARILY REMOVE THIS CHECK
    // if (car.dealer?.subdomain !== subdomain) {
    //   notFound()
    // }

    return <CarDetailClient car={car} dealerSubdomain={car.dealer.subdomain} />
    
  } catch (error) {
    console.error('❌ [CarDetail] Error:', error)
    notFound()
  }
}
