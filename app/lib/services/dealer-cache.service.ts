import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export class DealerCacheService {
  private static CACHE_KEY = 'dealer:whatsapp:phoneid:';
  private static CACHE_TTL = 86400 * 7; // 7 days

  // Cache dealer data by WhatsApp Phone Number ID
  static async cacheDealerByPhoneId(
    phoneNumberId: string,
    dealerData: {
      id: string;
      subdomain: string;
      businessName: string;
      email: string;
    }
  ) {
    await redis.setex(
      `${this.CACHE_KEY}${phoneNumberId}`,
      this.CACHE_TTL,
      JSON.stringify(dealerData)
    );
    console.log(`✅ Cached dealer: ${dealerData.subdomain} (phoneId: ${phoneNumberId})`);
  }

  // Get dealer from cache (no Prisma lookup needed!)
  static async getDealerByPhoneId(phoneNumberId: string) {
    try {
      const cached = await redis.get(`${this.CACHE_KEY}${phoneNumberId}`);
      if (cached) {
        console.log(`✅ Found dealer in Redis for phoneId: ${phoneNumberId}`);
        return cached as any;
      }
      console.log(`⚠️ No dealer cached for phoneId: ${phoneNumberId}`);
      return null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  // Cache all dealers at once (run this on app startup or via cron)
  static async syncAllDealers(dealers: any[]) {
    const pipeline = redis.pipeline();
    let count = 0;
    
    for (const dealer of dealers) {
      if (dealer.whatsappPhoneNumberId) {
        pipeline.setex(
          `${this.CACHE_KEY}${dealer.whatsappPhoneNumberId}`,
          this.CACHE_TTL,
          JSON.stringify({
            id: dealer.id,
            subdomain: dealer.subdomain,
            businessName: dealer.businessName,
            email: dealer.email,
          })
        );
        count++;
      }
    }
    
    await pipeline.exec();
    console.log(`✅ Cached ${count} dealers to Redis`);
    return count;
  }

  // Clear a specific dealer cache
  static async clearDealerCache(phoneNumberId: string) {
    await redis.del(`${this.CACHE_KEY}${phoneNumberId}`);
    console.log(`🗑️ Cleared cache for phoneId: ${phoneNumberId}`);
  }

  // Clear all dealer caches
  static async clearAllCaches() {
    const keys = await redis.keys(`${this.CACHE_KEY}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`🗑️ Cleared ${keys.length} dealer caches`);
    }
    return keys.length;
  }
}