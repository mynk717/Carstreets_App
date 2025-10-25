// app/dealers/[subdomain]/dashboard/cars/page.tsx
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';

async function getDealerCars(subdomain: string) {
  const dealer = await prisma.dealer.findUnique({
    where: { subdomain },
    include: {
      cars: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!dealer) return null;

  return {
    dealer,
    cars: dealer.cars,
  };
}

export default async function DealerCarsPage({
  params,
}: {
  params: { subdomain: string };
}) {
  const data = await getDealerCars(params.subdomain);

  if (!data) {
    notFound();
  }

  const { dealer, cars } = data;

  // Calculate stats
  const listedCars = cars.filter((car) => car.carStreetsListed).length;
  const unlistedCars = cars.length - listedCars;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">
            Manage Cars
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {cars.length} total cars • {listedCars} listed • {unlistedCars} unlisted
          </p>
        </div>
        <Link
          href={`/admin/cars?dealerId=${dealer.id}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add New Car
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Total Inventory
          </p>
          <p className="text-3xl font-semibold text-gray-900 dark:text-white mt-2">
            {cars.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Listed Cars
          </p>
          <p className="text-3xl font-semibold text-green-600 mt-2">
            {listedCars}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Unlisted Cars
          </p>
          <p className="text-3xl font-semibold text-yellow-600 mt-2">
            {unlistedCars}
          </p>
        </div>
      </div>

      {/* Cars List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Your Inventory
          </h2>

          {cars.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🚗</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No cars in inventory
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start adding cars to showcase on your storefront
              </p>
              <Link
                href={`/admin/cars?dealerId=${dealer.id}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                Add Your First Car
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Car Details
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 hidden md:table-cell">
                      Price
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                      Details
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cars.map((car) => {
                    const images = Array.isArray(car.images) ? car.images as string[] : [];
                    const displayPrice = new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0,
                    }).format(Number(car.price));

                    return (
                      <tr
                        key={car.id}
                        className="border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {images[0] ? (
                              <img
                                src={images[0]}
                                alt={car.title}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">🚗</span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white line-clamp-1">
                                {car.title}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {car.brand} {car.model}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {displayPrice}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                          <div className="space-y-1">
                            <p>{car.year} • {car.fuelType}</p>
                            <p>{car.kmDriven?.toLocaleString()} km</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          {car.carStreetsListed ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400">
                              <Eye className="w-3 h-3" />
                              Listed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400">
                              <EyeOff className="w-3 h-3" />
                              Unlisted
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/cars/${car.id}`}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              title="Edit car"
                            >
                              <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </Link>
                            <Link
                              href={`/dealers/${params.subdomain}/cars/${car.id}`}
                              target="_blank"
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              title="View on storefront"
                            >
                              <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
