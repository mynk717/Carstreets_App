import Link from 'next/link'

export default function PlatformHomepage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">
            🚗 MotoYard
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="/#features" className="text-gray-600 hover:text-blue-600">
              Features
            </Link>
            <Link href="/#pricing" className="text-gray-600 hover:text-blue-600">
              Pricing
            </Link>
            <Link href="/admin/cars" className="text-gray-600 hover:text-blue-600">
              Sign In
            </Link>
          </nav>
          <Link 
            href="/admin/cars" 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          AI-Powered Marketing for<br />Auto Dealers
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Automate your social media content, manage inventory, and grow your dealership 
          with MotoYard's intelligent marketing platform.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/admin/cars" 
            className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
          >
            Start Free Trial
          </Link>
          <a 
            href="#features" 
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose MotoYard?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition">
            <div className="text-5xl mb-4">🤖</div>
            <h3 className="text-xl font-bold mb-3">AI Content Generation</h3>
            <p className="text-gray-600">
              Automatically create engaging social media posts for your inventory with advanced AI
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition">
            <div className="text-5xl mb-4">📱</div>
            <h3 className="text-xl font-bold mb-3">Multi-Platform Posting</h3>
            <p className="text-gray-600">
              Post to Facebook, Instagram, and LinkedIn simultaneously with one click
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-3">Analytics Dashboard</h3>
            <p className="text-gray-600">
              Track performance and optimize your marketing strategy with real-time insights
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="container mx-auto px-4 py-16 bg-gray-50 my-16 rounded-2xl">
        <h2 className="text-3xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-8 rounded-xl shadow-md">
            <h3 className="text-2xl font-bold mb-2">Free Trial</h3>
            <p className="text-4xl font-bold text-blue-600 mb-4">₹0<span className="text-lg text-gray-500">/14 days</span></p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> 5 AI posts
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> 1 social account
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Basic analytics
              </li>
            </ul>
          </div>
          <div className="bg-blue-600 text-white p-8 rounded-xl shadow-xl transform scale-105">
            <div className="text-sm font-semibold mb-2">MOST POPULAR</div>
            <h3 className="text-2xl font-bold mb-2">Standard</h3>
            <p className="text-4xl font-bold mb-4">₹2,999<span className="text-lg opacity-75">/month</span></p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2">
                <span>✓</span> 50 AI posts/month
              </li>
              <li className="flex items-center gap-2">
                <span>✓</span> 3 social accounts
              </li>
              <li className="flex items-center gap-2">
                <span>✓</span> Full analytics
              </li>
              <li className="flex items-center gap-2">
                <span>✓</span> WhatsApp integration
              </li>
            </ul>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-md">
            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <p className="text-4xl font-bold text-blue-600 mb-4">₹9,999<span className="text-lg text-gray-500">/month</span></p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Unlimited posts
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Unlimited accounts
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Custom domain
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Priority support
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">© 2025 MotoYard by Marketing Dime. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
