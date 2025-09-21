import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { prisma } from '@/lib/prisma';

fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(request: NextRequest) {
  console.log('🍌 FAL.AI with Cloudinary integration');
  
  try {
    // ✅ TEMP: Bypass auth for testing (remove in production)
    // const authResult = await verifyAdminAuth(request);
    // if (!authResult.success) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // ✅ Better request validation
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      console.error('❌ Invalid JSON in request:', parseError);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid JSON in request body' 
      }, { status: 400 });
    }

    const { carData, prompt, platform, style = 'photorealistic' } = requestBody;

    // ✅ Validate required fields
    if (!carData?.id || !platform) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: carData.id and platform'
      }, { status: 400 });
    }

    console.log('🔍 Looking for car:', carData.id);
    
    // ✅ Database query with error handling
    let carRecord;
    try {
      carRecord = await prisma.car.findUnique({
        where: { id: carData.id },
        select: { 
          images: true,
          brand: true,
          model: true,
          year: true
        }
      });
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed'
      }, { status: 500 });
    }

    if (!carRecord) {
      console.log('❌ Car not found:', carData.id);
      return NextResponse.json({
        success: false,
        error: `Car with id ${carData.id} not found`
      }, { status: 404 });
    }
    
    // ✅ PERFECT: Handle your Cloudinary URL array format
    let carImageUrl = null;
    console.log('🔍 Car images field:', typeof carRecord.images, Array.isArray(carRecord.images));
    
    if (carRecord?.images && Array.isArray(carRecord.images) && carRecord.images.length > 0) {
      carImageUrl = carRecord.images[0]; // First Cloudinary URL
      console.log('🖼️ Using Cloudinary URL:', carImageUrl);
    }

    // ✅ Validate FAL_KEY
    if (!process.env.FAL_KEY) {
      console.error('❌ FAL_KEY not configured');
      return NextResponse.json({
        success: false,
        error: 'FAL_KEY not configured in environment'
      }, { status: 500 });
    }

    try {
      if (carImageUrl && carImageUrl.startsWith('https://res.cloudinary.com/')) {
        console.log('🖼️ Using real Cloudinary car image for branding');
        
        const brandingPrompt = `Transform this car photograph into a professional CarStreets dealership marketing image:
        
ADD CARSTREETS BRANDING:
- "CarStreets" dealership logo prominently displayed
- "₹${carData.price || 'Price on Request'}" price overlay in attractive design
- "Ankit Pandey's CarStreets, Raipur" branding text
- Professional showroom background blend
- "Quality Pre-Owned Cars Since Years" tagline
- Operating hours "10:30 AM - 8:30 PM" display

Maintain the car's authentic appearance while adding professional dealership branding for ${platform} social media marketing.`;
        
        const result = await fal.subscribe('fal-ai/nano-banana/edit', {
          input: {
            prompt: brandingPrompt,
            image_url: carImageUrl,
            num_images: 1,
            output_format: 'jpeg',
            aspect_ratio: platform === 'linkedin' ? ['16:9'] : ['1:1'],
          }
        });
        
        return NextResponse.json({
          success: true,
          model: 'fal-ai-nano-banana-edit',
          imageUrl: result.data?.images?.[0]?.url,
          originalImage: carImageUrl,
          cost: 0.039,
          platform,
          mode: 'cloudinary-branded-real-car'
        });
        
      } else {
        console.log('🏢 No Cloudinary image found, generating showroom scene');
        
        const showroomPrompt = `Professional CarStreets dealership showroom scene:
${carData.year || carRecord.year || ''} ${carData.make || carRecord.brand || ''} ${carData.model || carRecord.model || ''} displayed in modern Indian car showroom.
"CarStreets" signage, "₹${carData.price || 'Price on Request'}" price display, "Ankit Pandey's CarStreets, Raipur" branding, professional automotive lighting.`;
        
        const result = await fal.subscribe('fal-ai/nano-banana', {
          input: {
            prompt: showroomPrompt,
            num_images: 1,
            output_format: 'jpeg',
            aspect_ratio: platform === 'linkedin' ? ['16:9'] : ['1:1'],
          }
        });
        
        return NextResponse.json({
          success: true,
          model: 'fal-ai-nano-banana-create',
          imageUrl: result.data?.images?.[0]?.url,
          cost: 0.039,
          platform,
          mode: 'generated-showroom'
        });
      }
    } catch (falError) {
      console.error('❌ FAL.AI API error:', falError);
      return NextResponse.json({
        success: false,
        error: `fal.ai API failed: ${falError.message}`
      }, { status: 500 });
    }

  } catch (error) {
    console.error('💥 Thumbnails API failed:', error);
    return NextResponse.json({
      success: false,
      error: `Thumbnails API failed: ${error instanceof Error ? error.message : String(error)}`
    }, { status: 500 });
  }
}
