import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Building2, ExternalLink, Trash2, Edit, Car as CarIcon } from 'lucide-react';

export default async function DealershipsPage() {
  const dealers = await prisma.dealer.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { 
          cars: true, 
          contentCalendar: true 
        }
      },
      cars: {
        take: 5, // Show 5 most recent cars as preview
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          brand: true,
          model: true,
          year: true,
          price: true,
          images: true,
          carStreetsListed: true,
          createdAt: true,
        }
      }
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dealerships</h1>
          <p className="text-gray-600 mt-1">Manage all dealer accounts on CarStreets platform</p>
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

      {/* Dealers List */}
      {dealers.length === 0 ? (
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
      ) : (
        <div className="space-y-6">
          {dealers.map((dealer) => (
            <div key={dealer.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Dealer Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {dealer.logo ? (
                      <img 
                        src={dealer.logo} 
                        alt={dealer.businessName || dealer.name} 
                        className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200" 
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{dealer.businessName || dealer.name}</h3>
                      <p className="text-gray-600 text-sm">{dealer.email}</p>
                      <Link 
                        href={`/dealers/${dealer.subdomain}`}
                        target="_blank"
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 mt-1"
                      >
                        {dealer.subdomain}.carstreets.com
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    {/* Plan Badge */}
                    <div className="text-center">
                      <span className={`px-4 py-2 text-sm font-bold rounded-full capitalize ${
                        dealer.plan === 'free' ? 'bg-gray-100 text-gray-700' :
                        dealer.plan === 'starter' ? 'bg-blue-100 text-blue-700' :
                        dealer.plan === 'professional' ? 'bg-purple-100 text-purple-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {dealer.plan}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {dealer.subscriptionStatus}
                      </p>
                    </div>

                    {/* Car Count */}
                    <div className="text-center px-4 py-2 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{dealer._count.cars}</p>
                      <p className="text-xs text-gray-600">Total Cars</p>
                    </div>

                    {/* Joined Date */}
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Joined</p>
                      <p className="text-sm font-medium text-gray-700">
                        {new Date(dealer.createdAt).toLocaleDateString('en-IN', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/dealerships/${dealer.id}/edit`}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cars Preview */}
              {dealer.cars.length > 0 && (
                <div className="p-6 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <CarIcon className="w-4 h-4" />
                      Recent Cars ({dealer._count.cars} total)
                    </h4>
                    <Link
                      href={`/dealers/${dealer.subdomain}/dashboard/cars`}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View All →
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {dealer.cars.map((car) => {
                      const images = Array.isArray(car.images) ? car.images : [];
                      const displayPrice = typeof car.price === 'bigint' 
                        ? `₹${car.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` 
                        : `₹${car.price}`;

                      return (
                        <div key={car.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                          {/* Car Image */}
                          {images[0] ? (
                            <img 
                              src={String(images[0])}
                              alt={car.title}
                              className="w-full h-32 object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-car.jpg';
                              }}
                            />
                          ) : (
                            <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-4xl">
                              🚗
                            </div>
                          )}
                          
                          {/* Car Info */}
                          <div className="p-3">
                            <p className="text-xs font-bold text-gray-900 line-clamp-1" title={car.title}>
                              {car.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {car.year} • {car.brand}
                            </p>
                            <p className="text-sm font-bold text-blue-600 mt-2">
                              {displayPrice}
                            </p>
                            
                            {/* Status Badge */}
                            <div className="mt-2">
                              {car.carStreetsListed ? (
                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                                  ✅ Listed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
                                  ⭕ Unlisted
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Show message if dealer has more cars */}
                  {dealer._count.cars > 5 && (
                    <div className="mt-4 text-center">
                      <p className="text-xs text-gray-500">
                        + {dealer._count.cars - 5} more cars
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* No Cars Message */}
              {dealer.cars.length === 0 && (
                <div className="p-6 bg-gray-50 text-center">
                  <p className="text-sm text-gray-500">No cars added yet</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
