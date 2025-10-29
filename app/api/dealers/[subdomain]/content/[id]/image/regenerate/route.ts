import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/api/auth/[...nextauth]/route';
import ImageGenerationService from '@/lib/agents/imageGenerationService';

export async function POST(
  request: NextRequest,
  { params }: { params: { subdomain: string; id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { subdomain, id } = params;
    const dealer = await prisma.dealer.findUnique({
      where: { subdomain }, select: { id: true, email: true }
    });
    if (!dealer) return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });
    if (session.user.email !== dealer.email) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const item = await prisma.contentCalendar.findUnique({
      where: { id },
      include: { car: true, dealer: true }
    });
    if (!item || item.dealerId !== dealer.id) return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    // Make sure images is string[]
    let imageUrls: string[] = [];
    if (item.car.images) {
      if (Array.isArray(item.car.images)) {
        imageUrls = item.car.images as string[];
      } else if (typeof item.car.images === 'string') {
        try {
          const parsed = JSON.parse(item.car.images);
          imageUrls = Array.isArray(parsed) ? parsed : [item.car.images];
        } catch {
          imageUrls = [item.car.images];
        }
      }
    }

    const carData = {
      id: item.car.id,
      brand: item.car.brand,
      model: item.car.model,
      year: item.car.year,
      price: Number(item.car.price),
      images: imageUrls,
    };

    const imageService = new ImageGenerationService();
    const platforms = [item.platform || 'facebook'];
    const imageResult = await imageService.generateContentImages(carData, platforms);
    const finalImageUrl = imageResult.images?.[0]?.imageUrl || '';

    await prisma.contentCalendar.update({
      where: { id },
      data: { generatedImage: finalImageUrl, brandedImage: finalImageUrl }
    });

    return NextResponse.json({ success: true, imageUrl: finalImageUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to regenerate image' }, { status: 500 });
  }
}
