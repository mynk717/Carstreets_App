import CarForm from '../CarForm';
import { prisma } from '@/lib/prisma';

export default async function NewCarPage(context) {
  const { params } = context;
  const subdomain = params?.subdomain;

  const dealer = await prisma.dealer.findUnique({
    where: { subdomain },
    select: { id: true, name: true }
  });

  if (!dealer) return <div>Dealer not found</div>;

  return <CarForm dealerId={dealer.id} />;
}
