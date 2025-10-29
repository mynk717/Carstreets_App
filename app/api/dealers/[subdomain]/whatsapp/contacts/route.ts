import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/api/auth/[...nextauth]/route';

export async function GET(
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

    const contacts = await prisma.whatsAppContact.findMany({
      where: { dealerId: dealer.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ contacts });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

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
    const { phoneNumber, name, tags } = await request.json();

    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: { id: true, email: true },
    });

    if (!dealer) return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });
    if (session.user.email !== dealer.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const contact = await prisma.whatsAppContact.create({
      data: {
        dealerId: dealer.id,
        phoneNumber,
        name,
        tags: tags || [],
      },
    });

    return NextResponse.json({ contact });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
