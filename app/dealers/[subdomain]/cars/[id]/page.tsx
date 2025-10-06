import { notFound } from 'next/navigation'
import {prisma} from '@/lib/prisma'
import { CarDetailClient } from '../../CarDetailClient' 

interface PageProps {
  params: Promise<{ subdomain: string; id: string }>
}

export default async function CarDetailPage({ params }: PageProps) {
  // FIXED: Properly await params and validate
  const resolvedParams = await params
  const { subdomain, id } = resolvedParams
  
  // FIXED: Validate parameters exist
  if (!subdomain || !id) {
    console.error('Missing parameters:', { subdomain, id })
    notFound()
  }

  console.log('Car detail page params:', { subdomain, id }) // Debug log
  
  try {
    // FIXED: Query car with proper error handling
    const car = await prisma.car.findUnique({
      where: { 
        id: id.toString() // Ensure id is string
      },
      include: {
        dealer: true,
      },
    })

    // FIXED: Better validation
    if (!car) {
      console.log('Car not found:', id)
      notFound()
    }

    if (car.dealer?.subdomain !== subdomain) {
      console.log('Dealer subdomain mismatch:', {
        expected: subdomain,
        actual: car.dealer?.subdomain
      })
      notFound()
    }

    return <CarDetailClient car={car} dealerSubdomain={subdomain} />
    
  } catch (error) {
    console.error('Database error in car detail page:', error)
    notFound()
  }
}
