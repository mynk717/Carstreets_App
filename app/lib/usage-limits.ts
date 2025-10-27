// lib/usage-limits.ts
import { prisma } from './prisma';

export interface PlanLimits {
  cars: number;
  aiContent: number;
  socialPosts: number;
}

// ✅ Updated market-practical limits
export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    cars: 5,              // Changed from unlimited
    aiContent: 5,
    socialPosts: 1
  },
  starter: {
    cars: 15,             // Changed from 50
    aiContent: 999999,    // Unlimited
    socialPosts: 999999   // Unlimited
  },
  professional: {
    cars: 50,             // Changed from 200
    aiContent: 999999,
    socialPosts: 999999
  },
  enterprise: {
    cars: 999999,         // Contact sales (unlimited)
    aiContent: 999999,
    socialPosts: 999999
  }
};

export async function checkUsageLimit(
  dealerId: string,
  type: 'cars' | 'aiContent' | 'socialPosts'
): Promise<{ allowed: boolean; message?: string; current: number; limit: number }> {
  const dealer = await prisma.dealer.findUnique({
    where: { id: dealerId },
    select: {
      plan: true,
      _count: {
        select: {
          cars: true
        }
      }
    }
  });

  if (!dealer) {
    return { allowed: false, message: 'Dealer not found', current: 0, limit: 0 };
  }

  const limits = PLAN_LIMITS[dealer.plan] || PLAN_LIMITS.free;
  const limit = limits[type];

  // ✅ Use Prisma _count relation (automatically updated)
  let current = 0;
  switch (type) {
    case 'cars':
      current = dealer._count.cars;
      break;
    case 'aiContent':
      current = 0; // TODO: Implement if tracking
      break;
    case 'socialPosts':
      current = 0; // TODO: Implement if tracking
      break;
  }

  const allowed = current < limit;

  return {
    allowed,
    message: allowed
      ? undefined
      : `${dealer.plan === 'free' ? 'Free plan' : 'Plan'} limit reached (${current}/${limit}). Upgrade to add more.`,
    current,
    limit
  };
}

// ✅ Helper to get full usage summary
export async function getUsageSummary(dealerId: string) {
  const dealer = await prisma.dealer.findUnique({
    where: { id: dealerId },
    select: {
      plan: true,
      _count: {
        select: {
          cars: true
        }
      }
    }
  });

  if (!dealer) {
    return null;
  }

  const limits = PLAN_LIMITS[dealer.plan] || PLAN_LIMITS.free;

  return {
    plan: dealer.plan,
    cars: {
      current: dealer._count.cars,
      limit: limits.cars,
      remaining: limits.cars === 999999 ? -1 : Math.max(0, limits.cars - dealer._count.cars),
      allowed: dealer._count.cars < limits.cars
    },
    aiContent: {
      current: 0,
      limit: limits.aiContent,
      remaining: -1,
      allowed: true
    },
    socialPosts: {
      current: 0,
      limit: limits.socialPosts,
      remaining: -1,
      allowed: true
    }
  };
}
