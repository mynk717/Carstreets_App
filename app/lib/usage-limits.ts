import { prisma } from './prisma'

export interface PlanLimits {
  cars: number
  aiContent: number
  socialPosts: number
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    cars: 5,
    aiContent: 5,
    socialPosts: 1
  },
  starter: {
    cars: 50,
    aiContent: 999999, // Unlimited
    socialPosts: 999999 // Unlimited
  },
  professional: {
    cars: 200,
    aiContent: 999999,
    socialPosts: 999999
  },
  enterprise: {
    cars: 999999,
    aiContent: 999999,
    socialPosts: 999999
  }
}

export async function checkUsageLimit(
  dealerId: string, 
  type: 'cars' | 'aiContent' | 'socialPosts'
): Promise<{ allowed: boolean; message?: string; current: number; limit: number }> {
  
  const dealer = await prisma.dealer.findUnique({
    where: { id: dealerId },
    select: {
      plan: true,
      carsCount: true,
      aiContentUsed: true,
      socialPostsUsed: true
    }
  })

  if (!dealer) {
    return { allowed: false, message: 'Dealer not found', current: 0, limit: 0 }
  }

  const limits = PLAN_LIMITS[dealer.plan] || PLAN_LIMITS.free
  const limit = limits[type]
  
  let current = 0
  switch(type) {
    case 'cars':
      current = dealer.carsCount
      break
    case 'aiContent':
      current = dealer.aiContentUsed
      break
    case 'socialPosts':
      current = dealer.socialPostsUsed
      break
  }

  const allowed = current < limit

  return {
    allowed,
    message: allowed ? undefined : `${dealer.plan === 'free' ? 'Free plan' : 'Plan'} limit reached. Upgrade to add more.`,
    current,
    limit
  }
}

export async function incrementUsage(
  dealerId: string,
  type: 'cars' | 'aiContent' | 'socialPosts'
): Promise<void> {
  const updateData: any = {}
  
  switch(type) {
    case 'cars':
      updateData.carsCount = { increment: 1 }
      break
    case 'aiContent':
      updateData.aiContentUsed = { increment: 1 }
      break
    case 'socialPosts':
      updateData.socialPostsUsed = { increment: 1 }
      break
  }

  await prisma.dealer.update({
    where: { id: dealerId },
    data: updateData
  })
}

export async function decrementUsage(
  dealerId: string,
  type: 'cars' | 'aiContent' | 'socialPosts'
): Promise<void> {
  const updateData: any = {}
  
  switch(type) {
    case 'cars':
      updateData.carsCount = { decrement: 1 }
      break
    case 'aiContent':
      updateData.aiContentUsed = { decrement: 1 }
      break
    case 'socialPosts':
      updateData.socialPostsUsed = { decrement: 1 }
      break
  }

  await prisma.dealer.update({
    where: { id: dealerId },
    data: updateData
  })
}
