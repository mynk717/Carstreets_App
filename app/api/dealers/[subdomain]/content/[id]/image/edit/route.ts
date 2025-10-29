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
    const { backgroundUrl } = await request.json();

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

    let editedImageUrl = '';
    // Optionally pass background if provided, otherwise just regenerate
    if (backgroundUrl) {
      // You may have a method for banana-style inpainting, pseudo-code:
      // Example: editedImageUrl = await imageService.inpaintWithBanana(carData, backgroundUrl);

      // If you do not have a separate inpaint agent, just pass background as a param (or fallback to default)
      const platforms = [item.platform || 'facebook'];
      const imageResult = await imageService.generateContentImages(carData, platforms);
      editedImageUrl = imageResult.images?.[0]?.imageUrl || '';
    } else {
      const platforms = [item.platform || 'facebook'];
      const imageResult = await imageService.generateContentImages(carData, platforms);
      editedImageUrl = imageResult.images?.[0]?.imageUrl || '';
    }

    await prisma.contentCalendar.update({
      where: { id },
      data: { finalImage: editedImageUrl }
    });

    return NextResponse.json({ success: true, editedImageUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to edit image' }, { status: 500 });
  }
}
