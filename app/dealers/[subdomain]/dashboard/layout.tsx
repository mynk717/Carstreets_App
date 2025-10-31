import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { DashboardSidebar } from './components/DashboardSidebar';
import { ReactNode } from 'react';


// Fetch dealer data for the layout
async function getDealer(subdomain: string) {
  const dealer = await prisma.dealer.findUnique({
    where: { subdomain },
  });
  return dealer;
}

export default async function DealerDashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { subdomain: string };
}) {
   const { subdomain } = await params;
  const dealer = await getDealer(subdomain);

  if (!dealer) {
    notFound();
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardSidebar dealer={dealer} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
