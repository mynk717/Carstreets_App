import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { prisma } from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/auth/admin';
import {
  getCarEnhancementPrompt,
  getPromptMetrics,
  addAutomotiveCertification
} from '@/lib/prompts/carImagePrompts';

fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(request: NextRequest) {
  console.log('🤖 Multi-Agent Image Generation Starting');

  try {
    // Verify admin auth, including the Bearer token and Vercel bypass header internally
    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let requestBody;
    try {
      requestBody = await request.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const {
      carData,
      prompt: userPrompt,
      platform,
      style = 'professional_automotive',
      contentType = 'standard',
      festival,
    } = requestBody;

    if (!carData?.id || !platform) {
      return NextResponse.json(
        { success: false, error: 'Missing carData.id or platform' },
        { status: 400 }
      );
    }

    // Fetch car images and data from database
    const carRecord = await prisma.car.findUnique({
      where: { id: carData.id },
      select: { images: true, brand: true, model: true, year: true, price: true },
    });

    if (!carRecord) {
      return NextResponse.json(
        { success: false, error: `Car ${carData.id} not found` },
        { status: 404 }
      );
    }

    // Use up to 10 images for nano banana input
    const imageUrls = carRecord.images && Array.isArray(carRecord.images)
      ? carRecord.images.slice(0, 10)
      : [];

    // Compose AI-generated prompt or use user prompt
    let enhancedPrompt: string;
    if (userPrompt) {
      enhancedPrompt = userPrompt;
    } else {
      const promptParams = {
        car: {
          id: carData.id,
          brand: carRecord.brand || carData.brand,
          model: carRecord.model || carData.model,
          year: carRecord.year || carData.year,
          price: Number(carRecord.price || carData.price),
        },
        platform,
        imageUrl: null,
        contentType,
        festival,
      };
      enhancedPrompt = getCarEnhancementPrompt(promptParams);
    }

    // Validate prompt quality
    const promptMetrics = getPromptMetrics(enhancedPrompt);
    if (promptMetrics.length < 50) {
      console.warn('Prompt too short, falling back to generic prompt');
      enhancedPrompt = `Professional promotional image of ${carRecord.year} ${carRecord.brand} ${carRecord.model} with price ₹${carRecord.price}.`;
    }

    console.log('🎯 Using prompt:', enhancedPrompt);

    if (!process.env.FAL_KEY) {
      return NextResponse.json(
        { success: false, error: 'FAL_KEY not configured' },
        { status: 500 }
      );
    }

    try {
      const aspectRatio = platform === 'linkedin' ? '16:9' : '1:1';

      // Call nano-banana/edit model with multiple image URLs
      const result = await fal.subscribe('fal-ai/nano-banana/edit', {
        input: {
          prompt: enhancedPrompt,
          image_urls: imageUrls,
          num_images: 1,
          output_format: 'jpeg',
          sync_mode: false,
          aspect_ratio: aspectRatio,
        },
      });

      if (!result.data?.images?.length) {
        throw new Error('No images returned from fal.ai');
      }

      const imageUrl = result.data.images[0].url;

      return NextResponse.json({
        success: true,
        model: 'fal-ai/nano-banana/edit',
        imageUrl,
        originalImages: imageUrls,
        cost: 0.039,
        platform,
        promptUsed: enhancedPrompt.substring(0, 200) + '...',
        certification: addAutomotiveCertification(platform),
      });

    } catch (falError) {
      console.error('fal.ai nano-banana/edit error:', falError);
      return NextResponse.json(
        { success: false, error: falError.message || 'fal.ai error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Multi-Agent Image Generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
