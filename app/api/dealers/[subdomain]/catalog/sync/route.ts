// app/api/dealers/[subdomain]/catalog/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/api/auth/[...nextauth]/route';
import catalogService from '@/lib/services/catalogService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> } // ← Changed to Promise
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subdomain } = await params; // ← Added await
    
    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: { 
        id: true, 
        email: true,
        facebookCatalogId: true,
        metaAccessToken: true,
      },
    });

    if (!dealer) return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });
    if (session.user.email !== dealer.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check for catalog ID
    if (!dealer.facebookCatalogId) {
      return NextResponse.json(
        { error: 'Facebook Catalog ID not configured. Please add it in Settings.' },
        { status: 400 }
      );
    }

    const result = await catalogService.syncToMetaCatalog(dealer.id);

    return NextResponse.json(result);
  } catch (e: any) {
    console.error('❌ Catalog sync error:', e);
    return NextResponse.json({ error: e?.message || 'Sync failed' }, { status: 500 });
  }
}
