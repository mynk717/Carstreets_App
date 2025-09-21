// app/api/admin/thumbnails/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { prisma } from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/auth/admin';

fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(request: NextRequest) {
  console.log('🍌 FAL.AI with Cloudinary integration - Starting request');

  try {
    // ✅ FIXED: Re-enable auth verification and provide better error handling
    console.log('🔐 Checking admin authentication...');
    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      console.log('❌ Authentication failed:', authResult.error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized access - admin authentication required',
          details: authResult.error 
        }, 
        { status: 401 }
      );
    }
    console.log('✅ Authentication successful');

    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      console.error('❌ Invalid JSON in request:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { carData, prompt, platform, style = 'photorealistic' } = requestBody;

    if (!carData?.id || !platform || !prompt) {
      console.error('❌ Missing required fields:', { carData: !!carData?.id, platform: !!platform, prompt: !!prompt });
      return NextResponse.json(
        { success: false, error: 'Missing required fields: carData.id, platform, prompt' },
        { status: 400 }
      );
    }

    console.log('🔍 Looking for car:', carData.id);

    let carRecord;
    try {
      carRecord = await prisma.car.findUnique({
        where: { id: carData.id },
        select: { images: true, brand: true, model: true, year: true },
      });
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }

    if (!carRecord) {
      console.log('❌ Car not found:', carData.id);
      return NextResponse.json(
        { success: false, error: `Car with id ${carData.id} not found` },
        { status: 404 }
      );
    }

    let carImageUrl = null;
    if (carRecord.images && Array.isArray(carRecord.images) && carRecord.images.length > 0) {
      carImageUrl = carRecord.images[0];
      console.log('🖼️ Using Cloudinary URL:', carImageUrl);
    }

    if (!process.env.FAL_KEY) {
      console.error('❌ FAL_KEY not configured');
      return NextResponse.json(
        { success: false, error: 'FAL_KEY not configured in environment' },
        { status: 500 }
      );
    }

    try {
      let result;
      if (carImageUrl && carImageUrl.startsWith('https://res.cloudinary.com/')) {
        console.log('🖼️ Using real Cloudinary car image for branding');

        // ✅ FIXED: Simplified prompt for Nano Banana edit
        const brandingPrompt = `Add CarStreets dealership branding to this car photo. Include "CarStreets" logo, price "${carData.price || 'Price on Request'}", and "Raipur" location text overlay for ${platform} social media.`;

        console.log('🔧 Calling nano-banana/edit with params:', {
          prompt: brandingPrompt.slice(0, 100) + '...',
          image_url: carImageUrl.slice(0, 50) + '...',
          platform
        });

        // ✅ FIXED: Use only supported parameters for nano-banana/edit
        result = await fal.subscribe('fal-ai/nano-banana/edit', {
          input: {
            prompt: brandingPrompt,
            image_urls: [carImageUrl],
            num_images: 1
            // ✅ REMOVED: output_format and aspect_ratio - not supported in edit mode
          },
        });

        console.log('✅ Fal.ai edit completed successfully');
      } else {
        console.log('🏢 No Cloudinary image found, generating showroom scene');

        // ✅ FIXED: Simplified prompt for text-to-image generation
        const showroomPrompt = `CarStreets car dealership showroom in Raipur. ${carData.year || 2020} ${carData.brand || 'car'} ${carData.model || 'model'} displayed professionally with "CarStreets" signage and "₹${carData.price || 'Price on Request'}" price display.`;

        console.log('🔧 Calling nano-banana with params:', {
          prompt: showroomPrompt.slice(0, 100) + '...',
          platform
        });

        // ✅ FIXED: Use only supported parameters for nano-banana text-to-image
        result = await fal.subscribe('fal-ai/nano-banana', {
          input: {
            prompt: showroomPrompt,
            num_images: 1
            // ✅ REMOVED: output_format and aspect_ratio - not supported
          },
        });

        console.log('✅ Fal.ai generate completed successfully');
      }

      if (!result?.data?.images?.[0]?.url) {
        console.error('❌ No image URL in Fal.ai response:', result);
        return NextResponse.json(
          { success: false, error: 'No image URL returned by Fal.ai API' },
          { status: 500 }
        );
      }

      console.log('🎉 Thumbnail generation successful');
      return NextResponse.json({
        success: true,
        model: carImageUrl ? 'fal-ai/nano-banana/edit' : 'fal-ai/nano-banana',
        imageUrl: result.data.images[0].url,
        originalImage: carImageUrl,
        cost: 0.039, // Update with actual cost or remove
        platform,
        mode: carImageUrl ? 'cloudinary-branded-real-car' : 'generated-showroom',
      });
      
    } catch (falError) {
      console.error('❌ FAL.AI API error:', falError);
      
      // ✅ ADDED: Log the full error details for debugging
      if (falError.status === 422) {
        console.error('❌ FAL.AI 422 Error Details:', {
          status: falError.status,
          body: falError.body,
          message: falError.message
        });
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: `fal.ai API failed: ${falError instanceof Error ? falError.message : String(falError)}`,
          details: falError.body || null
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('💥 Thumbnails API failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Thumbnails API failed: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 }
    );
  }
}