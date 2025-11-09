'use client';

import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { ManageSubscriptionModal } from './ManageSubscriptionModal';

interface SubscriptionSectionProps {
  dealer: {
    id: string;
    plan: string;
    subdomain: string;
    subscriptionStatus: string;
  };
}

export function SubscriptionSection({ dealer }: SubscriptionSectionProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Subscription & Billing
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Current Plan</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {dealer.plan} Plan
              </p>
            </div>
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${
                dealer.subscriptionStatus === 'active'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                  : dealer.subscriptionStatus === 'trial'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400'
              }`}
            >
              {dealer.subscriptionStatus}
            </span>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Manage Subscription
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upgrade, downgrade, or cancel your plan
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
            >
              Manage Plan
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <ManageSubscriptionModal
        dealer={dealer}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
