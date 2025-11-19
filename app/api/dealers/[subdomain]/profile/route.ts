import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }  // ✅ Fixed for Next.js 15
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subdomain } = await params;  // ✅ Await params
    const body = await request.json();

    // Verify dealer ownership
    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: { id: true }
    });

    if (!dealer || dealer.id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ✅ Build update data conditionally
    const updateData: any = {
      updatedAt: new Date()
    };

    // Only update fields that are provided
    if (body.name !== undefined) updateData.name = body.name;
    if (body.businessName !== undefined) updateData.businessName = body.businessName;
    if (body.phoneNumber !== undefined) updateData.phoneNumber = body.phoneNumber;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.logo !== undefined) updateData.logo = body.logo;  // ✅ Add logo support

    // Update profile (exclude email - should never change)
    const updated = await prisma.dealer.update({
      where: { id: dealer.id },
      data: updateData
    });

    return NextResponse.json({ success: true, dealer: updated });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
