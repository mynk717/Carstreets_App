import { Redis } from '@upstash/redis';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

async function testRedis() {
  console.log('🔍 Testing Upstash Redis connection...\n');
  
  try {
    // Test 1: Simple set/get
    console.log('1️⃣ Testing SET/GET...');
    await redis.set('test:key', 'Hello from CarStreets!');
    const value = await redis.get('test:key');
    console.log(`✅ Value retrieved: ${value}`);
    
    // Test 2: Test sorted set (used for messages)
    console.log('\n2️⃣ Testing ZADD/ZRANGE (message storage)...');
    await redis.zadd('test:messages', { score: Date.now(), member: 'msg_1' });
    await redis.zadd('test:messages', { score: Date.now() + 1000, member: 'msg_2' });
    const messages = await redis.zrange('test:messages', 0, -1);
    console.log(`✅ Messages in sorted set: ${JSON.stringify(messages)}`);
    
    // Test 3: Check existing WhatsApp data
    console.log('\n3️⃣ Checking for existing WhatsApp messages...');
    const keys = await redis.keys('whatsapp:*');
    console.log(`✅ Found ${keys.length} WhatsApp-related keys`);
    if (keys.length > 0) {
      console.log('Keys:', keys.slice(0, 5)); // Show first 5
    }
    
    // Cleanup
    await redis.del('test:key');
    await redis.del('test:messages');
    
    console.log('\n✅ Redis connection successful!');
  } catch (error: any) {
    console.error('❌ Redis error:', error.message);
  }
}

testRedis();
