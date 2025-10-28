import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/api/auth/[...nextauth]/route';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string; id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subdomain, id } = await params;
    const { textContent, status, scheduledDate } = await request.json();

    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: { id: true, email: true }
    });
    if (!dealer) return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });
    if (session.user.email !== dealer.email) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const content = await prisma.contentCalendar.findUnique({ where: { id } });
    if (!content || content.dealerId !== dealer.id) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    const data: any = {};
    if (typeof textContent === 'string') data.textContent = textContent;
    if (typeof status === 'string') data.status = status;
    if (scheduledDate) data.scheduledDate = new Date(scheduledDate);

    const updated = await prisma.contentCalendar.update({
      where: { id },
      data
    });

    return NextResponse.json({ success: true, content: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
