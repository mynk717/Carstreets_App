// lib/rateLimit.ts
import Redis from 'ioredis'

export class ContentRateLimiter {
  private redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
  
  async checkWeeklyLimits(userId: string): Promise<boolean> {
    const weekKey = `content:weekly:${userId}:${this.getWeekNumber()}`
    const currentUsage = parseInt(await this.redis.get(weekKey) || '0')
    
    const WEEKLY_LIMIT = 4 // Max 4 posts per week
    
    if (currentUsage >= WEEKLY_LIMIT) {
      throw new Error(`🚫 Weekly limit reached (${WEEKLY_LIMIT} posts). Reset in ${this.getDaysUntilReset()} days.`)
    }
    
    console.log(`📊 [RATE LIMIT] User ${userId}: ${currentUsage}/${WEEKLY_LIMIT} posts used this week`)
    return true
  }
  
  async updateWeeklyUsage(userId: string, postsGenerated: number) {
    const weekKey = `content:weekly:${userId}:${this.getWeekNumber()}`
    await this.redis.incrby(weekKey, postsGenerated)
    await this.redis.expire(weekKey, 604800) // 1 week TTL
    
    console.log(`📈 [RATE LIMIT] Updated usage: +${postsGenerated} posts for user ${userId}`)
  }
  
  private getWeekNumber(): string {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 1)
    const diff = now.getTime() - start.getTime()
    return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)).toString()
  }
  
  private getDaysUntilReset(): number {
    const now = new Date()
    const sunday = new Date(now)
    sunday.setDate(now.getDate() - now.getDay() + 7) // Next Sunday
    return Math.ceil((sunday.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
  }
}
