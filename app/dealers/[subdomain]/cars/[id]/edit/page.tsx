import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { DealerCarEditForm } from './DealerCarEditForm';

export default async function DealerEditCarPage({
  params,
}: {
  params: { subdomain: string; id: string };
}) {
  const { subdomain, id } = await params;

  const dealer = await prisma.dealer.findUnique({
    where: { subdomain },
    select: { id: true, businessName: true }
  });

  const car = await prisma.car.findUnique({
    where: { id }
  });

  if (!dealer || !car) {
    notFound();
  }

  // Verify car belongs to dealer
  if (car.dealerId !== dealer.id) {
    redirect(`/dealers/${subdomain}/dashboard/cars`);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-6">
          <a 
            href={`/dealers/${subdomain}/dashboard/cars`}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            ← Back to Cars
          </a>
        </div>

        {/* Page Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Car</h1>
          <p className="text-gray-600 mt-1">{car.title}</p>
        </div>

        {/* Edit Form */}
        <DealerCarEditForm 
          car={car} 
          dealerId={dealer.id} 
          subdomain={subdomain} 
        />
      </div>
    </div>
  );
}
