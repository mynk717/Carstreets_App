import { NextRequest, NextResponse } from 'next/server';
import { RAGContentEngine } from '@/lib/intelligence/rag-content-engine';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const ragEngine = new RAGContentEngine();
    
    // Get a sample car
    const car = await prisma.car.findFirst({
      where: { isVerified: true },
      take: 1
    });

    if (!car) {
      return NextResponse.json({
        success: false,
        error: 'No cars found for testing'
      });
    }

    // Generate RAG-powered content for multiple platforms
    const results = [];
    const platforms = ['facebook', 'instagram', 'linkedin'];

    for (const platform of platforms) {
      const content = await ragEngine.generateIntelligentContent(car, platform);
      results.push({
        platform,
        content: content.text,
        contextUsed: content.contextUsed,
        dataFreshness: content.dataFreshness,
        intelligenceEnhanced: content.intelligenceEnhanced,
        confidence: content.confidence
      });
    }

    return NextResponse.json({
      success: true,
      message: 'RAG content generation test completed',
      car: {
        id: car.id,
        title: car.title,
        brand: car.brand,
        model: car.model,
        price: car.price.toString()
      },
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}