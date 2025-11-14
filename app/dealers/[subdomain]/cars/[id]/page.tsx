import { notFound } from 'next/navigation'
import {prisma} from '@/lib/prisma'
import { CarDetailClient } from '../../CarDetailClient' 

interface PageProps {
  params: Promise<{ subdomain: string; id: string }>
}

export default async function CarDetailPage({ params }: PageProps) {
  const resolvedParams = await params
  const { subdomain, id } = resolvedParams
  
  // Only validate that car ID exists
  if (!id) {
    console.error('Missing car ID')
    notFound()
  }

  try {
    const car = await prisma.car.findUnique({
      where: { id },
      include: {
        dealer: true,
      },
    })

    if (!car) {
      console.log('Car not found:', id)
      notFound()
    }

    // Use the car's dealer subdomain (not the URL subdomain)
    return <CarDetailClient car={car} dealerSubdomain={car.dealer.subdomain} />
    
  } catch (error) {
    console.error('Database error in car detail page:', error)
    notFound()
  }
}
