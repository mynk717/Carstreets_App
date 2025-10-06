import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Building2, ExternalLink, Trash2, Edit } from 'lucide-react'

export default async function DealershipsPage() {
  const dealers = await prisma.dealer.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { cars: true, contentCalendar: true }
      }
    }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dealerships</h1>
          <p className="text-gray-600 mt-1">Manage all dealer accounts on MotoYard platform</p>
        </div>
        <Link 
          href="/get-started"
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
        >
          + Add Dealership
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Total Dealers</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{dealers.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Active Plans</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {dealers.filter(d => d.subscriptionStatus === 'active' && d.plan !== 'free').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Free Tier</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {dealers.filter(d => d.plan === 'free').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Total Cars</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {dealers.reduce((sum, d) => sum + d._count.cars, 0)}
          </p>
        </div>
      </div>

      {/* Dealers Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Dealership
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Subdomain
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Cars
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dealers.map((dealer) => (
                <tr key={dealer.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {dealer.logo ? (
                        <img src={dealer.logo} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">{dealer.businessName || dealer.name}</p>
                        <p className="text-sm text-gray-500">{dealer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link 
                      href={`/dealers/${dealer.subdomain}`}
                      target="_blank"
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                    >
                      {dealer.subdomain}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${
                      dealer.plan === 'free' ? 'bg-gray-100 text-gray-700' :
                      dealer.plan === 'starter' ? 'bg-blue-100 text-blue-700' :
                      dealer.plan === 'professional' ? 'bg-purple-100 text-purple-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {dealer.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-900 font-medium">{dealer._count.cars}</span>
                    <span className="text-gray-500 text-sm"> / {dealer.carsCount ?? 0} used</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      dealer.subscriptionStatus === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {dealer.subscriptionStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(dealer.createdAt).toLocaleDateString('en-IN', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {dealers.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No dealerships yet</h3>
          <p className="text-gray-600 mb-6">Start by adding your first dealer to the platform</p>
          <Link 
            href="/get-started"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700"
          >
            Add First Dealership
          </Link>
        </div>
      )}
    </div>
  )
}
