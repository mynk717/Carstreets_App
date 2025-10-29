import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import CatalogDashboardClient from '@/dealers/[subdomain]/dashboard/catalog/CatalogDashboardClient';

async function getCatalogData(subdomain: string) {
  const dealer = await prisma.dealer.findUnique({
    where: { subdomain },
    select: {
      id: true,
      businessName: true,
      name: true,
      facebookCatalogId: true,
      metaAccessToken: true,
    },
  });

  if (!dealer) return null;

  const catalogInfo = await prisma.productCatalog.findFirst({
    where: { dealerId: dealer.id },
    orderBy: { updatedAt: 'desc' },
  });

  const inventoryCount = await prisma.car.count({
    where: {
      dealerId: dealer.id,
      isVerified: true,
      availability: 'in_stock',
    },
  });

  return {
    dealer,
    catalogInfo,
    inventoryCount,
  };
}

export default async function CatalogDashboardPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const data = await getCatalogData(subdomain);

  if (!data) {
    notFound();
  }

  return (
    <CatalogDashboardClient
      subdomain={subdomain}
      dealer={data.dealer}
      catalogInfo={data.catalogInfo}
      inventoryCount={data.inventoryCount}
    />
  );
}
