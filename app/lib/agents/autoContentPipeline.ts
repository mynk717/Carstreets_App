// app/lib/agents/autoContentPipeline.ts - MINIMAL TIMEOUT FIX
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

    // ✅ MINIMAL FIX: Process in batches to avoid timeout
    const batchSize = 2; // Process 2 cars at a time (6 API calls per batch)
    
    for (let i = 0; i < carIds.length; i += batchSize) {
      const carBatch = carIds.slice(i, i + batchSize);
      console.log(`🚀 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(carIds.length/batchSize)}: ${carBatch.length} cars`);

      // ✅ Process cars in current batch in parallel
      const batchPromises = carBatch.map(async (carId) => {
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
          return [];
        }

        const carResults = [];
        const platforms = ['instagram', 'facebook', 'linkedin'];

        // ✅ Keep your existing logic but process platforms for this car in parallel
        const platformPromises = platforms.map(async (platform) => {
          const textContent = await this.generateUniqueText(car, platform);

          // ✅ FIXED: Use simplified prompt to avoid FAL.AI errors
          const prompt = car.images?.[0]
            ? `Add CarStreets dealership branding to this car photo. Include "CarStreets" logo, price "₹${car.price || 'Price on Request'}", and "Raipur" location text overlay for ${platform} social media.`
            : `CarStreets car dealership showroom in Raipur. ${car.year} ${car.brand} ${car.model} displayed professionally with "CarStreets" signage and "₹${car.price || 'Price on Request'}" price display.`;

          // ✅ Keep your existing API call logic exactly the same
          const baseUrl = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : process.env.NEXTAUTH_URL || 'http://localhost:3000';

          try {
            const headers: Record<string, string> = {
              'Content-Type': 'application/json',
              'Authorization': AUTH_TOKEN,
            };
            
            if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
              headers['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
            }
            
            const imageResponse = await fetch(`${baseUrl}/api/admin/thumbnails`, {
              method: 'POST',
              headers,
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

            const contentType = imageResponse.headers.get('content-type');
            
            if (!imageResponse.ok) {
              const errorText = await imageResponse.text();
              return {
                carId: car.id,
                platform,
                textContent: textContent.text,
                hashtags: textContent.hashtags,
                imageUrl: null,
                originalImage: car.images?.[0] || null,
                success: false,
                error: `Image generation failed: ${imageResponse.status}`,
                cost: 0,
              };
            }

            if (!contentType?.includes('application/json')) {
              return {
                carId: car.id,
                platform,
                textContent: textContent.text,
                hashtags: textContent.hashtags,
                imageUrl: null,
                originalImage: car.images?.[0] || null,
                success: false,
                error: `Expected JSON, received ${contentType}`,
                cost: 0,
              };
            }

            const imageResult = await imageResponse.json();

            return {
              carId: car.id,
              platform,
              textContent: textContent.text,
              hashtags: textContent.hashtags,
              imageUrl: imageResult.success ? imageResult.imageUrl : null,
              originalImage: car.images?.[0] || null,
              success: imageResult.success || false,
              cost: imageResult.cost || 0,
            };

          } catch (fetchError) {
            return {
              carId: car.id,
              platform,
              textContent: textContent.text,
              hashtags: textContent.hashtags,
              imageUrl: null,
              originalImage: car.images?.[0] || null,
              success: false,
              error: `Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
              cost: 0,
            };
          }
        });

        // Wait for all platforms for this car
        const platformResults = await Promise.all(platformPromises);
        carResults.push(...platformResults);
        return carResults;
      });

      // Wait for current batch to complete
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.flat());

      // ✅ Small delay between batches to avoid rate limits
      if (i + batchSize < carIds.length) {
        console.log('⏳ Waiting 1 second before next batch...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}