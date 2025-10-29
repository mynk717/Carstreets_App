import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/api/auth/[...nextauth]/route';
import { AutoContentPipeline } from '@/lib/agents/autoContentPipeline';

export async function POST(
  request: NextRequest,
  { params }: { params: { subdomain: string; id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { subdomain, id } = params;

    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: { id: true, email: true }
    });
    if (!dealer) return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });
    if (session.user.email !== dealer.email) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const item = await prisma.contentCalendar.findUnique({
      where: { id },
      include: { car: true, dealer: true }
    });
    if (!item || item.dealerId !== dealer.id) return NextResponse.json({ error: 'Content not found' }, { status: 404 });

    const contentEngine = new AutoContentPipeline();

    // Option A: generator returns { text, hashtags }
    const res = await contentEngine.generateUniqueText(item.car, item.platform || 'facebook');
    const textContent = typeof res === 'string' ? res : res.text;

    await prisma.contentCalendar.update({
      where: { id },
      data: { textContent }
    });

    return NextResponse.json({ success: true, textContent });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to regenerate' }, { status: 500 });
  }
}
