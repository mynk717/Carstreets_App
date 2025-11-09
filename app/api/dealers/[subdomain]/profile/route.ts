import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subdomain } = params;
    const body = await request.json();

    // Verify dealer ownership
    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: { id: true }
    });

    if (!dealer || dealer.id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update profile (exclude email - should never change)
    const updated = await prisma.dealer.update({
      where: { id: dealer.id },
      data: {
        name: body.name,
        businessName: body.businessName,
        phoneNumber: body.phoneNumber,
        location: body.location,
        description: body.description,
        updatedAt: new Date()
      }
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
