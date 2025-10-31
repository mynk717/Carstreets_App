// app/features/page.tsx
import Header from '../components/layout/Header'
import Footer from '@/components/layout/Footer'
import {
  Car,
  Sparkles,
  BarChart3,
  Globe,
  MessageSquare,
  Shield,
  Zap,
  Calendar,
  Image as ImageIcon,
  Share2,
} from 'lucide-react'
import Link from 'next/link'

export default function FeaturesPage() {
  const features = [
    {
      icon: Car,
      title: 'Smart Inventory Management',
      description:
        'Effortlessly manage your entire car inventory with our intelligent system.',
      details: [
        'Add cars with automatic data enrichment',
        'Bulk import from OLX and other platforms',
        'Image optimization and enhancement',
        'Automatic pricing suggestions',
        'Stock level tracking and alerts',
        'Vehicle history and condition reports',
      ],
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Sparkles,
      title: 'AI Content Generation',
      description:
        'Create compelling marketing content in seconds with advanced AI.',
      details: [
        'Automatic car descriptions with SEO',
        'Platform-specific content (Facebook, Instagram, LinkedIn)',
        'Engaging social media captions',
        'Email marketing templates',
        'WhatsApp message templates',
        'Multi-language support (English, Hindi)',
      ],
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: ImageIcon,
      title: 'Professional Image Generation',
      description:
        'Create stunning, branded images for every car listing automatically.',
      details: [
        'AI-generated lifestyle images',
        'Automatic background enhancement',
        'Logo and watermark placement',
        'Multiple style templates',
        'Platform-optimized sizing',
        'Batch image processing',
      ],
      color: 'from-pink-500 to-pink-600',
    },
    {
      icon: Share2,
      title: 'Social Media Automation',
      description:
        'Schedule and post to all platforms automatically from one dashboard.',
      details: [
        'Facebook Business Page posting',
        'Instagram feed and story automation',
        'LinkedIn company page integration',
        'Smart scheduling with best times',
        'Content calendar with approval flow',
        'Performance analytics and insights',
      ],
      color: 'from-green-500 to-green-600',
    },
    {
      icon: MessageSquare,
      title: 'WhatsApp Business Integration',
      description:
        'Connect with customers directly through WhatsApp Business API.',
      details: [
        'Bulk message campaigns',
        'Template message management',
        'Contact list organization',
        'CSV import for contacts',
        'Automated follow-ups',
        'Message delivery tracking',
      ],
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      icon: Globe,
      title: 'Custom Dealer Storefronts',
      description:
        'Professional websites with your branding and custom domain support.',
      details: [
        'Responsive mobile-first design',
        'Custom subdomain (yourdealership.motoyard.com)',
        'Custom domain support (yourdealership.com)',
        'SEO-optimized pages',
        'Contact forms and lead capture',
        'Verified dealer badges',
      ],
      color: 'from-orange-500 to-orange-600',
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description:
        'Track performance and make data-driven decisions with detailed insights.',
      details: [
        'Inventory performance metrics',
        'Social media engagement tracking',
        'Lead source attribution',
        'Best-performing cars and content',
        'Customer behavior insights',
        'Custom report generation',
      ],
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      icon: Calendar,
      title: 'Content Calendar & Scheduling',
      description:
        'Plan, review, and schedule all your content in one organized place.',
      details: [
        'Visual content calendar',
        'Drag-and-drop scheduling',
        'Content approval workflow',
        'Recurring post templates',
        'Multi-platform scheduling',
        'Real-time status tracking',
      ],
      color: 'from-red-500 to-red-600',
    },
    {
      icon: Shield,
      title: 'Trust & Verification',
      description:
        'Build customer confidence with verified listings and quality checks.',
      details: [
        'Dealer verification badges',
        'Car history reports integration',
        'Quality check workflows',
        'Transparent pricing display',
        'Customer reviews and ratings',
        'Secure payment processing',
      ],
      color: 'from-yellow-500 to-yellow-600',
    },
    {
      icon: Zap,
      title: 'Meta Commerce Catalog Sync',
      description:
        'Automatically sync your inventory to Facebook Shop and Instagram Shop.',
      details: [
        'Real-time inventory sync',
        'Product feed generation (XML, CSV, JSON)',
        'Facebook Catalog Manager integration',
        'Instagram Shopping tags',
        'Automatic price and availability updates',
        'Google Vehicle Ads support',
      ],
      color: 'from-cyan-500 to-cyan-600',
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
              Everything You Need to Succeed Online
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              MotoYard provides a complete suite of tools to help car dealers
              modernize their business, attract more customers, and close more
              sales.
            </p>
          </div>

          {/* Features Grid */}
          <div className="space-y-16">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`flex flex-col ${
                  index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                } items-center gap-12`}
              >
                {/* Icon & Title Section */}
                <div className="flex-1">
                  <div
                    className={`w-20 h-20 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}
                  >
                    <feature.icon className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    {feature.title}
                  </h2>
                  <p className="text-lg text-gray-600 mb-6">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.details.map((detail, detailIndex) => (
                      <li
                        key={detailIndex}
                        className="flex items-start gap-3"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                        <span className="text-gray-700">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual/Illustration Section */}
                <div className="flex-1">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border border-gray-200 shadow-inner min-h-[400px] flex items-center justify-center">
                    <div className="text-center">
                      <feature.icon className="w-32 h-32 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {feature.title} Interface Preview
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Integration Section */}
          <div className="mt-24 bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Seamless Integrations
              </h2>
              <p className="text-xl text-gray-600">
                Connect with the platforms you already use
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { name: 'Facebook', desc: 'Posts & Ads' },
                { name: 'Instagram', desc: 'Feed & Stories' },
                { name: 'LinkedIn', desc: 'Company Page' },
                { name: 'WhatsApp', desc: 'Business API' },
                { name: 'Meta Commerce', desc: 'Product Catalog' },
                { name: 'Google Ads', desc: 'Vehicle Ads' },
                { name: 'OLX', desc: 'Import Listings' },
                { name: 'PayU', desc: 'Payments' },
              ].map((integration, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl">
                    {integration.name.charAt(0)}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {integration.name}
                  </h3>
                  <p className="text-sm text-gray-600">{integration.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-24 bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join hundreds of dealers transforming their business with MotoYard
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/get-started">
                <button className="bg-white text-blue-600 font-semibold px-8 py-4 rounded-xl hover:bg-gray-100 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                  Start Free Trial
                </button>
              </Link>
              <Link href="/pricing">
                <button className="text-white border-2 border-white font-semibold px-8 py-4 rounded-xl hover:bg-white hover:text-blue-600 transition-all">
                  View Pricing
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer variant="marketing-dime" /> 
    </>
  )
}
