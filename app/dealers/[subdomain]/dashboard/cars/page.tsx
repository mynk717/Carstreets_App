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
          <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--color-text)]">
            Manage Cars
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            {cars.length} total cars • {listedCars} listed • {unlistedCars} unlisted
          </p>
        </div>
        <Link
          href={`/dealers/${params.subdomain}/dashboard/cars/new`}
          className="btn btn--primary inline-flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Car
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card card__body">
          <p className="text-sm text-[var(--color-text-secondary)] font-medium">
            Total Inventory
          </p>
          <p className="text-3xl font-semibold text-[var(--color-text)] mt-2">
            {cars.length}
          </p>
        </div>
        <div className="card card__body">
          <p className="text-sm text-[var(--color-text-secondary)] font-medium">
            Listed Cars
          </p>
          <p className="text-3xl font-semibold text-[var(--color-success)] mt-2">
            {listedCars}
          </p>
        </div>
        <div className="card card__body">
          <p className="text-sm text-[var(--color-text-secondary)] font-medium">
            Unlisted Cars
          </p>
          <p className="text-3xl font-semibold text-[var(--color-warning)] mt-2">
            {unlistedCars}
          </p>
        </div>
      </div>

      {/* Cars List */}
      <div className="card card__body">
        <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">
          Your Inventory
        </h2>

        {cars.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚗</div>
            <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
              No cars in inventory
            </h3>
            <p className="text-[var(--color-text-secondary)] mb-6">
              Start adding cars to showcase on your storefront
            </p>
            <Link
              href={`/dealers/${params.subdomain}/dashboard/cars/new`}
              className="btn btn--primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Your First Car
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--color-text-secondary)]">
                    Car Details
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--color-text-secondary)] hidden md:table-cell">
                    Price
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--color-text-secondary)] hidden lg:table-cell">
                    Details
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--color-text-secondary)] hidden sm:table-cell">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--color-text-secondary)]">
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
                      className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-secondary)] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {images[0] && (
                            <img
                              src={images[0]}
                              alt={car.title}
                              className="w-16 h-16 object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-car.jpg';
                              }}
                            />
                          )}
                          <div>
                            <p className="font-medium text-[var(--color-text)] line-clamp-1">
                              {car.title}
                            </p>
                            <p className="text-sm text-[var(--color-text-secondary)]">
                              {car.brand} {car.model}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="font-semibold text-[var(--color-text)]">
                          {displayPrice}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-[var(--color-text-secondary)] hidden lg:table-cell">
                        <div className="space-y-1">
                          <p>{car.year} • {car.fuelType}</p>
                          <p>{car.kmDriven?.toLocaleString()} km</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        {car.carStreetsListed ? (
                          <span className="status status--success inline-flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            Listed
                          </span>
                        ) : (
                          <span className="status status--warning inline-flex items-center gap-1">
                            <EyeOff className="w-3 h-3" />
                            Unlisted
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dealers/${params.subdomain}/dashboard/cars/${car.id}/edit`}
                            className="p-2 hover:bg-[var(--color-secondary)] rounded-lg transition-colors"
                            title="Edit car"
                          >
                            <Edit className="w-4 h-4 text-[var(--color-text-secondary)]" />
                          </Link>
                          <Link
                            href={`/dealers/${params.subdomain}/cars/${car.id}`}
                            target="_blank"
                            className="p-2 hover:bg-[var(--color-secondary)] rounded-lg transition-colors"
                            title="View on storefront"
                          >
                            <Eye className="w-4 h-4 text-[var(--color-text-secondary)]" />
                          </Link>
                          <button
                            className="p-2 hover:bg-[var(--color-secondary)] rounded-lg transition-colors"
                            title="Delete car"
                          >
                            <Trash2 className="w-4 h-4 text-[var(--color-error)]" />
                          </button>
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
  );
}
