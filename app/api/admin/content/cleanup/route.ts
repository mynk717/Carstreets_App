import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/auth/admin';

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Starting content calendar cleanup...');
    
    // Verify admin authorization
    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { maxItems = 20, autoCleanup = false } = await request.json();

    // Count total content items
    const totalCount = await prisma.contentCalendar.count();
    
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
        orderBy: { createdAt: 'asc' },
        take: itemsToDelete,
        select: { id: true }
      });
      
      const idsToDelete = oldestItems.map(item => item.id);
      
      // Delete oldest items
      const deleteResult = await prisma.contentCalendar.deleteMany({
        where: {
          id: { in: idsToDelete }
        }
      });

      console.log(`✅ Auto-cleanup completed: Deleted ${deleteResult.count} old items`);
      
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
