// app/page.tsx - COMPLETE UPDATED VERSION
'use client'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowRight, Car, Building2, Zap, Shield, BarChart3, Users, 
  CheckCircle, Lock, Sparkles, TrendingUp 
} from 'lucide-react'
import { Button } from './components/ui/Button'

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
    name: 'Free',
    price: '₹0',
    period: '/forever',
    description: 'Perfect for getting started',
    features: [
      'Up to 5 car listings',
      '5 AI content per month',
      '1 social post per month',
      'Basic storefront',
      'WhatsApp integration',
      'Community support'
    ]
  },
  {
    name: 'Starter',
    price: '₹2,999',
    period: '/month',
    description: 'For small dealerships',
    features: [
      'Up to 15 car listings',
      'Unlimited AI content',
      'Unlimited social posts',
      'Professional storefront',
      'Facebook & Instagram',
      'Email support'
    ]
  },
  {
    name: 'Professional',
    price: '₹4,999',
    period: '/month',
    description: 'For growing dealerships',
    popular: true,
    features: [
      'Up to 50 car listings',
      'Unlimited AI content',
      'Custom domain support',
      'Advanced AI features',
      'LinkedIn integration',
      'Priority support'
    ]
  }
]

export default function PlatformHomepage() {
  const [email, setEmail] = useState('')
  const router = useRouter()

  return (
    <>
      <Header />
      
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        
        {/* ============ HERO SECTION ============ */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 right-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute bottom-20 left-0 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          </div>

          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Launch Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-orange-600">
                {' '}Digital Dealership
              </span>
              <br />
              <span className="text-5xl md:text-6xl">in Minutes</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              Create a professional car dealership website with AI-powered content generation, 
              automated social media posting, and everything you need to sell cars online.
            </p>
            
            {/* ============ CTA SECTION ============ */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12 max-w-md mx-auto sm:max-w-none">
              <div className="w-full sm:w-auto sm:flex-1 sm:max-w-md">
                <input
                  type="email"
                  placeholder="Enter your business email"
                  className="w-full px-6 py-4 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 shadow-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Link href="/get-started">
                <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2">
                  Start Free
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>

            {/* ============ TRUST INDICATORS - PREMIUM VERSION ============ */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                {/* Box 1: Free Plan */}
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-yellow-500" strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">
                        Free to Start
                      </h4>
                      <p className="text-gray-700 text-xs leading-relaxed">
                        Get 5 car listings and essential tools at no cost
                      </p>
                    </div>
                  </div>
                </div>

                {/* Box 2: Flexibility */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      <CheckCircle className="w-6 h-6 text-green-500" strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">
                        Upgrade Anytime
                      </h4>
                      <p className="text-gray-700 text-xs leading-relaxed">
                        Scale your plan as your business grows, no lock-in
                      </p>
                    </div>
                  </div>
                </div>

                {/* Box 3: Security */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      <Lock className="w-6 h-6 text-blue-500" strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">
                        Secure Payments
                      </h4>
                      <p className="text-gray-700 text-xs leading-relaxed">
                        Industry-standard encryption powered by PayU
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ FEATURES SECTION ============ */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Everything You Need to Succeed
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                From inventory management to customer acquisition, MotoYard provides all the tools modern dealerships need to thrive online.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="group bg-white border border-gray-100 rounded-2xl p-8 hover:border-blue-200 hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 group-hover:from-blue-600 group-hover:to-purple-600 rounded-xl flex items-center justify-center mb-6 transition-all">
                    <feature.icon className="w-8 h-8 text-white" strokeWidth={2} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ PRICING SECTION ============ */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Choose the plan that fits your dealership. Upgrade or downgrade anytime.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pricingPlans.map((plan, index) => (
                <div 
                  key={index} 
                  className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
                    plan.popular 
                      ? 'md:scale-105 ring-2 ring-blue-500 shadow-2xl bg-white' 
                      : 'bg-white border border-gray-100 hover:border-gray-300 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute top-0 right-0 left-0">
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 text-sm font-semibold text-center">
                        Most Popular
                      </div>
                    </div>
                  )}
                  
                  <div className={`p-8 ${plan.popular ? 'pt-16' : ''}`}>
                    {/* Plan Header */}
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {plan.name}
                      </h3>
                      <div className="flex items-baseline justify-center gap-1 mb-3">
                        <span className="text-5xl font-bold text-gray-900">
                          {plan.price}
                        </span>
                        <span className="text-gray-600">{plan.period}</span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        {plan.description}
                      </p>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" strokeWidth={2.5} />
                          <span className="text-gray-700 font-medium text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <Link href="/get-started" className="block">
                      <Button 
                        className={`w-full py-3 rounded-xl font-semibold text-base transition-all duration-200 ${
                          plan.popular 
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-900 transform hover:scale-105'
                        }`}
                      >
                        {plan.price === '₹0' ? 'Start Free' : 'Choose Plan'}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional CTA below pricing */}
            <div className="text-center mt-12">
              <p className="text-gray-600 mb-4">
                Want to see all features?
              </p>
              <Link href="/pricing">
                <Button className="bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-xl font-semibold transition-all">
                  View Detailed Comparison →
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ============ FINAL CTA SECTION ============ */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
          </div>

          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Car Business?
            </h2>
            <p className="text-xl text-blue-100 mb-10 leading-relaxed">
              Join hundreds of dealers who are already growing their business with MotoYard. Start for free today.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/get-started">
                <Button className="bg-white text-blue-600 font-semibold px-10 py-4 text-lg rounded-xl hover:bg-gray-100 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2">
                  Start Free Now
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link 
                href="/features"
                className="text-white font-semibold px-6 py-4 rounded-xl border-2 border-white hover:bg-white hover:text-blue-600 transition-all duration-200"
              >
                Learn More
              </Link>
            </div>

            <p className="text-blue-100 text-sm mt-8">
              No credit card required • 5 free car listings • Instant setup
            </p>
          </div>
        </section>

      </div>

      <Footer variant="marketing-dime" />
    </>
  )
}
