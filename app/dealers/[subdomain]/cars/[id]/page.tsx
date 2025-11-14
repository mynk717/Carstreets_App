import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { CarDetailClient } from '../../CarDetailClient' 

interface PageProps {
  params: Promise<{ subdomain: string; id: string }>
}

export default async function CarDetailPage({ params }: PageProps) {
  const resolvedParams = await params
  const { id } = resolvedParams
  
  if (!id) {
    console.error('[CarDetail] Missing car ID')
    notFound()
  }

  console.log('[CarDetail] Loading car:', id)

  try {
    const car = await prisma.car.findUnique({
      where: { id },
      include: {
        dealer: {
          select: {
            subdomain: true,
            businessName: true,
            phoneNumber: true,
            email: true,
          },
        },
      },
    })

    if (!car) {
      console.error('[CarDetail] Car not found:', id)
      notFound()
    }

    if (!car.dealer) {
      console.error('[CarDetail] Car has no dealer:', id)
      notFound()
    }

    console.log('[CarDetail] Successfully loaded car:', {
      carId: car.id,
      dealerSubdomain: car.dealer.subdomain,
    })

    return <CarDetailClient car={car} dealerSubdomain={car.dealer.subdomain} />
    
  } catch (error) {
    console.error('[CarDetail] Database error:', error)
    notFound()
  }
}
