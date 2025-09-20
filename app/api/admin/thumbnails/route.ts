import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

// Configure fal.ai with your API key
fal.config({
  credentials: process.env.FAL_KEY, // Add this to your Vercel environment variables
});

function getPlatformDimensions(platform: string) {
  switch (platform) {
    case 'linkedin':
      return { aspect_ratio: '16:9', width: 1920, height: 1080 };
    case 'instagram':
    case 'facebook':
      return { aspect_ratio: '1:1', width: 1024, height: 1024 };
    default:
      return { aspect_ratio: '1:1', width: 1024, height: 1024 };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { carData, prompt, platform, style = 'photorealistic' } = await request.json();
    
    if (!carData || !prompt || !platform) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    console.log(`🍌 Generating nano-banana image via fal.ai for ${platform}`);

    // ✅ Create CarStreets-branded, unique prompt
    const carStreetsPrompt = `Professional automotive dealership photography for CarStreets, Raipur: 
    
    ${carData.year} ${carData.make} ${carData.model} (₹${carData.price}) displayed in CarStreets showroom. 
    
    UNIQUE BRANDING ELEMENTS:
    - "CarStreets" dealership signage prominently visible
    - "Ankit Pandey's CarStreets" owner branding displayed
    - "Ring Road No. 1, Raipur" location signage
    - "Quality Pre-Owned Cars Since Years" tagline visible
    - Professional Indian automotive showroom interior
    - "₹${carData.price}" price display on windshield
    - Raipur, Chhattisgarh location context in background
    - Operating hours "10:30 AM - 8:30 PM" displayed
    - September 2025 festival season decorations
    
    Style: ${style}, professional dealership photography, ${platform === 'linkedin' ? 'corporate presentation' : 'social media optimized'}`;

    const { aspect_ratio, width, height } = getPlatformDimensions(platform);

    // ✅ Call fal.ai nano-banana with your branded prompt
    const result = await fal.subscribe('fal-ai/nano-banana', {
      input: {
        prompt: carStreetsPrompt,
        num_images: 1,
        output_format: 'jpeg',
        aspect_ratio: [aspect_ratio], // fal.ai expects array format
        width,
        height,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          update.logs?.map((log) => log.message).forEach(console.log);
        }
      },
    });

    console.log('✅ Nano-banana SUCCESS via fal.ai for', platform);

    // Extract image URL from fal.ai response
    const imageUrl = result.data?.images?.[0]?.url;
    
    if (!imageUrl) {
      throw new Error('No image URL returned from fal.ai');
    }

    return NextResponse.json({
      success: true,
      model: 'nano-banana-via-fal-ai',
      imageUrl: imageUrl,
      cost: 0.039, // fal.ai pricing
      platform,
      requestId: result.requestId,
      carStreetsBranding: [
        'CarStreets dealership signage',
        'Ankit Pandey owner branding', 
        'Raipur location context',
        'Price display integration',
        'Professional showroom setting'
      ],
      note: 'Generated with Gemini 2.5 Flash Image (nano-banana) via fal.ai'
    });

  } catch (error) {
    console.error('💥 fal.ai nano-banana generation failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Nano-banana via fal.ai failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
