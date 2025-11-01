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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Manage Cars
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {cars.length} total • {listedCars} listed • {unlistedCars} unlisted
          </p>
        </div>
        
        {canAddMore ? (
          <Link
            href={`/dealers/${subdomain}/dashboard/cars/new`}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Add New Car</span>
            <span className="sm:hidden">Add Car</span>
          </Link>
        ) : (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg text-sm font-medium">
            ⚠️ Limit Reached
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
            Total Inventory
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {cars.length}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 sm:p-6 rounded-lg shadow-sm border border-green-200 dark:border-green-800">
          <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 mb-1">
            Listed Cars
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
            {listedCars}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
            Unlisted Cars
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-500 dark:text-gray-400">
            {unlistedCars}
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 sm:p-6 rounded-lg shadow-sm border border-blue-200 dark:border-blue-800">
          <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 mb-1">
            {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
            {carsLeft === 'Unlimited' ? '∞' : carsLeft}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            {carsLeft === 'Unlimited' ? 'No limits' : 'cars left'}
          </p>
        </div>
      </div>

      {/* Cars List - Mobile and Desktop Views */}
      {cars.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center">
          <div className="text-gray-400 dark:text-gray-600 text-5xl sm:text-6xl mb-4">🚗</div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No cars yet
          </h3>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6">
            Start adding cars to showcase on your storefront
          </p>
          <Link
            href={`/dealers/${subdomain}/dashboard/cars/new`}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add Your First Car
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {cars.map((car) => {
              const images = Array.isArray(car.images) ? car.images : [];
              const displayPrice =
                typeof car.price === 'bigint'
                  ? car.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  : car.price;

              return (
                <div 
                  key={car.id} 
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {/* Car image */}
                  {images[0] ? (
                    <CarImage
                      src={String(images[0])}
                      alt={car.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-5xl">
                      🚗
                    </div>
                  )}
                  
                  <div className="p-4 space-y-3">
                    {/* Title */}
                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                      {car.title}
                    </h3>
                    
                    {/* Price */}
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      ₹{displayPrice}
                    </p>
                    
                    {/* Details */}
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p className="flex items-center justify-between">
                        <span>{car.year} • {car.fuelType}</span>
                        <span>{car.transmission}</span>
                      </p>
                      <p>{car.kmDriven?.toLocaleString()} km driven</p>
                    </div>
                    
                    {/* Status Badge */}
                    <div>
                      {car.carStreetsListed ? (
                        <span className="inline-flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1.5 rounded-full text-xs font-medium">
                          <Eye className="w-3.5 h-3.5" />
                          Listed on Storefront
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-full text-xs font-medium">
                          <EyeOff className="w-3.5 h-3.5" />
                          Not Listed
                        </span>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <Link 
                        href={`/dealers/${subdomain}/cars/${car.id}/edit`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Link>
                      <CarActionsClient car={car} subdomain={subdomain} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Car Details
                    </th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Price
                    </th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Details
                    </th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Status
                    </th>
                    <th className="text-right p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {cars.map((car) => {
                    const images = Array.isArray(car.images) ? car.images : [];
                    const displayPrice =
                      typeof car.price === 'bigint'
                        ? `₹${car.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
                        : car.price;

                    return (
                      <tr key={car.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        {/* Car Details */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {images[0] ? (
                              <CarImage
                                src={String(images[0])}
                                alt={car.title}
                                className="w-20 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                              />
                            ) : (
                              <div className="w-20 h-16 bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center text-2xl">
                                🚗
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                                {car.title}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {car.brand} {car.model}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="p-4">
                          <p className="font-bold text-gray-900 dark:text-white">{displayPrice}</p>
                        </td>

                        {/* Details */}
                        <td className="p-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <p>{car.year} • {car.fuelType}</p>
                            <p>{car.kmDriven?.toLocaleString()} km</p>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          {car.carStreetsListed ? (
                            <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-xs font-medium">
                              <Eye className="w-3 h-3" />
                              Listed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-medium">
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
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
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
        </>
      )}

      {/* Usage Warning */}
      {!canAddMore && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                Car Limit Reached
              </h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                You've reached the limit of {maxCars} cars for your {plan} plan.
                Upgrade to add more cars and unlock premium features.
              </p>
              <Link
                href={`/dealers/${subdomain}/dashboard/settings`}
                className="inline-block mt-3 bg-yellow-600 dark:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 dark:hover:bg-yellow-600 transition-colors"
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
