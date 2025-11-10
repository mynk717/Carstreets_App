import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // ✅ Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('❌ Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🕐 Cron job started: Processing scheduled posts for all dealers');

    const now = new Date();

    // ✅ Get all dealers with scheduled posts
    const dealersWithScheduledPosts = await prisma.dealer.findMany({
      where: {
        contentCalendar: {
          some: {
            status: 'scheduled',
            scheduledDate: { lte: now }
          }
        }
      },
      select: {
        id: true,
        subdomain: true,
        businessName: true,
        metaAccessToken: true
      }
    });

    console.log(`📊 Found ${dealersWithScheduledPosts.length} dealers with scheduled posts`);

    if (dealersWithScheduledPosts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No scheduled posts to process',
        processed: 0
      });
    }

    const results = [];

    // ✅ Process each dealer
    for (const dealer of dealersWithScheduledPosts) {
      try {
        console.log(`🔄 Processing dealer: ${dealer.businessName} (${dealer.subdomain})`);

        // Skip dealers without connected social media
        if (!dealer.metaAccessToken) {
          console.log(`⚠️  Skipping ${dealer.subdomain}: No social media connected`);
          results.push({
            dealerId: dealer.id,
            subdomain: dealer.subdomain,
            success: false,
            skipped: true,
            reason: 'No social media connected'
          });
          continue;
        }

        // ✅ Call dealer-specific posting route
        const baseUrl = process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}` 
          : (process.env.NEXTAUTH_URL || 'http://localhost:3000');

        const response = await fetch(
          `${baseUrl}/api/dealers/${dealer.subdomain}/content/postScheduled`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'authorization': authHeader || ''
            }
          }
        );

        const result = await response.json();

        results.push({
          dealerId: dealer.id,
          subdomain: dealer.subdomain,
          success: response.ok,
          ...result
        });

        if (response.ok) {
          console.log(`✅ ${dealer.subdomain}: Posted ${result.processed || 0} items`);
        } else {
          console.error(`❌ ${dealer.subdomain}: ${result.error || 'Unknown error'}`);
        }

      } catch (dealerError) {
        console.error(`❌ Error processing dealer ${dealer.subdomain}:`, dealerError);
        results.push({
          dealerId: dealer.id,
          subdomain: dealer.subdomain,
          success: false,
          error: dealerError instanceof Error ? dealerError.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    console.log(`✅ Cron job completed: ${successCount}/${dealersWithScheduledPosts.length} dealers successful`);

    return NextResponse.json({
      success: true,
      message: `Processed ${dealersWithScheduledPosts.length} dealers`,
      successfulDealers: successCount,
      totalDealers: dealersWithScheduledPosts.length,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Cron job error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// ✅ Also support GET for Vercel Cron
export async function GET(request: NextRequest) {
  return POST(request);
}
