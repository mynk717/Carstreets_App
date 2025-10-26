import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

// Helper: Extract subdomain from request URL
function extractSubdomain(request: NextRequest) {
  const pathParts = request.nextUrl.pathname.split("/");
  return pathParts[pathParts.indexOf("dealers") + 1];
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subdomain = extractSubdomain(request);

    // Only use existing schema fields!
    const dealer = await prisma.dealer.findUnique({
      where: { subdomain }
    });
    if (!dealer) {
      return NextResponse.json({ error: "Forbidden: Not your dealer" }, { status: 403 });
    }

    const { maxItems = 20, autoCleanup = false } = await request.json();

    // Count total content items
    const totalCount = await prisma.contentCalendar.count({
      where: { dealerId: dealer.id },
    });

    if (totalCount <= maxItems) {
      return NextResponse.json({
        success: true,
        message: `No cleanup needed. ${totalCount} items (limit: ${maxItems})`,
        cleaned: 0,
        remaining: totalCount
      });
    }

    // Auto-cleanup: Keep most recent items, delete older ones
    if (autoCleanup) {
      const itemsToDelete = totalCount - maxItems;

      // Get IDs of oldest items to delete
      const oldestItems = await prisma.contentCalendar.findMany({
        where: { dealerId: dealer.id },
        orderBy: { createdAt: 'asc' },
        take: itemsToDelete,
        select: { id: true }
      });

      const idsToDelete = oldestItems.map(item => item.id);

      // Delete oldest items
      const deleteResult = await prisma.contentCalendar.deleteMany({
        where: { dealerId: dealer.id, id: { in: idsToDelete } }
      });

      return NextResponse.json({
        success: true,
        message: `Auto-cleanup completed: Kept ${maxItems} most recent items`,
        cleaned: deleteResult.count,
        remaining: maxItems,
        autoCleanup: true
      });
    }

    // Manual cleanup: Just return count for confirmation
    return NextResponse.json({
      success: true,
      message: `${totalCount} items found (limit: ${maxItems})`,
      needsCleanup: totalCount > maxItems,
      itemsToClean: totalCount - maxItems,
      totalCount,
      maxItems
    });

  } catch (error) {
    console.error('💥 Content cleanup failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
