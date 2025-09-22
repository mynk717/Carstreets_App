// app/lib/agents/autoContentPipeline.ts - ENHANCED WITH CENTRAL PROMPT SYSTEM
import { prisma } from '@/lib/prisma';
import { CAR_STREETS_PROFILE } from '../../data/carStreetsProfile';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getCarEnhancementPrompt, getPromptMetrics } from '../prompts/carImagePrompts';

// ✅ KEEP: Use consistent auth token
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

    // ✅ ENHANCED: Process in smaller batches with central prompt system
    const batchSize = 1; // Process 1 car at a time (3 API calls per batch) for quality focus
    
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

        // ✅ ENHANCED: Use central prompt system for each platform
        const platformPromises = platforms.map(async (platform) => {
          console.log(`🎯 Generating platform-optimized content for ${car.year} ${car.brand} ${car.model} on ${platform}`);
          
          const textContent = await this.generateUniqueText(car, platform);

          // ✅ NEW: Use Central Prompt System instead of hardcoded prompts
          let enhancedPrompt: string;
          
          try {
            const promptParams = {
              car: {
                id: car.id,
                brand: car.brand,
                model: car.model,
                year: car.year,
                price: Number(car.price)
              },
              platform: platform as 'instagram' | 'facebook' | 'linkedin',
              imageUrl: car.images?.[0] || null,
              contentType: 'standard' as const, // Can be made dynamic for festivals
            };

            // ✅ ENHANCED: Generate professional automotive prompt
            enhancedPrompt = getCarEnhancementPrompt(promptParams);
            
            // ✅ QUALITY CONTROL: Validate prompt before API call
            const promptMetrics = getPromptMetrics(enhancedPrompt);
            console.log(`📊 ${platform} Prompt Quality:`, promptMetrics);
            
            if (promptMetrics.length < 50) {
              console.warn(`⚠️ ${platform} prompt too short, using fallback`);
              enhancedPrompt = `Professional CarStreets automotive photography: ${car.year} ${car.brand} ${car.model} enhanced for ${platform} marketing with price ₹${car.price}, Raipur dealership branding`;
            }

            console.log(`🤖 Generated ${platform} prompt:`, enhancedPrompt.substring(0, 100) + '...');

          } catch (promptError) {
            console.error(`❌ Prompt generation failed for ${platform}:`, promptError);
            // Fallback to enhanced basic prompt
            enhancedPrompt = car.images?.[0]
              ? `Professional ${platform} automotive photography enhancement: Transform this ${car.year} ${car.brand} ${car.model} photograph with CarStreets dealership branding, price ₹${car.price} display, and Raipur location context for maximum marketing impact`
              : `Professional CarStreets showroom scene: ${car.year} ${car.brand} ${car.model} displayed with modern dealership environment, price ₹${car.price} prominently featured, optimized for ${platform} engagement`;
          }

          // ✅ KEEP: Existing API call logic with enhanced prompt
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
                style: 'professional_automotive',
                prompt: enhancedPrompt, // ✅ NEW: Use AI-generated enhanced prompt
                contentType: 'standard', // Future: Can be 'festival' for seasonal content
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
                originalImage: car.images?.[0] || null,
                success: false,
                error: `Image generation failed: ${imageResponse.status}`,
                cost: 0,
                promptUsed: enhancedPrompt.substring(0, 100) + '...'
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
                originalImage: car.images?.[0] || null,
                success: false,
                error: `Expected JSON, received ${contentType}`,
                cost: 0,
                promptUsed: enhancedPrompt.substring(0, 100) + '...'
              };
            }

            const imageResult = await imageResponse.json();

            // ✅ ENHANCED: Log generation results with quality metrics
            console.log(`✅ ${platform} generation completed:`, {
              success: imageResult.success,
              mode: imageResult.mode,
              visionAnalysis: imageResult.visionAnalysis?.detectedAngle || 'no-analysis'
            });

            return {
              carId: car.id,
              platform,
              textContent: textContent.text,
              hashtags: textContent.hashtags,
              imageUrl: imageResult.success ? imageResult.imageUrl : null,
              originalImage: car.images?.[0] || null,
              success: imageResult.success || false,
              cost: imageResult.cost || 0,
              promptUsed: enhancedPrompt.substring(0, 100) + '...',
              mode: imageResult.mode || 'unknown',
              visionAnalysis: imageResult.visionAnalysis || null,
              certification: imageResult.certification || null
            };

          } catch (fetchError) {
            console.error(`❌ ${platform} network error:`, fetchError);
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
              promptUsed: enhancedPrompt?.substring(0, 100) + '...' || 'generation-failed'
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
        console.log('⏳ Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // ✅ ENHANCED: Log generation summary
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    const uniquePrompts = new Set(results.map(r => r.promptUsed)).size;
    
    console.log(`🎉 Content generation completed:`, {
      successful: successCount,
      total: totalCount,
      uniquePrompts,
      successRate: `${Math.round((successCount/totalCount) * 100)}%`
    });

    return results;
  }
}
