import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ✅ Global BigInt serialization fix
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const data = await req.json();
    const { brand, model, year, price, kmDriven, fuelType, transmission, owners, location, description, images } = data;

    const { subdomain } = await params;

    const dealer = await prisma.dealer.findUnique({ where: { subdomain } });
    if (!dealer) {
      return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
    }

    const car = await prisma.car.create({
      data: {
        brand, 
        model, 
        year: Number(year), 
        price: Number(price), 
        kmDriven: Number(kmDriven),
        fuelType, 
        transmission, 
        owners: Number(owners), 
        location, 
        description,
        dealer: { connect: { id: dealer.id } },
        images: images ?? [],
        title: `${brand} ${model} ${year}`,
        sellerType: "dealer",
        postedDate: new Date().toISOString(),
        dataSource: "manual",
        isVerified: true,
      },
    });

    return NextResponse.json({ success: true, car });
  } catch (error: any) {
    console.error('Car creation error:', error);
    return NextResponse.json({ error: error.message || "Failed to add car" }, { status: 500 });
  }
}
