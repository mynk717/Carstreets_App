import { ImagePromptAgent } from './imagePromptAgent';
import { CarData } from '../utils/promptTemplates';

const AUTH_TOKEN = 'Bearer admin-temp-key';
export class ImageContentService {
  private imagePromptAgent: ImagePromptAgent;
  
  constructor() {
    this.imagePromptAgent = new ImagePromptAgent();
  }
  
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

      // Generate platform-specific images
      const imagePromises = platforms.map(async (platform) => {
        const prompt = await this.imagePromptAgent.generatePrompts(
          carData, 
          'lifestyle', 
          platform
        );
        
        console.log(`🍌 Generating image for ${platform} via ImageContentService`);
        
        const response = await fetch(`${baseUrl}/api/admin/thumbnails`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json',
            Authorization: AUTH_TOKEN
           },
          body: JSON.stringify({
            carData,
            prompt,
            platform,
            style: 'photorealistic'
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ ImageContentService failed for ${platform}:`, response.status, errorText);
          throw new Error(`Failed to generate image for ${platform}: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log(`✅ ImageContentService success for ${platform}:`, result.model || 'unknown-model');
        
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
        success: true
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
    const batchSize = 3;
    const results = [];
    
    for (let i = 0; i < cars.length; i += batchSize) {
      const batch = cars.slice(i, i + batchSize);
      const batchPromises = batch.map(car => 
        this.generateContentWithImages(car, platforms)
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      if (i + batchSize < cars.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return results;
  }
}
