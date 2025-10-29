import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/api/auth/[...nextauth]/route';
import catalogService from '@/lib/services/catalogService';

export async function POST(
  request: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subdomain } = params;
    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: { id: true, email: true },
    });

    if (!dealer) return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });
    if (session.user.email !== dealer.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await catalogService.syncToMetaCatalog(dealer.id);

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
