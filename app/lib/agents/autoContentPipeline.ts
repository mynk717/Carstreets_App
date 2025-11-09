import { prisma } from '@/lib/prisma';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { ImagePromptAgent } from './imagePromptAgent';
import { groupPlatformsByRatio, PLATFORM_SPECS } from './platformGrouping';
import { fal } from '@fal-ai/client';  // ✅ CORRECT IMPORT

interface ContentItem {
  carId: string;
  platform: string;
  textContent: string;
  hashtags: string[];
  imageUrl: string;
  originalImage: string;
  success: boolean;
  cost: number;
}

interface DealerContext {
  id: string;
  businessName: string;
  location: string;
  logo?: string | null;
  description?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
}

export class AutoContentPipeline {
  private imagePromptAgent: ImagePromptAgent;

  constructor() {
    this.imagePromptAgent = new ImagePromptAgent();
  }

  async generateReadyToPostContent(
    carIds: string[],
    platforms: string[] = ['instagram', 'facebook'],
    dealerContext: DealerContext
  ): Promise<ContentItem[]> {
    
    console.log(`🚀 Starting content generation for ${carIds.length} cars across ${platforms.length} platforms`);
    
    const cars = await this.fetchCars(carIds);
    console.log(`✅ Fetched ${cars.length} cars from database`);

    if (cars.length === 0) {
      console.warn('⚠️  No cars found with valid images');
      return [];
    }

    const content: ContentItem[] = [];
    const platformGroups = groupPlatformsByRatio(platforms);
    
    console.log(`📊 Platform groups:`, platformGroups);

    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];
      console.log(`\n🚗 Processing car ${i + 1}/${cars.length}: ${car.year} ${car.brand} ${car.model}`);

      const imagesByRatio: Record<string, { url: string; cost: number }> = {};

      for (const [ratio, groupPlatforms] of Object.entries(platformGroups)) {
        console.log(`\n  📸 Generating ${ratio} image for platforms: ${groupPlatforms.join(', ')}`);
        
        try {
          const representativePlatform = groupPlatforms[0];
          
          const imageResult = await this.generateImage(
            car, 
            representativePlatform, 
            dealerContext
          );
          
          imagesByRatio[ratio] = imageResult;
          console.log(`  ✅ ${ratio} image generated - Cost: ₹${imageResult.cost.toFixed(2)}`);
        } catch (error) {
          console.error(`  ❌ Failed to generate ${ratio} image:`, error);
          imagesByRatio[ratio] = {
            url: car.images[0],
            cost: 0
          };
        }
      }

