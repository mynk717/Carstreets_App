import { prisma } from '@/lib/prisma';
import { CAR_STREETS_PROFILE } from '../../data/carStreetsProfile';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import {
  getCarEnhancementPrompt,
  getPromptMetrics,
} from '../prompts/carImagePrompts';

// Consistent auth token for API calls
const AUTH_TOKEN = 'Bearer admin-temp-key';

export class AutoContentPipeline {
  async generateUniqueText(car: any, platform: string) {
    if (!car?.brand || !car?.model || !car?.year) {
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
    const batchSize = 1; // smaller batch for quality and rate control

    for (let i = 0; i < carIds.length; i += batchSize) {
      const carBatch = carIds.slice(i, i + batchSize);
      console.log(
        `🚀 Processing batch ${Math.floor(i / batchSize) + 1}/${
          Math.ceil(carIds.length / batchSize)
        }: ${carBatch.length} cars`
      );

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

        const platformPromises = platforms.map(async (platform) => {
          console.log(`🎯 Generating content for ${car.year} ${car.brand} ${car.model} on ${platform}`);

          const textContent = await this.generateUniqueText(car, platform);

          // Get prompt for multi-images (pass all images)
          let enhancedPrompt: string;
          try {
            const promptParams = {
              car: {
                id: car.id,
                brand: car.brand,
                model: car.model,
                year: car.year,
                price: Number(car.price),
              },
              platform: platform as 'instagram' | 'facebook' | 'linkedin',
              imageUrl: null, // not used, multiple images passed
              contentType: 'standard' as const,
            };

            enhancedPrompt = getCarEnhancementPrompt(promptParams);

            const promptMetrics = getPromptMetrics(enhancedPrompt);
            if (promptMetrics.length < 50) {
              console.warn(`${platform} prompt too short, using fallback`);
              enhancedPrompt = `Professional CarStreets automotive photography: ${car.year} ${car.brand} ${car.model} for ${platform}, price ₹${car.price}`;
            }
            console.log(`🤖 Prompt for ${platform}:`, enhancedPrompt.substring(0, 100) + '...');
          } catch (e) {
            console.error(`❌ Prompt generation failed for ${platform}:`, e);
            enhancedPrompt = `Professional ${platform} automotive photography for ${car.year} ${car.brand} ${car.model}, price ₹${car.price}`;
          }

          const baseUrl = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : process.env.NEXTAUTH_URL || 'http://localhost:3000';

          try {
            const headers: Record<string, string> = {
              'Content-Type': 'application/json',
              Authorization: AUTH_TOKEN,
            };
            if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
              headers['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
            }

            // Pass all images
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
                  images: car.images,
                },
                platform,
                style: 'professional_automotive',
                prompt: enhancedPrompt,
                contentType: 'standard',
              }),
            });

            const contentType = imageResponse.headers.get('content-type');
            if (!imageResponse.ok) {
              const errorText = await imageResponse.text();
              console.error(`❌ ${platform} image generation failed:`, imageResponse.status, errorText);
              return {
                carId: car.id,
                platform,
                textContent: textContent.text,
                hashtags: textContent.hashtags,
                imageUrl: null,
                originalImages: car.images,
                success: false,
                error: `Image generation failed: ${imageResponse.status}`,
                cost: 0,
                promptUsed: enhancedPrompt.substring(0, 100) + '...',
              };
            }

            if (!contentType?.includes('application/json')) {
              console.error(`❌ ${platform} unexpected content type:`, contentType);
              return {
                carId: car.id,
                platform,
                textContent: textContent.text,
                hashtags: textContent.hashtags,
                imageUrl: null,
                originalImages: car.images,
                success: false,
                error: `Expected JSON, received ${contentType}`,
                cost: 0,
                promptUsed: enhancedPrompt.substring(0, 100) + '...',
              };
            }

            const imageResult = await imageResponse.json();
            console.log(`✅ ${platform} generation completed:`, { success: imageResult.success, mode: imageResult.mode });

            return {
              carId: car.id,
              platform,
              textContent: textContent.text,
              hashtags: textContent.hashtags,
              imageUrl: imageResult.success ? imageResult.imageUrl : null,
              originalImages: car.images,
              success: imageResult.success || false,
              cost: imageResult.cost || 0,
              promptUsed: enhancedPrompt.substring(0, 100) + '...',
              mode: imageResult.mode || 'unknown',
            };
          } catch (fetchError) {
            console.error(`❌ ${platform} network error:`, fetchError);
            return {
              carId: car.id,
              platform,
              textContent: textContent.text,
              hashtags: textContent.hashtags,
              imageUrl: null,
              originalImages: car.images,
              success: false,
              error: `Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
              cost: 0,
              promptUsed: enhancedPrompt.substring(0, 100) + '...' || 'generation-failed',
            };
          }
        });

        const platformResults = await Promise.all(platformPromises);
        carResults.push(...platformResults);

        return carResults;
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.flat());

      if (i + batchSize < carIds.length) {
        console.log('⏳ Waiting 2 seconds before next batch...');
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const totalCount = results.length;
    console.log(`🎉 Content generation completed: ${successCount}/${totalCount} successful`);

    return results;
  }
}
