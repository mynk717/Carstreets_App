import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function DealerCarsPage(context) {
  const { params } = context;
  const subdomain = params?.subdomain;
  const dealer = await prisma.dealer.findUnique({
    where: { subdomain },
    select: { id: true, name: true }
  });
  if (!dealer) return <div>Dealer not found</div>;

  const cars = await prisma.car.findMany({
    where: { dealerId: dealer.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      brand: true, // use brand, not make!
      model: true,
      year: true,
      createdAt: true,
    }
  });

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">
        Car Inventory for {dealer.name}
      </h1>
      <Link href={`/dealers/${subdomain}/cars/new`}>
        <button className="mb-4 px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700">
          Add New Car
        </button>
      </Link>
      {cars.length === 0 ? (
        <div className="bg-yellow-50 text-gray-700 rounded p-6 mt-4">
          No cars added yet.
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {cars.map(car => (
            <li key={car.id} className="py-3 flex items-center justify-between">
              <span>
                <b>{car.brand} {car.model}</b> ({car.year}) | Added: {new Date(car.createdAt).toLocaleDateString()}
              </span>
              <Link href={`/dealers/${subdomain}/cars/${car.id}`}>
                <button className="ml-3 px-3 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700">
                  Edit
                </button>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
