// app/api/dealers/[subdomain]/catalog/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/api/auth/[...nextauth]/route';
import catalogService from '@/lib/services/catalogService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subdomain } = await params;
    
    // Fetch dealer with subdomain field included
    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: { 
        id: true, 
        email: true,
        subdomain: true,
        facebookCatalogId: true,
        metaAccessToken: true,
      },
    });

    if (!dealer) {
      return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });
    }

    // ✅ Authorization: Check if logged-in user owns this dealer account
    // Option 1: By subdomain (if session stores subdomain)
    const userSubdomain = session.user.subdomain || session.user.name; // Adjust based on your session structure
    
    // Option 2: By dealer ID (if session stores dealerId)
    const userDealerId = session.user.id || session.user.dealerId;
    
    // Option 3: By email (fallback, but flexible for changed emails)
    const userEmail = session.user.email;

    // Check authorization using multiple methods
    const isAuthorized = 
      userSubdomain === subdomain ||  // Check subdomain match
      userDealerId === dealer.id ||   // Check dealer ID match
      userEmail === dealer.email;     // Check email match (least reliable)

    if (!isAuthorized) {
      console.log('❌ Authorization failed:', {
        userSubdomain,
        expectedSubdomain: subdomain,
        userDealerId,
        expectedDealerId: dealer.id,
        userEmail,
        dealerEmail: dealer.email,
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check for catalog ID
    if (!dealer.facebookCatalogId) {
      return NextResponse.json(
        { error: 'Facebook Catalog ID not configured. Please add it in Settings.' },
        { status: 400 }
      );
    }

    console.log('✅ Syncing catalog for dealer:', dealer.id);
    const result = await catalogService.syncToMetaCatalog(dealer.id);

    return NextResponse.json(result);
  } catch (e: any) {
    console.error('❌ Catalog sync error:', e);
    return NextResponse.json(
      { error: e?.message || 'Sync failed' }, 
      { status: 500 }
    );
  }
}
