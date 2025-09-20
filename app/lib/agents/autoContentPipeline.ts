import { prisma } from '@/lib/prisma';
import { CAR_STREETS_PROFILE } from '../../data/carStreetsProfile';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export class AutoContentPipeline {
  
  async generateUniqueText(car: any, platform: string) {
    const profile = CAR_STREETS_PROFILE;
    
    const contextPrompt = `Generate ${platform} content for ${car.year} ${car.make} ${car.model} at CarStreets:
    
    CARSTREETS CONTEXT:
    - Owner: ${profile.operations.key_personnel[0]}
    - Location: Raipur, Chhattisgarh  
    - Price: ₹${car.price}
    - Operating: ${profile.operations.operating_hours}
    - Specialization: ${profile.business.specialization.join(', ')}
    
    Create unique, engaging ${platform} post with CarStreets branding, Raipur location context, and September 2025 relevance.
    Include specific details that competitors cannot replicate.`;
    
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: contextPrompt,
      temperature: 0.8
    });
    
    return {
      text: result.text,
      hashtags: ['#CarStreets', '#RaipurCars', '#AnkitPandeyAutos', `#${car.make.replace(' ', '')}`],
      platform
    };
  }
  
  async generateReadyToPostContent(carIds: string[]) {
    const results = [];
    
    for (const carId of carIds) {
      // Get car with images
      const car = await prisma.car.findUnique({
        where: { id: carId },
        // ✅ Adjust these field names to match YOUR database schema
        select: {
          id: true,
          brand: true,
          model: true, 
          year: true,
          price: true,
          images: true, // or whatever your image field is called
          // Add other fields you need
        }
      });
      
      if (!car) continue;
      
      const platforms = ['instagram', 'facebook', 'linkedin'];
      
      for (const platform of platforms) {
        // Generate text content  
        const textContent = await this.generateUniqueText(car, platform);
        
        // Generate branded image using Cloudinary + nano-banana
        const imageResponse = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/admin/thumbnails`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            carData: {
              id: car.id,
              make: car.brand,
              model: car.model,
              year: car.year,
              price: Number(car.price) // Convert BigInt to Number
            },
            platform,
            style: 'photorealistic'
          })
        });
        
        const imageResult = await imageResponse.json();
        
        results.push({
          carId: car.id,
          platform,
          textContent: textContent.text,
          hashtags: textContent.hashtags,
          imageUrl: imageResult.imageUrl,
          originalImage: car.images?.[0] || null, // Adjust based on your schema
          success: imageResult.success,
          cost: imageResult.cost || 0
        });
      }
    }
    
    return results;
  }
}
