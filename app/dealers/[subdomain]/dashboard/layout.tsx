import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { DashboardSidebar } from './components/DashboardSidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ReactNode } from 'react';
import { InstallPrompt } from './components/InstallPrompt'; 

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
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 pb-16 lg:pb-0">
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <DashboardSidebar dealer={dealer} />
      
      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-4">
        {children}
      </main>
      
      {/* Bottom Navigation - Visible on mobile only */}
      <MobileBottomNav subdomain={subdomain} />
      <InstallPrompt />
    </div>
  );
}
