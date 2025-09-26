// app/lib/agents/imageContentService.ts - UPDATED WITH CENTRAL PROMPT SYSTEM
import { getCarEnhancementPrompt } from '../prompts/carImagePrompts';

const AUTH_TOKEN = 'Bearer admin-temp-key';

export interface CarData {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  images?: string[];
}

export class ImageContentService {
  
  async generateContentWithImages(
    carData: CarData, 
    platforms: string[] = ['instagram', 'facebook', 'linkedin']
  ) {
    try {
      // ✅ FIXED: Use absolute URL for server-side requests
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : process.env.NEXTAUTH_URL || 'http://localhost:3000';

      console.log('🔍 ImageContentService calling:', `${baseUrl}/api/admin/thumbnails`);

      // ✅ ENHANCED: Generate platform-specific images with central prompt system
      const imagePromises = platforms.map(async (platform) => {
        
        // ✅ NEW: Use Central Prompt System instead of old imagePromptAgent
        const promptParams = {
          car: {
            id: carData.id,
            brand: carData.brand,
            model: carData.model,
            year: carData.year,
            price: carData.price
          },
          platform: platform as 'instagram' | 'facebook' | 'linkedin',
          imageUrl: carData.images?.[0] || null,
          contentType: 'standard' as const
        };
        
        const enhancedPrompt = getCarEnhancementPrompt(promptParams);
        
        console.log(`🤖 Generated ${platform} prompt via central system:`, enhancedPrompt.substring(0, 100) + '...');
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': AUTH_TOKEN
        };
        
        // ✅ KEEP: Vercel bypass authentication
        if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
          headers['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
        }
        
        const response = await fetch(`${baseUrl}/api/admin/thumbnails`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            carData: {
              id: carData.id,
              brand: carData.brand,
              model: carData.model,
              year: carData.year,
              price: carData.price
            },
            prompt: enhancedPrompt, // ✅ NEW: Use central prompt instead of imagePromptAgent
            platform,
            style: 'professional_automotive', // ✅ UPDATED: Professional automotive style
            contentType: 'standard'
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ ImageContentService failed for ${platform}:`, response.status, errorText);
          throw new Error(`Failed to generate image for ${platform}: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log(`✅ ImageContentService success for ${platform}:`, {
          model: result.model || 'unknown-model',
          mode: result.mode,
          visionAnalysis: result.visionAnalysis?.detectedAngle || 'no-analysis'
        });
        
        return {
          platform,
          ...result
        };
      });
      
      const images = await Promise.all(imagePromises);
      
      return {
        carId: carData.id,
        images,
        totalCost: images.reduce((sum, img) => sum + (img.cost || 0), 0),
        success: true,
        uniquePrompts: images.length, // Track prompt diversity
        generationMode: images.map(img => img.mode).join(', ')
      };
      
    } catch (error) {
      console.error('❌ ImageContentService failed:', error);
      return {
        carId: carData.id,
        images: [],
        totalCost: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  async generateBatchImages(cars: CarData[], platforms: string[] = ['instagram']) {
    const batchSize = 2; // ✅ REDUCED: Smaller batches for quality focus
    const results = [];
    
    for (let i = 0; i < cars.length; i += batchSize) {
      const batch = cars.slice(i, i + batchSize);
      console.log(`🚀 ImageContentService batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(cars.length/batchSize)}`);
      
      const batchPromises = batch.map(car => 
        this.generateContentWithImages(car, platforms)
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // ✅ ENHANCED: Longer delay for stability
      if (i + batchSize < cars.length) {
        console.log('⏳ Waiting 3 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    // ✅ ENHANCED: Log batch summary
    const successCount = results.filter(r => r.success).length;
    console.log(`🎉 Batch generation completed: ${successCount}/${results.length} successful`);
    
    return results;
  }
  
  // ✅ NEW: Festival poster generation method
  async generateFestivalContent(
    carData: CarData,
    festival: 'diwali' | 'holi' | 'dussehra' | 'ganesh-chaturthi' | 'navratri',
    platforms: string[] = ['instagram', 'facebook']
  ) {
    try {
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : process.env.NEXTAUTH_URL || 'http://localhost:3000';

      const imagePromises = platforms.map(async (platform) => {
        const promptParams = {
          car: {
            id: carData.id,
            brand: carData.brand,
            model: carData.model,
            year: carData.year,
            price: carData.price
          },
          platform: platform as 'instagram' | 'facebook' | 'linkedin',
          imageUrl: carData.images?.[0] || null,
          contentType: 'festival' as const,
          festival: festival
        };
        
        const festivalPrompt = getCarEnhancementPrompt(promptParams);
        console.log(`🎊 Generated ${festival} ${platform} prompt:`, festivalPrompt.substring(0, 100) + '...');
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': AUTH_TOKEN
        };
        
        if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
          headers['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
        }
        
        const response = await fetch(`${baseUrl}/api/admin/thumbnails`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            carData: {
              id: carData.id,
              brand: carData.brand,
              model: carData.model,
              year: carData.year,
              price: carData.price
            },
            prompt: festivalPrompt,
            platform,
            style: 'professional_automotive',
            contentType: 'festival',
            festival: festival
          })
        });
        
        if (!response.ok) {
          throw new Error(`Festival content generation failed for ${platform}: ${response.status}`);
        }
        
        return await response.json();
      });
      
      const festivalImages = await Promise.all(imagePromises);
      
      return {
        carId: carData.id,
        festival: festival,
        images: festivalImages,
        success: true
      };
      
    } catch (error) {
      console.error(`❌ Festival content generation failed for ${festival}:`, error);
      return {
        carId: carData.id,
        festival: festival,
        images: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
