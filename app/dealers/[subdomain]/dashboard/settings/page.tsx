// app/dealers/[subdomain]/dashboard/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Shield, CreditCard, Globe, Bell } from 'lucide-react';

interface DealerData {
  id: string;
  businessName: string;
  subdomain: string;
  plan: string;
  subscriptionStatus: string;
  customDomain: string | null;
}

export default function DealerSettingsPage() {
  // ✅ ALL HOOKS FIRST
  const params = useParams();
  const [dealer, setDealer] = useState<DealerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const subdomain = params?.subdomain as string;

  useEffect(() => {
    async function fetchDealer() {
      try {
        const response = await fetch(`/api/dealers/${subdomain}`);
        const data = await response.json();
        setDealer(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch dealer:', error);
        setIsLoading(false);
      }
    }

    if (subdomain) {
      fetchDealer();
    }
  }, [subdomain]);

  // ✅ NOW CONDITIONAL RETURNS (AFTER ALL HOOKS)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mx-auto mb-4"></div>
          <p className="text-[var(--color-text-secondary)]">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--color-text)]">
          Settings
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Manage your dealership settings and preferences
        </p>
      </div>

      {/* Account Information */}
      <div className="card card__body">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[var(--color-primary)] bg-opacity-10 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--color-text)]">
            Account Information
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-[var(--color-border)]">
            <div>
              <p className="font-medium text-[var(--color-text)]">Business Name</p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {dealer?.businessName}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-[var(--color-border)]">
            <div>
              <p className="font-medium text-[var(--color-text)]">Subdomain</p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {dealer?.subdomain}.motoyard.mktgdime.com
              </p>
            </div>
            <a
              href={`https://${dealer?.subdomain}.motoyard.mktgdime.com`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] text-sm font-medium"
            >
              Visit Site →
            </a>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-[var(--color-text)]">Account ID</p>
              <p className="text-sm text-[var(--color-text-secondary)] font-mono">
                {dealer?.id}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription & Billing */}
      <div className="card card__body">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[var(--color-primary)] bg-opacity-10 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--color-text)]">
            Subscription & Billing
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-[var(--color-border)]">
            <div>
              <p className="font-medium text-[var(--color-text)]">Current Plan</p>
              <p className="text-sm text-[var(--color-text-secondary)] capitalize">
                {dealer?.plan} Plan
              </p>
            </div>
            <span
              className={`status ${
                dealer?.subscriptionStatus === 'active'
                  ? 'status--success'
                  : dealer?.subscriptionStatus === 'trial'
                  ? 'status--info'
                  : 'status--warning'
              } capitalize`}
            >
              {dealer?.subscriptionStatus}
            </span>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-[var(--color-text)]">
                Manage Subscription
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Upgrade, downgrade, or cancel your plan
              </p>
            </div>
            <button className="btn btn--outline btn--sm">
              Manage Plan
            </button>
          </div>
        </div>
      </div>

      {/* Custom Domain */}
      <div className="card card__body">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[var(--color-primary)] bg-opacity-10 rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--color-text)]">
            Custom Domain
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              Connect your own domain to make your storefront accessible at your branded URL
              (e.g., www.yourdealership.com)
            </p>

            {dealer?.customDomain ? (
              <div className="flex items-center justify-between p-4 bg-[var(--color-success)] bg-opacity-10 border border-[var(--color-success)] rounded-lg">
                <div>
                  <p className="font-medium text-[var(--color-text)]">
                    {dealer.customDomain}
                  </p>
                  <p className="text-sm text-[var(--color-success)]">Connected</p>
                </div>
                <button className="btn btn--outline btn--sm">
                  Update Domain
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-[var(--color-secondary)] border border-[var(--color-border)] rounded-lg">
                <div>
                  <p className="font-medium text-[var(--color-text)]">
                    No custom domain connected
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Using {dealer?.subdomain}.motoyard.mktgdime.com
                  </p>
                </div>
                <button className="btn btn--primary btn--sm">
                  Add Domain
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications (Future Feature) */}
      <div className="card card__body">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[var(--color-primary)] bg-opacity-10 rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--color-text)]">
            Notifications
          </h2>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 hover:bg-[var(--color-secondary)] rounded-lg cursor-pointer transition-colors">
            <div>
              <p className="font-medium text-[var(--color-text)]">
                New Car Inquiries
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Get notified when someone contacts you about a car
              </p>
            </div>
            <input
              type="checkbox"
              className="w-5 h-5 text-[var(--color-primary)]"
              defaultChecked
            />
          </label>

          <label className="flex items-center justify-between p-3 hover:bg-[var(--color-secondary)] rounded-lg cursor-pointer transition-colors">
            <div>
              <p className="font-medium text-[var(--color-text)]">
                Weekly Reports
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Receive weekly performance summaries
              </p>
            </div>
            <input
              type="checkbox"
              className="w-5 h-5 text-[var(--color-primary)]"
              defaultChecked
            />
          </label>

          <label className="flex items-center justify-between p-3 hover:bg-[var(--color-secondary)] rounded-lg cursor-pointer transition-colors">
            <div>
              <p className="font-medium text-[var(--color-text)]">
                Marketing Tips
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Get tips to improve your car listings and sales
              </p>
            </div>
            <input type="checkbox" className="w-5 h-5 text-[var(--color-primary)]" />
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card border-[var(--color-error)]">
        <div className="card__body">
          <h2 className="text-xl font-semibold text-[var(--color-error)] mb-4">
            Danger Zone
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border border-[var(--color-error)] bg-[var(--color-error)] bg-opacity-5 rounded-lg">
              <div>
                <p className="font-medium text-[var(--color-text)]">
                  Delete Account
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Permanently delete your dealership account and all data
                </p>
              </div>
              <button className="btn btn--outline text-[var(--color-error)] border-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white btn--sm">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
