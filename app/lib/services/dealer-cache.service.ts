import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export class DealerCacheService {
  private static CACHE_KEY = 'dealer:whatsapp:phoneid:';
  private static CACHE_TTL = 86400 * 7;

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
    console.log('[DealerCache] Cached dealer:', dealerData.subdomain, 'phoneId:', phoneNumberId);
  }

  static async getDealerByPhoneId(phoneNumberId: string) {
    try {
      console.log('[DealerCache] Looking up phoneId:', phoneNumberId);
      const key = `dealer:whatsapp:phoneid:${phoneNumberId}`;
      console.log('[DealerCache] Redis key:', key);
      
      // Use direct REST API instead of SDK
      const response = await fetch(
        `${process.env.UPSTASH_REDIS_REST_URL}/get/${encodeURIComponent(key)}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
          },
        }
      );
  
      const data = await response.json();
      console.log('[DealerCache] REST API response:', JSON.stringify(data));
  
      if (data.result) {
        const dealer = JSON.parse(data.result);
        console.log('[DealerCache] Found dealer:', dealer.subdomain);
        return dealer;
      }
  
      console.log('[DealerCache] No dealer found for phoneId:', phoneNumberId);
      return null;
    } catch (error: any) {
      console.error('[DealerCache] Error:', error.message);
      return null;
    }
  }  

  static async syncAllDealers(dealers: any[]) {
    console.log('[DealerCache] Syncing', dealers.length, 'dealers to Redis');
    const pipeline = redis.pipeline();
    let count = 0;
    
    for (const dealer of dealers) {
      if (dealer.whatsappPhoneNumberId) {
        const key = `${this.CACHE_KEY}${dealer.whatsappPhoneNumberId}`;
        const data = JSON.stringify({
          id: dealer.id,
          subdomain: dealer.subdomain,
          businessName: dealer.businessName,
          email: dealer.email,
        });
        
        console.log('[DealerCache] Will cache:', key, '=', data);
        
        pipeline.setex(
          key,
          this.CACHE_TTL,
          data
        );
        count++;
      }
    }
    
    await pipeline.exec();
    console.log('[DealerCache] Cached', count, 'dealers to Redis');
    return count;
  }

  static async clearDealerCache(phoneNumberId: string) {
    await redis.del(`${this.CACHE_KEY}${phoneNumberId}`);
    console.log('[DealerCache] Cleared cache for phoneId:', phoneNumberId);
  }

  static async clearAllCaches() {
    const keys = await redis.keys(`${this.CACHE_KEY}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log('[DealerCache] Cleared', keys.length, 'dealer caches');
    }
    return keys.length;
  }
}
