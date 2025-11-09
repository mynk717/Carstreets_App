// app/dealers/[subdomain]/dashboard/settings/page.tsx
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AutomationSettings } from './AutomationSettings';
import { MetaIntegrations } from './MetaIntegrations';
import { ProfileEditSection } from './ProfileEditSection';
import { SubscriptionSection } from './SubscriptionSection';
import { Shield, Globe } from 'lucide-react';

async function getDealer(subdomain: string) {
  return await prisma.dealer.findUnique({
    where: { subdomain },
  });
}

export default async function DealerSettingsPage({
  params,
}: {
  params: { subdomain: string };
}) {
  const { subdomain } = await params;
  const dealer = await getDealer(subdomain);

  if (!dealer) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your dealership profile and integrations.
        </p>
      </div>

      {/* Profile Edit Section */}
      <ProfileEditSection dealer={dealer} />

      {/* Automation Settings */}
      <AutomationSettings dealer={dealer} />

      {/* Social Media Integrations */}
      <MetaIntegrations dealer={dealer} subdomain={subdomain} />

      {/* Account Information */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Account Information
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Business Name</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {dealer.businessName}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Subdomain</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {dealer.subdomain}.motoyard.mktgdime.com
              </p>
            </div>
            <a
              href={`https://${dealer.subdomain}.motoyard.mktgdime.com`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
            >
              Visit Site →
            </a>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Account ID</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                {dealer.id}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription & Billing - Now a Client Component */}
      <SubscriptionSection dealer={dealer} />

      {/* Custom Domain */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Custom Domain
          </h2>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Connect your own domain to make your storefront accessible at your branded URL
            (e.g., www.yourdealership.com)
          </p>

          {dealer.customDomain ? (
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {dealer.customDomain}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">Connected</p>
              </div>
              <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors">
                Update Domain
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  No custom domain connected
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Using {dealer.subdomain}.motoyard.mktgdime.com
                </p>
              </div>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                Add Domain
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