      for (const platform of platforms) {
        console.log(`\n  📝 Generating ${platform} content...`);
        
        try {
          const spec = PLATFORM_SPECS[platform];
          const imageData = imagesByRatio[spec.ratio];

          const textResult = platform === 'whatsapp'
            ? this.generateWhatsAppTemplate(car, dealerContext)
            : await this.generateTextContent(car, platform, dealerContext);

          content.push({
            carId: car.id,
            platform,
            textContent: textResult.text,
            hashtags: textResult.hashtags,
            imageUrl: imageData.url,
            originalImage: car.images[0],
            success: true,
            cost: imageData.cost / platforms.length
          });

          console.log(`  ✅ ${platform} content generated`);
        } catch (error) {
          console.error(`  ❌ Failed to generate ${platform} content:`, error);
        }
      }
    }

    const totalCost = content.reduce((sum, item) => sum + item.cost, 0);
    console.log(`\n✨ Content generation complete!`);
    console.log(`📊 Generated: ${content.length} items`);
    console.log(`💰 Total cost: ₹${totalCost.toFixed(2)}`);

    return content;
  }

  private async fetchCars(carIds: string[]) {
    return await prisma.car.findMany({
      where: {
        id: { in: carIds },
        images: { not: null }
      },
      select: {
        id: true,
        brand: true,
        model: true,
        year: true,
        price: true,
        images: true,
        fuelType: true,
        transmission: true
      }
    });
  }

  private async generateImage(
    car: any,
    platform: string,
    dealerContext: DealerContext
  ): Promise<{ url: string; cost: number }> {
    
    const originalImage = Array.isArray(car.images) ? car.images[0] : car.images;
    
    const enhancedPrompt = this.imagePromptAgent.generateHighValuePrompt(
      car,
      {
        businessName: dealerContext.businessName,
        location: dealerContext.location,
        logo: dealerContext.logo || undefined,
        description: dealerContext.description || undefined
      },
      platform,
      originalImage
    );

    console.log(`    🤖 Calling Banana API (${enhancedPrompt.length} chars)...`);

    try {
      // ✅ CORRECT: Using official fal.ai API pattern
      const result = await fal.subscribe("fal-ai/nano-banana/edit", {
        input: {
          prompt: enhancedPrompt,
          image_urls: [originalImage],
          num_images: 1,
          aspect_ratio: platform === 'linkedin' ? '16:9' : '1:1',
          output_format: 'jpeg',
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            console.log(`    ⏳ Status: ${update.status}`);
          }
        },
      });

      if (!result.data?.images?.length) {
        throw new Error('No images returned from Banana API');
      }

      const imageUrl = result.data.images[0].url;
      console.log(`    ✅ Banana API success`);
      console.log(`    📸 Image URL: ${imageUrl.substring(0, 60)}...`);
      
      return {
        url: imageUrl,
        cost: 0.04
      };
    } catch (error) {
      console.error(`    ❌ Banana API failed:`, error);
      return {
        url: originalImage,
        cost: 0
      };
    }
  }

  private async generateTextContent(
    car: any,
    platform: string,
    dealerContext: DealerContext
  ): Promise<{ text: string; hashtags: string[] }> {
    
    const spec = PLATFORM_SPECS[platform];
    
    const prompt = `Create ${platform} post content for a preowned car dealer:

Car: ${car.year} ${car.brand} ${car.model}
Price: ₹${Number(car.price).toLocaleString()}

DEALER INFORMATION (MUST USE - DO NOT USE PLACEHOLDERS):
Dealership: ${dealerContext.businessName}
Location: ${dealerContext.location}
${dealerContext.phoneNumber ? `Contact: ${dealerContext.phoneNumber}` : ''}
${dealerContext.email ? `Email: ${dealerContext.email}` : ''}

Platform: ${platform}
Tone: ${spec.tone}
Max length: ${spec.maxChars} characters

CRITICAL REQUIREMENTS:
- Use ACTUAL dealer contact details above (NEVER use placeholders like [Your contact number])
- Include ${dealerContext.businessName} naturally in the post
- Mention ${dealerContext.location} for local SEO
- Add compelling call-to-action
- Authentic preowned car appeal (not new showroom)
${platform === 'linkedin' ? '- Professional business tone' : ''}
${platform === 'instagram' ? '- Lifestyle and aspirational' : ''}
${platform === 'facebook' ? '- Family-friendly and trustworthy' : ''}

Format:
[Engaging caption with dealer name and location]

[Call to action with real contact info]

Include exactly ${spec.hashtags} relevant hashtags at the end.`;

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      prompt
    });

    const text = result.text;
    const hashtagMatch = text.match(/#[\w]+/g);
    const hashtags = hashtagMatch || [];

    return { text, hashtags };
  }

  private generateWhatsAppTemplate(
    car: any,
    dealerContext: DealerContext
  ): { text: string; hashtags: string[] } {
    
    const text = `Hi {{1}},

Check out this ${car.year} ${car.brand} ${car.model} available at ${dealerContext.businessName}!

💰 Price: ₹${Number(car.price).toLocaleString()}
📍 Location: ${dealerContext.location}
${dealerContext.phoneNumber ? `📞 Contact: ${dealerContext.phoneNumber}` : ''}
✅ Test drive available today

Interested? Reply YES to book your visit!

Best regards,
${dealerContext.businessName}`;

    return { text, hashtags: [] };
  }
}
