import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/api/auth/[...nextauth]/route';

// TODO: replace with your nano-banana (or fal) generation
async function generateNewImage(item: any) {
  // Return a URL to the new image (e.g., from Cloudinary or direct fal storage)
  return item.car?.images?.[0] || ''; // placeholder: use original as fallback
}

export async function POST(
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

    const item = await prisma.contentCalendar.findUnique({
      where: { id },
      include: { car: { select: { images: true, title: true } } }
    });
    if (!item || item.dealerId !== dealer.id) return NextResponse.json({ error: 'Content not found' }, { status: 404 });

    const imageUrl = await generateNewImage(item);

    await prisma.contentCalendar.update({
      where: { id },
      data: { generatedImage: imageUrl, brandedImage: imageUrl } // set as both for preview
    });

    return NextResponse.json({ success: true, imageUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to regenerate image' }, { status: 500 });
  }
}
