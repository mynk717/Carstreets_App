import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { prisma } from '@/lib/prisma'; // Adjust import path

fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(request: NextRequest) {
  console.log('🍌 FAL.AI with Cloudinary integration');
  
  try {
    const { carData, prompt, platform, style = 'photorealistic' } = await request.json();
    
    // ✅ FIXED: Use your actual database schema
    const carRecord = await prisma.car.findUnique({
      where: { id: carData.id },
      select: { 
        images: true  // This is your existing Json field
        // Remove cloudinaryUrls since it doesn't exist
      }
    });
    
    // ✅ FIXED: Extract image URL from your Json field
    let carImageUrl = null;
    if (carRecord?.images) {
      // Assuming your images field is a JSON array of URLs
      if (Array.isArray(carRecord.images)) {
        carImageUrl = carRecord.images[0];
      } else if (typeof carRecord.images === 'object' && carRecord.images.url) {
        carImageUrl = carRecord.images.url;
      } else if (typeof carRecord.images === 'string') {
        carImageUrl = carRecord.images;
      }
    }
    
    if (carImageUrl) {
      console.log('🖼️ Using real car image from database');
      
      const brandingPrompt = `Transform this car photograph into a professional CarStreets dealership marketing image:
      
      ADD THESE BRANDING ELEMENTS:
      - "CarStreets" dealership logo prominently displayed
      - "₹${carData.price}" price overlay in attractive design
      - "Ankit Pandey's CarStreets, Raipur" branding text
      - Professional showroom background blend
      - "Quality Pre-Owned Cars Since Years" tagline
      
      Maintain the car's authentic appearance while adding professional dealership branding for ${platform} social media.`;
      
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
        mode: 'auto-branded-real-car'
      });
      
    } else {
      console.log('🏢 No car image found, generating showroom scene');
      
      const showroomPrompt = `Professional CarStreets dealership showroom scene:
      ${carData.year} ${carData.make} ${carData.model} displayed in modern Indian car showroom.
      "CarStreets" signage, "₹${carData.price}" price display, Raipur location context.`;
      
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

  } catch (error) {
    console.error('💥 Auto-image generation failed:', error);
    return NextResponse.json({
      success: false,
      error: `Auto-image generation failed: ${error.message}`
    }, { status: 500 });
  }
}
