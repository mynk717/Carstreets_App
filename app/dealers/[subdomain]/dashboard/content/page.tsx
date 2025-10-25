// app/dealers/[subdomain]/dashboard/content/page.tsx
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

async function getDealer(subdomain: string) {
  return await prisma.dealer.findUnique({
    where: { subdomain },
  });
}

export default async function DealerContentPage({
  params,
}: {
  params: { subdomain: string };
}) {
  const dealer = await getDealer(params.subdomain);

  if (!dealer) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">
          Content Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your dealership information and branding
        </p>
      </div>

      {/* Coming Soon Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Coming Soon</h3>
        </div>
        <p className="text-blue-800 dark:text-blue-200">
          Content management features are being developed. You'll soon be able to edit your dealership information, logo, and description directly from here.
        </p>
      </div>

      {/* Current Dealer Info Display */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Current Dealership Information
        </h2>

        <div className="space-y-6">
          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Business Name
            </label>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {dealer.businessName || 'Not set'}
            </p>
          </div>

          {/* Owner Name */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Owner/Contact Name
            </label>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {dealer.name || 'Not set'}
            </p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Location
            </label>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {dealer.location || 'Not set'}
            </p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Phone Number
            </label>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {dealer.phoneNumber || 'Not set'}
            </p>
          </div>

          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Logo
            </label>
            {dealer.logo ? (
              <img
                src={dealer.logo}
                alt="Logo"
                className="w-24 h-24 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No logo uploaded</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Description
            </label>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {dealer.description || 'No description provided'}
            </p>
          </div>
        </div>

        {/* Note */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            To update this information, please contact support or use the admin panel.
          </p>
        </div>
      </div>
    </div>
  );
}
