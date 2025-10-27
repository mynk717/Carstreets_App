import CarForm from '../CarForm';
import { prisma } from '@/lib/prisma';

export default async function NewCarPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params;  // ✅ Correct: await params first



  const dealer = await prisma.dealer.findUnique({
    where: { subdomain },
    select: { id: true, name: true }
  });

  if (!dealer) return <div>Dealer not found</div>;

  return <CarForm dealerId={dealer.id} subdomain={subdomain} />;
}
