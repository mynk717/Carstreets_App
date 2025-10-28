'use server';

import { prisma } from './prisma';

export async function checkWeeklyContentLimit(dealerId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  resetsAt: Date;
}> {
  const dealer = await prisma.dealer.findUnique({
    where: { id: dealerId },
    select: {
      plan: true,
      aiContentUsedThisWeek: true,
      aiContentWeekStartDate: true,
    }
  });

  if (!dealer) {
    throw new Error('Dealer not found');
  }

  const now = new Date();
  const weekStart = new Date(dealer.aiContentWeekStartDate);
  const daysSinceStart = Math.floor((now.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));

  let currentUsed = dealer.aiContentUsedThisWeek;
  let resetsAt = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Reset weekly counter if 7 days passed
  if (daysSinceStart >= 7) {
    await prisma.dealer.update({
      where: { id: dealerId },
      data: {
        aiContentUsedThisWeek: 0,
        aiContentWeekStartDate: now,
      }
    });
    currentUsed = 0;
    resetsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  // FREE: 2 per week | Others: Unlimited
  const limit = dealer.plan.toLowerCase() === 'free' ? 2 : 999999;
  const allowed = currentUsed < limit;

  return {
    allowed,
    used: currentUsed,
    limit,
    resetsAt,
  };
}

export async function incrementContentUsage(dealerId: string) {
  await prisma.dealer.update({
    where: { id: dealerId },
    data: {
      aiContentUsedThisWeek: { increment: 1 }
    }
  });
}
