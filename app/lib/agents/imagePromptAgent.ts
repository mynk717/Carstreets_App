import { CarData, CONTENT_TEMPLATES, generateCarPrompt } from '@/lib/utils/promptTemplates';

export class ImagePromptAgent {
  async generatePrompts(
    carData: CarData, 
    contentType: 'lifestyle' | 'technical' | 'promotional', 
    platform: string
  ): Promise<string> {
    const template = CONTENT_TEMPLATES[contentType];
    const basePrompt = template(carData);
    
    return generateCarPrompt(carData, basePrompt, platform, 'photorealistic');
  }
  
  async generateBatchPrompts(
    cars: CarData[], 
    contentType: 'lifestyle' | 'technical' | 'promotional', 
    platforms: string[]
  ): Promise<Array<{carId: string, platform: string, prompt: string}>> {
    const results = [];
    
    for (const car of cars) {
      for (const platform of platforms) {
        const prompt = await this.generatePrompts(car, contentType, platform);
        results.push({
          carId: car.id,
          platform,
          prompt
        });
      }
    }
    
    return results;
  }
}
