import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/api/auth/[...nextauth]/route';

// TODO: integrate your banana/fal pipeline here
async function editWithBanana({ baseImage, backgroundUrl }: { baseImage: string; backgroundUrl: string }) {
  // Call your model and return the edited image URL
  return backgroundUrl; // placeholder: pretend banana returns this
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string; id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { subdomain, id } = await params;
    const { backgroundUrl } = await request.json();

    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: { id: true, email: true }
    });
    if (!dealer) return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });
    if (session.user.email !== dealer.email) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const item = await prisma.contentCalendar.findUnique({
      where: { id },
      include: { car: { select: { images: true } } }
    });
    if (!item || item.dealerId !== dealer.id) return NextResponse.json({ error: 'Content not found' }, { status: 404 });

    const base = item.finalImage || item.brandedImage || item.generatedImage || item.car?.images?.[0];
    if (!base) return NextResponse.json({ error: 'No base image found' }, { status: 400 });

    const editedImageUrl = await editWithBanana({ baseImage: base, backgroundUrl });

    await prisma.contentCalendar.update({
      where: { id },
      data: { finalImage: editedImageUrl }
    });

    return NextResponse.json({ success: true, editedImageUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to edit image' }, { status: 500 });
  }
}
