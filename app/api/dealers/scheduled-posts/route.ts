import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all dealers with scheduled content
    const scheduledContent = await prisma.contentCalendar.findMany({
      where: {
        status: 'scheduled',
        scheduledDate: {
          lte: new Date()
        }
      },
      include: {
        dealer: true,
        car: true
      }
    });

    const results = [];
    
    for (const content of scheduledContent) {
      try {
        // Post to the appropriate platform
        const postResult = await fetch(`${process.env.VERCEL_URL}/api/social/${content.platform}/post`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dealerId: content.dealerId,
            textContent: content.textContent,
            imageUrl: content.finalImage || content.brandedImage || content.generatedImage,
            carId: content.carId
          })
        });

        if (postResult.ok) {
          await prisma.contentCalendar.update({
            where: { id: content.id },
            data: { 
              status: 'posted',
              postedAt: new Date()
            }
          });
          results.push({ id: content.id, status: 'posted' });
        } else {
          results.push({ id: content.id, status: 'failed', error: await postResult.text() });
        }
      } catch (e: any) {
        results.push({ id: content.id, status: 'error', error: e.message });
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: scheduledContent.length,
      results 
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
