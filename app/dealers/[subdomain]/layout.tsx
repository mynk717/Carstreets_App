// app/dealers/[subdomain]/layout.tsx
import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Footer from '@/components/layout/Footer';

async function getDealer(subdomain: string) {
  return await prisma.dealer.findUnique({
    where: { subdomain },
    select: {
      id: true,
      businessName: true,
      name: true,
      subdomain: true,
    },
  });
}

export default async function DealerStorefrontLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  
  // Verify dealer exists
  const dealer = await getDealer(subdomain);
  
  if (!dealer) {
    notFound();
  }

  return (
    <>
      {children}
      <Footer variant="motoyard" />
    </>
  );
}
