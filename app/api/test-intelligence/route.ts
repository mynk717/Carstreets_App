import { NextRequest, NextResponse } from 'next/server';
import { AutomatedIntelligenceSystem } from '@/lib/intelligence/web-scraper';
import { prisma } from '@/lib/prisma'; // ✅ Using your existing setup

export async function GET(request: NextRequest) {
  try {
    const intelligenceSystem = new AutomatedIntelligenceSystem();
    
    // Run a small test collection
    await intelligenceSystem.collectMarketIntelligence();
    
    // Get some sample data
    const sampleData = await prisma.marketIntelligence.findMany({
      take: 3,
      orderBy: { scrapedAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      message: 'Intelligence system test completed',
      sampleData: sampleData,
      dataCount: sampleData.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
