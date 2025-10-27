import { prisma } from '@/lib/prisma';
import CarForm from '../../CarForm';

export default async function EditCarPage({ params }: { params: Promise<{ subdomain: string; id: string }> }) {
  const { subdomain, id } = await params;

  const dealer = await prisma.dealer.findUnique({
    where: { subdomain },
    select: { id: true }
  });

  const car = await prisma.car.findUnique({
    where: { id }
  });

  if (!dealer || !car) {
    return <div>Car not found</div>;
  }

  return <CarForm dealerId={dealer.id} subdomain={subdomain} initialCar={car} />;
}
