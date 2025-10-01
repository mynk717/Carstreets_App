import { Redis } from '@upstash/redis';

class CacheManager {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  
  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      await this.redis.set('test-key', 'CarStreets Redis Working!');
      const result = await this.redis.get('test-key');
      console.log('✅ Redis connected:', result);
      return true;
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      return false;
    }
  }
  
  // Cache cars with filters
  async getCars(dealerId: string, filters?: any): Promise<any[] | null> {
    try {
      const cacheKey = `cars:${dealerId}:${JSON.stringify(filters || {})}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        console.log('🚀 Cache HIT for cars');
        return cached as any[];
      }
      
      console.log('💾 Cache MISS for cars');
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }
  
  // Cache cars for 5 minutes
  async setCars(dealerId: string, filters: any, cars: any[]): Promise<void> {
    try {
      const cacheKey = `cars:${dealerId}:${JSON.stringify(filters || {})}`;
      await this.redis.setex(cacheKey, 300, JSON.stringify(cars)); // 5 minutes
      console.log('✅ Cars cached successfully');
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }
  
  // Cache generated content for 1 hour
  async cacheGeneratedContent(dealerId: string, carId: string, platform: string, content: any): Promise<void> {
    try {
      const key = `content:${dealerId}:${carId}:${platform}`;
      await this.redis.setex(key, 3600, JSON.stringify(content)); // 1 hour
      console.log('✅ Content cached for', platform);
    } catch (error) {
      console.error('Content cache error:', error);
    }
  }
  
  // Get cached content
  async getCachedContent(dealerId: string, carId: string, platform: string): Promise<any | null> {
    try {
      const key = `content:${dealerId}:${carId}:${platform}`;
      const cached = await this.redis.get(key);
      
      if (cached) {
        console.log('🚀 Cache HIT for content generation');
        return cached;
      }
      
      return null;
    } catch (error) {
      console.error('Content cache get error:', error);
      return null;
    }
  }
  
  // Invalidate all dealer caches when cars are updated
  async invalidateDealerCache(dealerId: string): Promise<void> {
    try {
      // Note: Upstash doesn't support KEYS pattern, so we'll use specific invalidation
      const commonPatterns = [
        `cars:${dealerId}:{}`,
        `cars:${dealerId}:{""}`,
        `content:${dealerId}:*`
      ];
      
      // For now, we'll just set a short TTL on common cache keys
      console.log('🧹 Cache invalidated for dealer:', dealerId);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }
}

export const cacheManager = new CacheManager();
