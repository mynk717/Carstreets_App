import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subdomain } = await params;

    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: { id: true, email: true },
    });

    if (!dealer || session.user.email !== dealer.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get conversation summaries with contact details
    const conversations = await prisma.whatsAppConversationSummary.findMany({
      where: {
        dealerId: dealer.id,
        archived: false,
      },
      include: {
        contact: {
          select: {
            id: true,
            phoneNumber: true,
            name: true,
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
      take: 50,
    });

    return NextResponse.json({ conversations });
  } catch (error: any) {
    console.error('❌ Get conversations error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
