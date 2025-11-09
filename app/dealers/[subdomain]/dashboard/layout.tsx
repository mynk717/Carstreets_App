import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { DashboardSidebar } from './components/DashboardSidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { InstallPrompt } from './components/InstallPrompt';
import DealerProfileDropdown from '@/components/dashboard/DealerProfileDropdown';
import { ReactNode } from 'react';

// Fetch dealer data for the layout - GET ALL FIELDS for DashboardSidebar
async function getDealer(subdomain: string) {
  const dealer = await prisma.dealer.findUnique({
    where: { subdomain },
    // ✅ FIX: Remove 'select' to get ALL fields that DashboardSidebar expects
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
  // Get session for authentication
  const session = await getServerSession(authOptions);
  
  // Unwrap params (Next.js 15 async params)
  const { subdomain } = await params;
  const dealer = await getDealer(subdomain);

  if (!dealer) {
    notFound();
  }

  // Optional: Verify session matches dealer (security check)
  if (session?.user?.id && session.user.id !== dealer.id) {
    notFound(); // Prevent unauthorized access
  }

  // ✅ Extract only needed fields for profile dropdown
  const profileData = {
    id: dealer.id,
    name: dealer.name,
    email: dealer.email,
    businessName: dealer.businessName,
    subdomain: dealer.subdomain,
    phoneNumber: dealer.phoneNumber || undefined,
    metaAccessToken: dealer.metaAccessToken,
    facebookPageId: dealer.facebookPageId,
    whatsappBusinessVerified: dealer.whatsappBusinessVerified || false,
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      {/* ✅ Pass full dealer object to DashboardSidebar */}
      <DashboardSidebar dealer={dealer} />
      
      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col pb-16 lg:pb-0">
        {/* Top Navigation Bar with Profile */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Mobile: Business Name */}
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                {dealer.businessName}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {dealer.plan} Plan
              </p>
            </div>

            {/* Profile Dropdown */}
            <DealerProfileDropdown dealer={profileData} />
          </div>
        </header>

        {/* Desktop: Profile in top-right corner */}
        <div className="hidden lg:block sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-end px-6 py-3">
            <DealerProfileDropdown dealer={profileData} />
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
      
      {/* Bottom Navigation - Visible on mobile only */}
      <MobileBottomNav subdomain={subdomain} />
      
      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  );
}
