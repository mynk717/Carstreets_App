import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import WhatsAppDashboardClient from './WhatsAppDashboardClient';

async function getWhatsAppData(subdomain: string) {
  const dealer = await prisma.dealer.findUnique({
    where: { subdomain },
    select: {
      id: true,
      businessName: true,
      name: true,
      whatsappBusinessAccountId: true,
      whatsappBusinessVerified: true,
    },
  });

  if (!dealer) return null;

  const contacts = await prisma.whatsAppContact.findMany({
    where: { dealerId: dealer.id },
    orderBy: { createdAt: 'desc' },
  });

  const templates = await prisma.whatsAppTemplate.findMany({
    where: { dealerId: dealer.id, status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
  });

  const recentMessages = await prisma.whatsAppMessage.findMany({
    where: { dealerId: dealer.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      contact: { select: { name: true, phoneNumber: true } },
      template: { select: { name: true } },
    },
  });

  return {
    dealer,
    contacts,
    templates,
    recentMessages,
  };
}

export default async function WhatsAppDashboardPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const data = await getWhatsAppData(subdomain);

  if (!data) {
    notFound();
  }

  return (
    <WhatsAppDashboardClient
      subdomain={subdomain}
      dealer={data.dealer}
      initialContacts={data.contacts}
      initialTemplates={data.templates}
      initialMessages={data.recentMessages}
    />
  );
}
