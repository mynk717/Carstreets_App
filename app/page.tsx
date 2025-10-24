'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Car, Building2, Zap, Shield, BarChart3, Users, CheckCircle } from 'lucide-react'
import { Button } from './components/ui/Button'

export default function PlatformHomepage() {
  const [email, setEmail] = useState('')
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    // If user is dealer and has subdomain, redirect them to their dashboard
    // Fallback - using email or ID as unique dashboard for now
if (session?.user?.email) {
  // If you ever add subdomain to JWT, switch this field!
  // For now, you can use a hardcoded mapping or fallback
  // Example hard-coded:
  // if (session.user.email === "carstreets@yourdomain.com") router.replace(`/dealers/carstreets/dashboard`);
  // For now, skip actual redirect logic to prevent TS error, or add a TODO.

  // TODO: Replace 'carstreets' below with your logic or look up from DB
  router.replace(`/dealers/carstreets/dashboard`);
}

  }, [session, router]);

  const features = [
    {
      icon: Car,
      title: 'Smart Inventory Management',
      description: 'AI-powered car listings with automatic content generation and social media posting.'
    },
    {
      icon: Building2,
      title: 'Custom Dealer Storefronts',
      description: 'Professional websites with your branding, subdomain, and custom domain support.'
    },
    {
      icon: Zap,
      title: 'Automated Marketing',
      description: 'Generate social media content, ads, and descriptions with AI-powered tools.'
    },
    {
      icon: Shield,
      title: 'Verified Listings',
      description: 'Build trust with verified badges, detailed car histories, and quality checks.'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Track performance, leads, and sales with comprehensive reporting tools.'
    },
    {
      icon: Users,
      title: 'Multi-Platform Integration',
      description: 'Connect with Facebook, Instagram, LinkedIn, and WhatsApp automatically.'
    }
  ]

  const pricingPlans = [
    {
      name: 'Starter',
      price: '₹2,999',
      period: '/month',
      description: 'Perfect for small dealerships',
      features: [
        'Up to 50 car listings',
        'Basic storefront',
        'AI content generation',
        'WhatsApp integration',
        'Email support'
      ]
    },
    {
      name: 'Professional',
      price: '₹4,999',
      period: '/month',
      description: 'For growing dealerships',
      features: [
        'Up to 200 car listings',
        'Custom domain',
        'Advanced AI features',
        'Social media automation',
        'Analytics dashboard',
        'Priority support'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: '₹9,999',
      period: '/month',
      description: 'For large dealerships',
      features: [
        'Unlimited car listings',
        'Multi-location support',
        'Custom integrations',
        'Dedicated account manager',
        'API access',
        '24/7 phone support'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Launch Your
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-600"> Digital Dealership</span>
            <br />in Minutes
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Create a professional car dealership website with AI-powered content generation, 
            automated social media posting, and everything you need to sell cars online.
          </p>
          
          {/* CTA Section */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <div className="flex-1 max-w-md w-full sm:w-auto">
              <input
                type="email"
                placeholder="Enter your business email"
                className="w-full px-6 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Link href="/get-started">
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2">
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>

          <p className="text-gray-500 text-sm">
            ✨ 14-day free trial • No credit card required • Setup in 5 minutes
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed Online
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From inventory management to customer acquisition, MotoYard provides all the tools modern dealerships need.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-200">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your dealership size and needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div key={index} className={`relative bg-white rounded-2xl shadow-lg p-8 ${plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500">{plan.period}</span>
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/get-started">
                  <Button className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${
                    plan.popular 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}>
                    {plan.popular ? 'Start Free Trial' : 'Get Started'}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Car Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of dealers who are already growing their business with MotoYard
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/get-started">
              <Button className="bg-white text-blue-600 font-semibold px-8 py-4 text-lg rounded-xl hover:bg-gray-100 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                Start Your Free Trial
              </Button>
            </Link>
            <Link href="/demo" className="text-blue-100 hover:text-white font-medium">
              Watch Demo →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
