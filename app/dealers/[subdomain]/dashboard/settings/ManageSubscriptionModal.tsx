'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Check, Loader2, Crown } from 'lucide-react';

interface ManageSubscriptionModalProps {
  dealer: {
    id: string;
    plan: string;
    subdomain: string;
    subscriptionStatus: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function ManageSubscriptionModal({ dealer, isOpen, onClose }: ManageSubscriptionModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Plan definitions (match signup form exactly)
  const plans = [
    { 
      id: 'free', 
      name: 'Free', 
      price: 0, 
      features: ['5 cars', '5 AI posts/month', 'Basic support'],
      color: 'gray',
      description: 'Perfect for getting started'
    },
    { 
      id: 'starter', 
      name: 'Starter', 
      price: 2999, 
      features: ['15 cars', 'Unlimited AI posts', 'WhatsApp Auto-reply', 'Email support'],
      color: 'blue',
      description: 'For small dealerships'
    },
    { 
      id: 'professional', 
      name: 'Professional', 
      price: 4999, 
      features: ['50 cars', 'Custom domain', 'Priority support', 'Advanced analytics'],
      color: 'purple',
      description: 'For growing businesses'
    },
    { 
      id: 'enterprise', 
      name: 'Enterprise', 
      price: 9999, 
      features: ['Unlimited cars', 'API access', 'Dedicated manager', 'Custom integrations'],
      color: 'orange',
      description: 'For large dealerships'
    },
  ];

  // ✅ PLACE IT HERE: Normalize plan name (handle DB inconsistencies)
  const normalizedPlan = dealer.plan.toLowerCase() === 'pro' 
    ? 'professional' 
    : dealer.plan.toLowerCase();
  
  // Get current plan price for comparison
  const currentPlanPrice = plans.find(p => p.id === normalizedPlan)?.price || 0;

  const handlePlanChange = async (planId: string, planPrice: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dealers/${dealer.subdomain}/subscription`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPlan: planId })
      });

      const data = await res.json();

      if (data.requiresPayment) {
        // Redirect to payment for upgrades
        window.location.href = data.paymentUrl;
      } else {
        // Downgrade/Free - instant
        alert('Plan updated successfully!');
        router.refresh();
        onClose();
      }
    } catch (error) {
      alert('Failed to update plan');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure? You will lose access to premium features and downgrade to Free plan.')) {
      return;
    }

    setLoading(true);
    try {
      await fetch(`/api/dealers/${dealer.subdomain}/subscription`, {
        method: 'DELETE'
      });
      alert('Subscription cancelled. You are now on the Free plan.');
      router.refresh();
      onClose();
    } catch (error) {
      alert('Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Manage Subscription
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Current Plan Banner */}
        <div className="p-6 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md">
              <Crown className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Plan</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                {dealer.plan}
              </p>
            </div>
          </div>
          <span className="inline-block mt-3 px-4 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-bold uppercase tracking-wide">
            {dealer.subscriptionStatus}
          </span>
        </div>

        {/* Plans Grid */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Choose Your Plan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => {
              const isCurrentPlan = plan.id === normalizedPlan;
              const isUpgrade = plan.price > currentPlanPrice;
              const isDowngrade = plan.price < currentPlanPrice;

              return (
                <div
                  key={plan.id}
                  className={`relative border rounded-xl p-5 transition-all ${
                    isCurrentPlan
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500 shadow-lg'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'
                  }`}
                >
                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-block bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md">
                        CURRENT
                      </span>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="mb-4">
                    <h4 className="font-bold text-xl text-gray-900 dark:text-white mb-1">
                      {plan.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <p className="text-4xl font-bold text-gray-900 dark:text-white">
                      ₹{plan.price.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">/month</p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-5">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Action Button */}
                  {!isCurrentPlan ? (
                    <button
                      onClick={() => handlePlanChange(plan.id, plan.price)}
                      disabled={loading}
                      className={`w-full py-3 rounded-lg font-semibold transition-all ${
                        isUpgrade
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      ) : isUpgrade ? (
                        <span className="flex items-center justify-center gap-2">
                          ⬆️ Upgrade
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          ⬇️ Downgrade
                        </span>
                      )}
                    </button>
                  ) : (
                    <div className="w-full py-3 text-center text-sm text-gray-500 dark:text-gray-400 font-medium border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      Your current plan
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Cancel Subscription Section */}
        {normalizedPlan !== 'free' && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  Cancel Subscription
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You will be downgraded to the Free plan immediately
                </p>
              </div>
              <button
                onClick={handleCancelSubscription}
                disabled={loading}
                className="px-5 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 border border-red-200 dark:border-red-800"
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
