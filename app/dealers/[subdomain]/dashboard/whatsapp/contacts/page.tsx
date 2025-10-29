import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ContactsClient from './ContactsClient';

async function getContacts(subdomain: string) {
  const dealer = await prisma.dealer.findUnique({
    where: { subdomain },
    select: { id: true, businessName: true },
  });

  if (!dealer) return null;

  const contacts = await prisma.whatsAppContact.findMany({
    where: { dealerId: dealer.id },
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      tags: true,
      optedIn: true,
      // source: true, ← REMOVE THIS LINE (field doesn't exist yet)
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Add source manually for now
  const contactsWithSource = contacts.map(c => ({ ...c, source: 'unknown' }));

  return { dealer, contacts: contactsWithSource };
}

export default async function ContactsPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const data = await getContacts(subdomain);
  if (!data) notFound();
  return <ContactsClient subdomain={subdomain} dealer={data.dealer} contacts={data.contacts} />;
}
