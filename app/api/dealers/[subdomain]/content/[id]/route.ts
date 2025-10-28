import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/api/auth/[...nextauth]/route';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string; id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { subdomain, id } = await params;

    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: { id: true, email: true }
    });
    if (!dealer) return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });
    if (session.user.email !== dealer.email) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const item = await prisma.contentCalendar.findUnique({ where: { id } });
    if (!item || item.dealerId !== dealer.id) return NextResponse.json({ error: 'Content not found' }, { status: 404 });

    await prisma.contentCalendar.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to delete' }, { status: 500 });
  }
}
