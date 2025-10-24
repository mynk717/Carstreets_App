import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Car, DollarSign, BarChart3, CheckSquare } from 'lucide-react';

async function getDealerStats(subdomain: string) {
  const dealerWithStats = await prisma.dealer.findUnique({
    where: { subdomain },
    include: {
      _count: {
        select: { cars: true },
      },
    },
  });

  if (!dealerWithStats) return null;

  // Add more stats as you build features
  return {
    totalCars: dealerWithStats._count.cars,
    plan: dealerWithStats.plan,
    status: dealerWithStats.subscriptionStatus,
  };
}

export default async function DealerDashboardPage({
  params,
}: {
  params: { subdomain: string };
}) {
  const stats = await getDealerStats(params.subdomain);

  if (!stats) {
    notFound();
  }

  const statCards = [
    { label: 'Total Cars Listed', value: stats.totalCars, icon: Car, color: 'bg-blue-500' },
    { label: 'Subscription Plan', value: stats.plan.charAt(0).toUpperCase() + stats.plan.slice(1), icon: CheckSquare, color: 'bg-green-500' },
    { label: 'Monthly Revenue', value: '₹XXXX', icon: DollarSign, color: 'bg-purple-500' },
    { label: 'AI Content Generated', value: '0', icon: BarChart3, color: 'bg-orange-500' },
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

      {/* Quick Actions & Recent Activity (Future additions) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <p className="text-center text-gray-500 py-12">Activity feed coming soon...</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
             {/* Action buttons will go here */}
             <button className="w-full text-left p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">Add a New Car</button>
             <button className="w-full text-left p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">Generate Social Post</button>
          </div>
        </div>
      </div>
    </div>
  );
}
