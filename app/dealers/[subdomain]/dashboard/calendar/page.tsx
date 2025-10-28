import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import DealerCalendarClient from './DealerCalendarClient';

async function getContentCalendar(subdomain: string) {
  const dealer = await prisma.dealer.findUnique({
    where: { subdomain },
    select: { 
      id: true, 
      businessName: true, 
      name: true,
    }
  });

  if (!dealer) return null;

  const contentItems = await prisma.contentCalendar.findMany({
    where: { dealerId: dealer.id },
    orderBy: { createdAt: 'desc' },
    include: {
      car: {
        select: {
          title: true,
          brand: true,
          model: true,
          images: true,
        }
      }
    }
  });

  return {
    dealer,
    contentItems
  };
}

export default async function DealerCalendarPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const data = await getContentCalendar(subdomain);

  if (!data) {
    notFound();
  }

  const { dealer, contentItems } = data;

  return (
    <DealerCalendarClient
      calendar={contentItems.map((i) => ({
        id: i.id,
        platform: (i.platform || 'facebook') as 'facebook' | 'instagram' | 'linkedin' | string,
        status: (i.status as 'draft' | 'pending' | 'requires_review' | 'approved' | 'scheduled' | 'posted') || 'draft',
        textContent: i.textContent ?? null,
        createdAt: i.createdAt,
        scheduledDate: (i as any).scheduledDate ?? null, // in your schema it might be scheduledAt/scheduledDate
        brandedImage: (i as any).brandedImage ?? null,
        generatedImage: (i as any).generatedImage ?? null,
        finalImage: (i as any).finalImage ?? null,
        car: {
          title: i.car?.title ?? null,
          brand: i.car?.brand ?? null,
          model: i.car?.model ?? null,
          images: Array.isArray(i.car?.images) ? (i.car?.images as string[]) : [],
        },
      }))}
      subdomain={subdomain}
      dealerName={dealer.businessName || dealer.name}
    />
  );  
}
