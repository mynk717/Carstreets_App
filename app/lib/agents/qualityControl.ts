// lib/agents/qualityControl.ts
import { z } from 'zod'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'

// ✅ Add missing type definitions
const ContentQualitySchema = z.object({
  uniqueness_score: z.number().min(0).max(100),
  accuracy_score: z.number().min(0).max(100),
  brand_compliance: z.boolean(),
  approved: z.boolean(),
  issues: z.array(z.string())
})

type QualityCheck = z.infer<typeof ContentQualitySchema>

export class QualityControlAgent {
  // ✅ Add missing method
  private async getRecentContent(days: number): Promise<string[]> {
    // Simple implementation - you can enhance with actual database queries later
    console.log(`🔍 [QualityControl] Checking content from last ${days} days`)
    
    // For now, return some sample content to compare against
    // You can replace this with actual database query to your content table
    return [
      "🚗 2020 Maruti Swift, ₹4.5L, 45000km, Petrol, Automatic - Perfect for city driving!",
      "✨ Honda City 2019, ₹7.2L, 32000km, Petrol, Manual - Verified by CarStreets!",
      "🔥 Hyundai i20 2021, ₹6.8L, 15000km, Petrol, Automatic - Like new condition!"
    ]
  }

  async checkUniqueness(content: string): Promise<number> {
    // Check against existing content in database
    const existingContent = await this.getRecentContent(30) // Last 30 days
    
    const result = await generateObject({
      model: openai('gpt-4o-mini'), // ✅ Use cost-effective model
      schema: z.object({
        uniqueness_percentage: z.number().min(0).max(100),
        similar_content_found: z.boolean(),
        originality_score: z.number().min(0).max(100)
      }),
      prompt: `Analyze this content for uniqueness against existing content:
      
      NEW CONTENT: "${content}"
      
      EXISTING CONTENT: ${JSON.stringify(existingContent)}
      
      Rate uniqueness from 0-100. Anything below 90% is not acceptable.`
    })
    
    return result.object.uniqueness_percentage
  }
  
  async validateContentAccuracy(content: any, carData: any): Promise<QualityCheck> {
    const result = await generateObject({
      model: openai('gpt-4o-mini'), // ✅ Use cost-effective model
      schema: ContentQualitySchema,
      prompt: `Validate this car content for accuracy:
      
      CONTENT: ${JSON.stringify(content)}
      CAR DATA: ${JSON.stringify(carData)}
      
      Check for:
      1. Price accuracy (manually verified vs scraped)
      2. Car specifications correctness
      3. Brand/model consistency
      4. Location accuracy
      5. No false claims or exaggerations`
    })
    
    return result.object
  }
}
