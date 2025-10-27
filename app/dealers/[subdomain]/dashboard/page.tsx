import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Car, DollarSign, BarChart3, CheckSquare, Plus, TrendingUp } from 'lucide-react';

async function getDealerStats(subdomain: string) {
  const dealerWithStats = await prisma.dealer.findUnique({
    where: { subdomain },
    include: {
      _count: {
        select: { cars: true },
      },
      cars: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          brand: true,
          model: true,
          year: true,
          price: true,
          images: true,
          createdAt: true,
        }
      }
    },
  });

  if (!dealerWithStats) return null;

  return {
    totalCars: dealerWithStats._count.cars,
    plan: dealerWithStats.plan,
    status: dealerWithStats.subscriptionStatus,
    recentCars: dealerWithStats.cars,
  };
}

export default async function DealerDashboardPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;  // ✅ Fixed for Next.js 15
}) {
  const { subdomain } = await params;  // ✅ Await params
  const stats = await getDealerStats(subdomain);

  if (!stats) {
    notFound();
  }

  const statCards = [
    { label: 'Total Cars Listed', value: stats.totalCars, icon: Car, color: 'bg-blue-500' },
    { label: 'Subscription Plan', value: stats.plan.charAt(0).toUpperCase() + stats.plan.slice(1), icon: CheckSquare, color: 'bg-green-500' },
    { label: 'Monthly Revenue', value: '₹XXXX', icon: DollarSign, color: 'bg-purple-500' },
    { label: 'AI Content Used', value: '0', icon: BarChart3, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Welcome back! Here's a snapshot of your dealership's performance.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-xl`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Cars */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Cars</h2>
            <Link 
              href={`/dealers/${subdomain}/dashboard/cars`}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All →
            </Link>
          </div>
          {stats.recentCars.length === 0 ? (
            <p className="text-center text-gray-500 py-12">No cars added yet. Add your first car!</p>
          ) : (
            <div className="space-y-3">
              {stats.recentCars.map((car) => (
                <div key={car.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600">
                  {Array.isArray(car.images) && car.images.length > 0 && (
  <img 
    src={car.images[0] as string} 
    alt={car.title} 
    className="w-16 h-16 object-cover rounded-lg"
  />
)}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{car.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {car.brand} {car.model} • {car.year}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-700 dark:text-blue-400">₹{Number(car.price).toLocaleString()}</p>
                    <div className="flex gap-2 mt-1">
                      <Link 
                        href={`/dealers/${subdomain}/cars/${car.id}/edit`}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link 
              href={`/dealers/${subdomain}/cars/new`}
              className="w-full flex items-center gap-3 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              <Plus className="w-5 h-5" />
              <span>Add New Car</span>
            </Link>
            <Link 
              href={`/dealers/${subdomain}/dashboard/content`}
              className="w-full flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              <TrendingUp className="w-5 h-5" />
              <span>Generate Social Post</span>
            </Link>
            <Link 
              href={`/dealers/${subdomain}/dashboard/cars`}
              className="w-full flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              <Car className="w-5 h-5" />
              <span>Manage Cars</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
