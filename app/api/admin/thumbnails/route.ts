import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { prisma } from '@/lib/prisma';

fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(request: NextRequest) {
  console.log('🍌 FAL.AI with Cloudinary integration');

  try {
    // Re-enable in production if needed
    // const authResult = await verifyAdminAuth(request);
    // if (!authResult.success) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

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

        const brandingPrompt = `Transform this car photograph into a professional CarStreets dealership marketing image:
- "CarStreets" dealership logo prominently displayed
- "₹${carData.price || 'Price on Request'}" price overlay in attractive design
- "Ankit Pandey's CarStreets, Raipur" branding text
- Professional showroom background blend
- "Quality Pre-Owned Cars Since Years" tagline
- Operating hours "10:30 AM - 8:30 PM" display
Maintain the car's authentic appearance while adding professional dealership branding for ${platform} social media marketing.`;

        result = await fal.subscribe('fal-ai/nano-banana/edit', {
          input: {
            prompt: brandingPrompt,
            image_url: carImageUrl,
            num_images: 1,
            output_format: 'jpeg',
            aspect_ratio: platform === 'linkedin' ? '16:9' : '1:1',
          },
        });

        console.log('Fal.ai edit Response:', JSON.stringify(result, null, 2));
      } else {
        console.log('🏢 No Cloudinary image found, generating showroom scene');

        const showroomPrompt = prompt;

        result = await fal.subscribe('fal-ai/nano-banana', {
          input: {
            prompt: showroomPrompt,
            num_images: 1,
            output_format: 'jpeg',
            aspect_ratio: platform === 'linkedin' ? '16:9' : '1:1',
          },
        });

        console.log('Fal.ai generate Response:', JSON.stringify(result, null, 2));
      }

      if (!result?.data?.images?.[0]?.url) {
        console.error('No image URL in Fal.ai response:', result);
        throw new Error('No image URL returned by Fal.ai API');
      }

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
      return NextResponse.json(
        { success: false, error: `fal.ai API failed: ${falError instanceof Error ? falError.message : String(falError)}` },
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