import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    console.log('📅 Loading content calendar...');
    
    // // Verify admin authorization
    // const authResult = await verifyAdminAuth(request);
    // if (!authResult.success) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
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
    
    return NextResponse.json({
      success: true,
      content: contentItems
    });
    
  } catch (error) {
    console.error('💥 Failed to load calendar:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
