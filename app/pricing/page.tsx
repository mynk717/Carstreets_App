// app/pricing/page.tsx
import Header from '../components/layout/Header'
import Footer from '@/components/layout/Footer'
import { CheckCircle, X } from 'lucide-react'
import Link from 'next/link'

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '₹0',
      period: '/forever',
      description: 'Perfect for getting started',
      features: [
        'Up to 5 car listings',
        '5 AI content generations per month',
        '1 social media post per month',
        'Basic storefront',
        'WhatsApp integration',
        'Community support',
      ],
      limitations: [
        'No custom domain',
        'Limited AI features',
        'No analytics',
      ],
    },
    {
      name: 'Starter',
      price: '₹2,999',
      period: '/month',
      description: 'Ideal for small dealerships',
      features: [
        'Up to 15 car listings',
        'Unlimited AI content generation',
        'Unlimited social media posts',
        'Professional storefront',
        'WhatsApp Business integration',
        'Facebook & Instagram posting',
        'Email support (48hr response)',
        'Basic analytics',
      ],
      limitations: [
        'No custom domain',
        'No advanced automation',
      ],
    },
    {
      name: 'Professional',
      price: '₹4,999',
      period: '/month',
      description: 'For growing dealerships',
      features: [
        'Up to 50 car listings',
        'Unlimited AI content generation',
        'Unlimited social media automation',
        'Custom domain support',
        'Advanced AI features & templates',
        'LinkedIn integration',
        'Meta Commerce catalog sync',
        'Advanced analytics dashboard',
        'Priority support (24hr response)',
        'Content calendar & scheduling',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: '₹9,999',
      period: '/month',
      description: 'For large operations',
      features: [
        'Unlimited car listings',
        'Multi-location support',
        'Unlimited everything',
        'White-label options',
        'Custom integrations & API access',
        'Dedicated account manager',
        'Custom AI training',
        'Advanced lead tracking',
        '24/7 priority phone support',
        'Custom onboarding & training',
      ],
    },
  ]

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that fits your dealership size and needs. All plans include 14-day free trial.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all hover:shadow-xl ${
                  plan.popular
                    ? 'border-blue-500 scale-105'
                    : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-500">{plan.period}</span>
                  </div>
                  <p className="text-gray-600 mb-6">{plan.description}</p>

                  <Link href="/get-started">
                    <button
                      className={`w-full py-3 rounded-xl font-semibold transition-all ${
                        plan.popular
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      }`}
                    >
                      {plan.name === 'Free' ? 'Start Free' : 'Start Free Trial'}
                    </button>
                  </Link>

                  <div className="mt-8 space-y-4">
                    <p className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                      Included:
                    </p>
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li
                          key={featureIndex}
                          className="flex items-start gap-3"
                        >
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-600">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {plan.limitations && (
                      <>
                        <p className="text-sm font-semibold text-gray-900 uppercase tracking-wide mt-6">
                          Limitations:
                        </p>
                        <ul className="space-y-3">
                          {plan.limitations.map((limitation, limIndex) => (
                            <li
                              key={limIndex}
                              className="flex items-start gap-3"
                            >
                              <X className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-gray-500">
                                {limitation}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-16">
            <div className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                Detailed Feature Comparison
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">
                        Feature
                      </th>
                      <th className="text-center py-4 px-6 font-semibold text-gray-900">
                        Free
                      </th>
                      <th className="text-center py-4 px-6 font-semibold text-gray-900">
                        Starter
                      </th>
                      <th className="text-center py-4 px-6 font-semibold text-gray-900 bg-blue-50">
                        Professional
                      </th>
                      <th className="text-center py-4 px-6 font-semibold text-gray-900">
                        Enterprise
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {[
                      { feature: 'Car Listings', values: ['5', '15', '50', 'Unlimited'] },
                      { feature: 'AI Content/Month', values: ['5', 'Unlimited', 'Unlimited', 'Unlimited'] },
                      { feature: 'Social Posts/Month', values: ['1', 'Unlimited', 'Unlimited', 'Unlimited'] },
                      { feature: 'Custom Domain', values: [false, false, true, true] },
                      { feature: 'Meta Commerce Sync', values: [false, false, true, true] },
                      { feature: 'Analytics Dashboard', values: [false, 'Basic', 'Advanced', 'Advanced'] },
                      { feature: 'API Access', values: [false, false, false, true] },
                      { feature: 'Support', values: ['Community', 'Email', 'Priority', '24/7 Phone'] },
                    ].map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="py-4 px-6 font-medium text-gray-900">
                          {row.feature}
                        </td>
                        {row.values.map((value, valueIndex) => (
                          <td
                            key={valueIndex}
                            className={`text-center py-4 px-6 ${
                              valueIndex === 2 ? 'bg-blue-50' : ''
                            }`}
                          >
                            {typeof value === 'boolean' ? (
                              value ? (
                                <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                              ) : (
                                <X className="w-5 h-5 text-gray-300 mx-auto" />
                              )
                            ) : (
                              <span className="text-gray-700">{value}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  q: 'Can I change plans later?',
                  a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.',
                },
                {
                  q: 'What payment methods do you accept?',
                  a: 'We accept all major credit/debit cards, UPI, and net banking through our secure payment partner.',
                },
                {
                  q: 'Is there a setup fee?',
                  a: 'No setup fees. All plans include free onboarding and setup assistance.',
                },
                {
                  q: 'What happens after the free trial?',
                  a: "Your chosen plan automatically activates. You can cancel anytime during the trial with no charges.",
                },
                {
                  q: 'Can I get a custom plan?',
                  a: 'Yes! Enterprise customers can request custom plans. Contact our sales team for details.',
                },
                {
                  q: 'Do you offer refunds?',
                  a: 'We offer a 30-day money-back guarantee for annual plans. Monthly plans are non-refundable.',
                },
              ].map((faq, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl border border-gray-200 p-6"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {faq.q}
                  </h3>
                  <p className="text-gray-600">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Dealership?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Start your 14-day free trial today. No credit card required.
            </p>
            <Link href="/get-started">
              <button className="bg-white text-blue-600 font-semibold px-8 py-4 rounded-xl hover:bg-gray-100 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                Start Free Trial →
              </button>
            </Link>
          </div>
        </div>
      </div>
      <Footer variant="marketing-dime" /> 
    </>
  )
}
