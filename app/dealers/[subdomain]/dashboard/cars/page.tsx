import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, Edit, Eye, EyeOff } from 'lucide-react';
import { CarActionsClient } from './CarActionsClient';
import { CarImage } from './CarImage';

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

// Updated usage limits
const USAGE_LIMITS = {
  free: 5,
  starter: 15,
  professional: 50,
  enterprise: -1, // Unlimited
};

export default async function DealerCarsPage({
  params,
}: {
  params: { subdomain: string };
}) {
  const { subdomain } = await params;
  const data = await getDealerCars(subdomain);

  if (!data) {
    notFound();
  }

  const { dealer, cars } = data;

  // Calculate stats
  const listedCars = cars.filter((car) => car.carStreetsListed).length;
  const unlistedCars = cars.length - listedCars;

  // Usage limit calculation
  const plan = dealer.plan || 'free';
  const maxCars = USAGE_LIMITS[plan as keyof typeof USAGE_LIMITS] || USAGE_LIMITS.free;
  const carsLeft = maxCars === -1 ? 'Unlimited' : Math.max(0, maxCars - cars.length);
  const canAddMore = maxCars === -1 || cars.length < maxCars;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Cars</h1>
          <p className="text-gray-600 mt-1">
            {cars.length} total cars • {listedCars} listed • {unlistedCars} unlisted
          </p>
        </div>
        
        {canAddMore ? (
          <Link
            href={`/dealers/${subdomain}/dashboard/cars/new`}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add New Car
          </Link>
        ) : (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg">
            ⚠️ Limit Reached: Upgrade to add more cars
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Inventory</p>
          <p className="text-3xl font-bold text-gray-900">{cars.length}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg shadow-sm border border-green-200">
          <p className="text-sm text-green-700 mb-1">Listed Cars</p>
          <p className="text-3xl font-bold text-green-600">{listedCars}</p>
        </div>
        <div className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Unlisted Cars</p>
          <p className="text-3xl font-bold text-gray-500">{unlistedCars}</p>
        </div>
        <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-200">
          <p className="text-sm text-blue-700 mb-1">
            {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
          </p>
          <p className="text-3xl font-bold text-blue-600">
            {carsLeft === 'Unlimited' ? '∞' : carsLeft}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {carsLeft === 'Unlimited' ? 'No limits' : 'cars left'}
          </p>
        </div>
      </div>

      {/* Cars Table */}
      {cars.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">🚗</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No cars yet
          </h3>
          <p className="text-gray-500 mb-6">
            Start adding cars to showcase on your storefront
          </p>
          <Link
            href={`/dealers/${subdomain}/dashboard/cars/new`}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Your First Car
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">
                    Car Details
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">
                    Price
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">
                    Details
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-right p-4 text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cars.map((car) => {
                  const images = Array.isArray(car.images) ? car.images : [];
                  const displayPrice =
                    typeof car.price === 'bigint'
                      ? `₹${car.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
                      : car.price;

                  return (
                    <tr key={car.id} className="hover:bg-gray-50 transition-colors">
                      {/* Car Details */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {images[0] ? (
                            <CarImage
                              src={String(images[0])}
                              alt={car.title}
                              className="w-20 h-16 object-cover rounded-lg border border-gray-200"
                            />
                          ) : (
                            <div className="w-20 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                              🚗
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900 line-clamp-1">
                              {car.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              {car.brand} {car.model}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="p-4">
                        <p className="font-bold text-gray-900">{displayPrice}</p>
                      </td>

                      {/* Details */}
                      <td className="p-4">
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>{car.year} • {car.fuelType}</p>
                          <p>{car.kmDriven?.toLocaleString()} km</p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {car.carStreetsListed ? (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                            <Eye className="w-3 h-3" />
                            Listed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                            <EyeOff className="w-3 h-3" />
                            Unlisted
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Edit Button */}
                          <Link
                                  href={`/dealers/${subdomain}/cars/${car.id}/edit`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit car"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>

                          {/* Delete Button - Client Component */}
                          <CarActionsClient car={car} subdomain={subdomain} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Usage Warning */}
      {!canAddMore && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <h4 className="font-semibold text-yellow-900 mb-1">
                Car Limit Reached
              </h4>
              <p className="text-sm text-yellow-800">
                You've reached the limit of {maxCars} cars for your {plan} plan.
                Upgrade to add more cars and unlock premium features.
              </p>
              <Link
                href={`/dealers/${subdomain}/dashboard/settings`}
                className="inline-block mt-3 bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
              >
                Upgrade Plan
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
