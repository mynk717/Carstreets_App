import { NextRequest, NextResponse } from 'next/server';
import { QualityControlledPipeline } from '../../../lib/agents/pipeline';

export async function POST(request: NextRequest) {
  try {
    const { userId, carIds } = await request.json();
    
    if (!userId || !carIds || !Array.isArray(carIds)) {
      return NextResponse.json(
        { success: false, error: 'userId and carIds array required' },
        { status: 400 }
      );
    }
    
    const pipeline = new QualityControlledPipeline();
    const result = await pipeline.generateWeeklyContent(userId, carIds);
    
    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Pipeline test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
