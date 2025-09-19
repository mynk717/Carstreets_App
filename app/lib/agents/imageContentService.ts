import { ImagePromptAgent } from './imagePromptAgent';
import { CarData } from '../utils/promptTemplates';

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
      // Generate platform-specific images
      const imagePromises = platforms.map(async (platform) => {
        const prompt = await this.imagePromptAgent.generatePrompts(
          carData, 
          'lifestyle', 
          platform
        );
        
        const response = await fetch('/api/admin/thumbnails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            carData,
            prompt,
            platform,
            style: 'photorealistic'
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to generate image for ${platform}`);
        }
        
        return {
          platform,
          ...(await response.json())
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
      console.error('Image generation failed:', error);
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
    const batchSize = 3; // Process 3 cars at a time
    const results = [];
    
    for (let i = 0; i < cars.length; i += batchSize) {
      const batch = cars.slice(i, i + batchSize);
      const batchPromises = batch.map(car => 
        this.generateContentWithImages(car, platforms)
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Rate limiting: Wait 2 seconds between batches
      if (i + batchSize < cars.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return results;
  }
}
