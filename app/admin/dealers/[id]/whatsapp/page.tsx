import { prisma } from '@/lib/prisma';
import WhatsAppSetupForm from './WhatsAppSetupForm';

export default async function AdminWhatsAppSetup({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const dealer = await prisma.dealer.findUnique({
    where: { id },
    select: {
      id: true,
      businessName: true,
      subdomain: true,
      whatsappBusinessAccountId: true,
      whatsappBusinessNumber: true,
      whatsappApiToken: true,
    },
  });

  if (!dealer) return <div>Dealer not found</div>;

  return <WhatsAppSetupForm dealer={dealer} />;
}
