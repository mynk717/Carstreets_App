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

        const baseUrl = process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:3000';

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

        const imageResponse = await fetch(`${baseUrl}/api/admin/thumbnails`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer admin-temp-key', // Add in case required
          },
          body: JSON.stringify({
            carData: {
              id: car.id,
              make: car.brand,
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
        const contentType = imageResponse.headers.get('content-type');

        if (!contentType?.includes('application/json')) {
          const text = await imageResponse.text();
          console.error('Non-JSON response:', imageResponse.status, text.slice(0, 200));
          throw new Error(`Expected JSON, received ${contentType}: ${text.slice(0, 200)}`);
        }

        if (!imageResponse.ok) {
          const text = await imageResponse.text();
          console.error('Thumbnail API failed:', imageResponse.status, text.slice(0, 200));
          throw new Error(`Thumbnail API failed: ${imageResponse.status} ${text}`);
        }

        const imageResult = await imageResponse.json();

        if (!imageResult.success) {
          console.error('Thumbnail API returned failure:', imageResult);
          throw new Error(`Thumbnail generation failed: ${imageResult.error || 'Unknown error'}`);
        }

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
      }
    }

    return results;
  }
}