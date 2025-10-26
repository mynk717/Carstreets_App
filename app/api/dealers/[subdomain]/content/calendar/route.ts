import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

function extractSubdomain(request: NextRequest) {
  const pathParts = request.nextUrl.pathname.split("/");
  return pathParts[pathParts.indexOf("dealers") + 1];
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const subdomain = extractSubdomain(request);

    const dealer = await prisma.dealer.findUnique({
      where: { subdomain }
    });
    if (!dealer) {
      return NextResponse.json({ error: "Forbidden: Not your dealer" }, { status: 403 });
    }

    const contentItems = await prisma.contentCalendar.findMany({
      where: { dealerId: dealer.id },
      orderBy: { createdAt: 'desc' },
      include: {
        car: {
          select: {
            brand: true,
            model: true,
            year: true,
            price: true,
          }
        }
      }
    });

    const serializedContent = contentItems.map(item => ({
      ...item,
      generationCost:
        typeof item.generationCost === 'bigint'
          ? String(item.generationCost)
          : item.generationCost ?? null,
      uniquenessScore:
        typeof item.uniquenessScore === 'bigint'
          ? String(item.uniquenessScore)
          : item.uniquenessScore ?? null,
      car: item.car
        ? {
            ...item.car,
            price:
              typeof item.car?.price === 'bigint'
                ? String(item.car.price)
                : item.car?.price ?? null,
            year:
              typeof item.car?.year === 'bigint'
                ? String(item.car.year)
                : item.car?.year ?? null,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      content: serializedContent
    });

  } catch (error) {
    console.error('Failed to load calendar:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
