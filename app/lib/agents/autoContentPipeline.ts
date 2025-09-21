// app/lib/agents/autoContentPipeline.ts - FIXED VERSION
import { prisma } from '@/lib/prisma';
import { CAR_STREETS_PROFILE } from '../../data/carStreetsProfile';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

// ✅ FIXED: Use consistent auth token
const AUTH_TOKEN = 'Bearer admin-temp-key';

export class AutoContentPipeline {
  async generateUniqueText(car: any, platform: string) {
    if (!car?.brand || !car?.model || !car?.year) {
      console.error('Invalid car data:', car);
      throw new Error('Missing required car fields: brand, model, or year');
    }

    const profile = CAR_STREETS_PROFILE;

    const contextPrompt = `Generate ${platform} content for ${car.year} ${car.brand} ${car.model} at CarStreets:
    
    CARSTREETS CONTEXT:
    - Owner: ${profile.operations.key_personnel[0]}
    - Location: Raipur, Chhattisgarh  
    - Price: ₹${car.price || 'Price on Request'}
    - Operating: ${profile.operations.operating_hours}
    - Specialization: ${profile.business.specialization.join(', ')}
    
    Create unique, engaging ${platform} post with CarStreets branding, Raipur location context, and September 2025 relevance.
    Include specific details that competitors cannot replicate.`;

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: contextPrompt,
      temperature: 0.8,
    });

    return {
      text: result.text,
      hashtags: [
        '#CarStreets',
        '#RaipurCars',
        '#AnkitPandeyAutos',
        `#${car.brand.replace(/\s+/g, '')}`,
      ],
      platform,
    };
  }

  async generateReadyToPostContent(carIds: string[]) {
    const results = [];

    for (const carId of carIds) {
      const car = await prisma.car.findUnique({
        where: { id: carId },
        select: {
          id: true,
          brand: true,
          model: true,
          year: true,
          price: true,
          images: true,
        },
      });

      if (!car) {
        console.warn(`Car with ID ${carId} not found, skipping.`);
        continue;
      }

      const platforms = ['instagram', 'facebook', 'linkedin'];

      for (const platform of platforms) {
        const textContent = await this.generateUniqueText(car, platform);

        // ✅ FIXED: Determine base URL more reliably
        const baseUrl = process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : process.env.NEXTAUTH_URL || 'http://localhost:3000';

        console.log(`Fetching thumbnails from: ${baseUrl}/api/admin/thumbnails`);

        const prompt = car.images?.[0]
          ? `Transform this car photograph into a professional CarStreets dealership marketing image:
- "CarStreets" dealership logo prominently displayed
- "₹${car.price || 'Price on Request'}" price overlay in attractive design
- "Ankit Pandey's CarStreets, Raipur" branding text
- Professional showroom background blend
- "Quality Pre-Owned Cars Since Years" tagline
- Operating hours "10:30 AM - 8:30 PM" display
Maintain the car's authentic appearance while adding professional dealership branding for ${platform} social media marketing.`
          : `Professional CarStreets dealership showroom scene: ${car.year} ${car.brand} ${car.model} displayed in modern Indian car showroom. "CarStreets" signage, "₹${car.price || 'Price on Request'}" price display, "Ankit Pandey's CarStreets, Raipur" branding, professional automotive lighting.`;

        try {
          // ✅ FIXED: Add proper error handling and auth headers
          const imageResponse = await fetch(`${baseUrl}/api/admin/thumbnails`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': AUTH_TOKEN, // ✅ Ensure auth header is present
            },
            body: JSON.stringify({
              carData: {
                id: car.id,
                brand: car.brand,
                model: car.model,
                year: car.year,
                price: Number(car.price),
              },
              platform,
              style: 'photorealistic',
              prompt,
            }),
          });

          console.log('Thumbnail API Response Status:', imageResponse.status, imageResponse.statusText);

          // ✅ FIXED: Better error handling for non-JSON responses
          const contentType = imageResponse.headers.get('content-type');
          
          if (!imageResponse.ok) {
            const errorText = await imageResponse.text();
            console.error(`❌ Thumbnail API failed:`, {
              status: imageResponse.status,
              statusText: imageResponse.statusText,
              contentType,
              response: errorText.slice(0, 500),
              url: `${baseUrl}/api/admin/thumbnails`,
              authHeader: AUTH_TOKEN ? 'Present' : 'Missing'
            });
            
            // ✅ Skip this platform but continue with others
            console.warn(`⚠️ Skipping image generation for ${platform}, continuing with text-only content`);
            results.push({
              carId: car.id,
              platform,
              textContent: textContent.text,
              hashtags: textContent.hashtags,
              imageUrl: null,
              originalImage: car.images?.[0] || null,
              success: false,
              error: `Image generation failed: ${imageResponse.status} - ${errorText.slice(0, 100)}`,
              cost: 0,
            });
            continue;
          }

          if (!contentType?.includes('application/json')) {
            const text = await imageResponse.text();
            console.error('❌ Non-JSON response:', {
              status: imageResponse.status,
              contentType,
              response: text.slice(0, 200)
            });
            
            // ✅ Skip this platform but continue
            results.push({
              carId: car.id,
              platform,
              textContent: textContent.text,
              hashtags: textContent.hashtags,
              imageUrl: null,
              originalImage: car.images?.[0] || null,
              success: false,
              error: `Expected JSON, received ${contentType}`,
              cost: 0,
            });
            continue;
          }

          const imageResult = await imageResponse.json();

          if (!imageResult.success) {
            console.error('❌ Thumbnail API returned failure:', imageResult);
            results.push({
              carId: car.id,
              platform,
              textContent: textContent.text,
              hashtags: textContent.hashtags,
              imageUrl: null,
              originalImage: car.images?.[0] || null,
              success: false,
              error: `Thumbnail generation failed: ${imageResult.error || 'Unknown error'}`,
              cost: 0,
            });
            continue;
          }

          // ✅ Success case
          results.push({
            carId: car.id,
            platform,
            textContent: textContent.text,
            hashtags: textContent.hashtags,
            imageUrl: imageResult.imageUrl,
            originalImage: car.images?.[0] || null,
            success: imageResult.success,
            cost: imageResult.cost || 0,
          });

        } catch (fetchError) {
          console.error(`❌ Network error calling thumbnails API:`, fetchError);
          results.push({
            carId: car.id,
            platform,
            textContent: textContent.text,
            hashtags: textContent.hashtags,
            imageUrl: null,
            originalImage: car.images?.[0] || null,
            success: false,
            error: `Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
            cost: 0,
          });
        }
      }
    }

    return results;
  }
}