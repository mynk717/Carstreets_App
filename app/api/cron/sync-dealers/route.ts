import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DealerCacheService } from '@/lib/services/dealer-cache.service';

export async function GET(request: NextRequest) {
    try {
        console.log('🔄 [Sync] Starting dealer sync to Redis...');

        // Verify authorization (Vercel Cron or manual call with secret)
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (authHeader !== `Bearer ${cronSecret}`) {
            console.error('❌ [Sync] Unauthorized request');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all dealers with WhatsApp connected
        console.log('📥 [Sync] Fetching dealers from Prisma...');
        const dealers = await prisma.dealer.findMany({
            where: {
                whatsappPhoneNumberId: { not: null },
            },
            select: {
                id: true,
                subdomain: true,
                businessName: true,
                email: true,
                whatsappPhoneNumberId: true,
            },
        });

        console.log(`📦 [Sync] Found ${dealers.length} dealers with WhatsApp`);

        // Cache all dealers to Redis
        const cachedCount = await DealerCacheService.syncAllDealers(dealers);

        const result = {
            success: true,
            cached: cachedCount,
            total: dealers.length,
            timestamp: new Date().toISOString(),
            dealers: dealers.map(d => ({
                subdomain: d.subdomain,
                phoneId: d.whatsappPhoneNumberId,
            })),
        };

        console.log('✅ [Sync] Dealer sync completed successfully');
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('❌ [Sync] Error:', error);
        return NextResponse.json(
            {
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            },
            { status: 500 }
        );
    }
}