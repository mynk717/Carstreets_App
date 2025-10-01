import { NextResponse } from 'next/server';
import { cacheManager } from '@/lib/cache/redis';

export async function GET() {
  try {
    const isConnected = await cacheManager.testConnection();
    
    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: 'Redis connected successfully!',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Redis connection failed'
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Redis test failed',
      error: error.message
    }, { status: 500 });
  }
}
