import { prisma } from '@/lib/prisma'
import { BarChart3, Users, Car, TrendingUp, DollarSign } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const [totalDealers, totalCars, activeSubscriptions, totalRevenue] = await Promise.all([
    prisma.dealer.count(),
    prisma.car.count(),
    prisma.dealer.count({ where: { subscriptionStatus: 'active', plan: { not: 'free' } } }),
    prisma.dealer.aggregate({
      where: { subscriptionStatus: 'active', plan: { not: 'free' } },
      _sum: { subscriptionAmount: true }
    })
  ])

  const stats = [
    {
      label: 'Total Dealers',
      value: totalDealers,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      label: 'Total Cars',
      value: totalCars,
      icon: Car,
      color: 'bg-green-500',
    },
    {
      label: 'Paid Subscriptions',
      value: activeSubscriptions,
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
    {
      label: 'Monthly Revenue',
      value: `₹${(totalRevenue._sum.subscriptionAmount || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-orange-500',
    }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">MotoYard Platform</h1>
        <p className="text-gray-600">Overview of your multi-tenant dealership platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div 
            key={index}
            className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-xl`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link 
          href="/admin/cars"
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white hover:shadow-lg transition-all"
        >
          <Car className="w-8 h-8 mb-4" />
          <h3 className="text-xl font-bold mb-2">Manage Cars</h3>
          <p className="text-blue-100">View and manage all platform cars</p>
        </Link>

        <Link 
          href="/admin/content"
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white hover:shadow-lg transition-all"
        >
          <BarChart3 className="w-8 h-8 mb-4" />
          <h3 className="text-xl font-bold mb-2">Content Studio</h3>
          <p className="text-green-100">Generate AI content for dealers</p>
        </Link>
      </div>
    </div>
  )
}
