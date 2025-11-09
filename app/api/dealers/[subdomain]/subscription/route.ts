import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// UPDATE/UPGRADE/DOWNGRADE Plan
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
    const { newPlan } = await request.json();

    // Verify dealer ownership
    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: { id: true, plan: true }
    });

    if (!dealer || dealer.id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const planPricing: Record<string, number> = {
      free: 0,
      starter: 2999,
      professional: 4999,
      enterprise: 9999
    };

    const currentPrice = planPricing[dealer.plan] || 0;
    const newPrice = planPricing[newPlan] || 0;

    // Downgrade or Free - instant
    if (newPrice <= currentPrice) {
      await prisma.dealer.update({
        where: { id: dealer.id },
        data: {
          plan: newPlan,
          subscriptionStatus: newPlan === 'free' ? 'active' : 'active',
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Plan updated successfully'
      });
    }

    // Upgrade - requires payment
    const paymentUrl = `https://mktgdime.com/payment?${new URLSearchParams({
      service: 'MotoYard Plan Upgrade',
      tier: `${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)} Plan`,
      price: newPrice.toString(),
      dealerId: dealer.id,
      subdomain: subdomain,
      source: 'motoyard-upgrade'
    }).toString()}`;

    return NextResponse.json({
      success: true,
      requiresPayment: true,
      paymentUrl
    });
  } catch (error) {
    console.error('Subscription update error:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

// CANCEL Subscription
export async function DELETE(
  request: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subdomain } = params;

    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: { id: true }
    });

    if (!dealer || dealer.id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Downgrade to free plan
    await prisma.dealer.update({
      where: { id: dealer.id },
      data: {
        plan: 'free',
        subscriptionStatus: 'cancelled',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled'
    });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
