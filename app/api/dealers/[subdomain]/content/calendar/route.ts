import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/[...nextauth]";

import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/[...nextauth]";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/[...nextauth]";


export async function GET(request: NextRequest) {
const session = await getServerSession(authOptions, request);
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
const dealer = await prisma.dealer.findFirst({
  where: { dealerId: dealer.id,  subdomain: params.subdomain, userId: session.user.id }
});
if (!dealer) {
  return NextResponse.json({ error: "Forbidden: Not your dealer" }, { status: 403 });
}

  try {
    console.log('🗓️ Loading content calendar...');
    
    // ✅ FIXED: Add Vercel bypass headers like other routes
    const headers: Record<string, string> = {};
    
    // Add Vercel bypass token if available (same pattern as other files)
    if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
      headers['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    }
    
    // Verify admin authorization
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all content calendar items
    const contentItems = await prisma.contentCalendar.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        car: {
          select: {
            brand: true,
            model: true,
            year: true,
            price: true
          }
        }
      }
    });

    // ✅ FIXED: Convert BigInt to string before JSON serialization
    const serializedContent = contentItems.map(item => ({
      ...item,
      // Convert any BigInt fields to strings
      generationCost: typeof item.generationCost === 'bigint' ? item.generationCost.toString() : item.generationCost,
      uniquenessScore: typeof item.uniquenessScore === 'bigint' ? item.uniquenessScore.toString() : item.uniquenessScore,
      car: item.car ? {
        ...item.car,
        price: typeof item.car.price === 'bigint' ? item.car.price.toString() : item.car.price,
        year: typeof item.car.year === 'bigint' ? item.car.year.toString() : item.car.year
      } : item.car
    }));

    return NextResponse.json({
      success: true,
      content: serializedContent
    });
    
  } catch (error) {
    console.error('💥 Failed to load calendar:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
