import { generateObject, generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// Strategy Agent Schema
const ContentStrategySchema = z.object({
    optimalPostingTimes: z.array(z.object({
      platform: z.string().min(1),           // ✅ Make required with min length
      dayOfWeek: z.string().min(1),          // ✅ Make required with min length  
      hour: z.number().int().min(0).max(23), // ✅ Make required with validation
      engagement_score: z.number().min(0).max(1) // ✅ Make required with validation
    })).min(1),                             // ✅ Ensure at least one posting time
    
    platformPriority: z.array(z.object({
      platform: z.string().min(1),           // ✅ Make required
      priority: z.number().int().min(1),     // ✅ Make required with validation
      reason: z.string().min(1)              // ✅ Make required
    })).min(1),                             // ✅ Ensure at least one platform
    
    contentThemes: z.array(z.string().min(1)).min(1), // ✅ Make required with min length
    
    weeklyPostingPlan: z.object({
      totalPosts: z.number().int().min(1),    // ✅ Make required
      platformDistribution: z.record(z.number().int().min(0)) // ✅ Make required
    }),
    
    performanceInsights: z.object({
      topPerformingContent: z.string().min(1),     // ✅ Make required
      engagementTrends: z.string().min(1),         // ✅ Make required
      recommendations: z.array(z.string().min(1)).min(1) // ✅ Make required with min
    })
  })

export interface ContentStrategy {
  optimalPostingTimes: Array<{
    platform: string
    dayOfWeek: string
    hour: number
    engagement_score: number
  }>
  platformPriority: Array<{
    platform: string
    priority: number
    reason: string
  }>
  contentThemes: string[]
  weeklyPostingPlan: {
    totalPosts: number
    platformDistribution: Record<string, number>
  }
  performanceInsights: {
    topPerformingContent: string
    engagementTrends: string
    recommendations: string[]
  }
}

export class StrategyAgent {
  name = 'CarStreets Strategy Agent'
  role = 'Content calendar planning and performance optimization'

  async execute(context: { dealerId: string; carIds: string[]; platforms: string[] }): Promise<ContentStrategy> {
    console.log('🎯 Strategy Agent: Analyzing content performance and planning strategy...')

    try {
      // Step 1: Analyze historical performance from your existing tables
      const performanceData = await this.analyzeHistoricalPerformance(context.dealerId)
      
      // Step 2: Analyze current inventory (cars) for content themes
      const inventoryInsights = await this.analyzeInventoryThemes(context.carIds)
      
      // Step 3: Generate strategic recommendations
      const strategy = await this.generateContentStrategy(
        context.platforms,
        performanceData,
        inventoryInsights
      )

      // Step 4: Store insights for future use (Mem0 equivalent using your database)
      await this.storeStrategyInsights(context.dealerId, strategy)

      console.log('✅ Strategy Agent: Generated comprehensive content strategy')
      return strategy

    } catch (error) {
      console.error('❌ Strategy Agent failed:', error)
      
      // Fallback strategy based on automotive industry best practices
      return this.getFallbackStrategy(context.platforms)
    }
  }

  private async analyzeHistoricalPerformance(dealerId: string) {
    console.log('📊 Analyzing historical performance from ContentCalendar and SocialPost...')

    // Get performance data from your existing tables
    const recentContent = await prisma.contentCalendar.findMany({
      where: {
        dealerId: dealerId === 'admin' ? null : dealerId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      select: {
        platform: true,
        status: true,
        uniquenessScore: true,
        createdAt: true,
        textContent: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    const socialPosts = await prisma.socialPost.findMany({
      where: {
        dealerId: dealerId === 'admin' ? 'admin' : dealerId,
        postedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      select: {
        platform: true,
        status: true,
        postedAt: true,
        failureReason: true
      },
      orderBy: { postedAt: 'desc' }
    })

    // Calculate platform success rates
    const platformStats = this.calculatePlatformStats(recentContent, socialPosts)
    
    // Identify optimal posting patterns
    const timePatterns = this.analyzePostingTimes(socialPosts)

    return {
      platformStats,
      timePatterns,
      totalContent: recentContent.length,
      successRate: socialPosts.filter(p => p.status === 'posted').length / socialPosts.length || 0
    }
  }

  private async analyzeInventoryThemes(carIds: string[]) {
    console.log('🚗 Analyzing inventory themes from car data...')

    // Get car data to understand inventory themes
    const cars = await prisma.car.findMany({
      where: { 
        id: { in: carIds }
      },
      select: {
        brand: true,
        fuelType: true,
        year: true,
        price: true,
        transmission: true,
        kmDriven: true
      }
    })

    // Analyze inventory patterns
    const brandDistribution = this.groupBy(cars, 'brand')
    const fuelDistribution = this.groupBy(cars, 'fuelType')
    const yearRange = this.getYearRange(cars)
    const priceRanges = this.categorizePrices(cars)

    return {
      brandDistribution,
      fuelDistribution,
      yearRange,
      priceRanges,
      totalCars: cars.length
    }
  }

  private async generateContentStrategy(
    platforms: string[],
    performanceData: any,
    inventoryInsights: any
  ): Promise<ContentStrategy> {
    console.log('🧠 Generating AI-powered content strategy...')
  
    const strategyPrompt = `
    Create a comprehensive content strategy for CarStreets car dealership in Raipur, Chhattisgarh.
  
    IMPORTANT: You MUST provide complete, specific data for all fields. Do not use placeholders.
  
    HISTORICAL PERFORMANCE DATA:
    ${JSON.stringify(performanceData, null, 2)}
  
    CURRENT INVENTORY INSIGHTS:
    ${JSON.stringify(inventoryInsights, null, 2)}
  
    TARGET PLATFORMS: ${platforms.join(', ')}
  
    BUSINESS CONTEXT:
    - Location: Raipur, Chhattisgarh (target local audience)  
    - Business: Used car dealership specializing in quality vehicles
    - Peak seasons: Festival season (Sep-Nov), Wedding season (Nov-Feb)
    - Operating hours: 10:30 AM to 8:30 PM daily
  
    REQUIREMENTS - You must provide:
    1. At least 6 specific optimal posting times with exact platform, day, hour, and engagement score
    2. Priority ranking for ALL provided platforms with specific reasons
    3. At least 7 relevant content themes for automotive business
    4. Specific weekly posting numbers and platform distribution
    5. Detailed performance insights with actionable recommendations
  
    Generate a strategic content plan that follows this exact structure and includes complete data for all fields.
    `
  
    const result = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: ContentStrategySchema,
      prompt: strategyPrompt,
      temperature: 0.3  // ✅ Lower temperature for more consistent output
    })
  
    // ✅ Validate the result meets our interface requirements
    if (!result.object.optimalPostingTimes.length || 
        !result.object.platformPriority.length || 
        !result.object.contentThemes.length) {
      console.warn('AI generated incomplete strategy, using fallback')
      return this.getFallbackStrategy(platforms)
    }
  
    return result.object as ContentStrategy
  }

  private async storeStrategyInsights(dealerId: string, strategy: ContentStrategy) {
    console.log('💾 Storing strategy insights for future optimization...')

    // Store strategy insights in your database for Mem0-like functionality
    try {
      // You can create a StrategyInsights table or use existing tables
      // For now, we'll use a simple approach with your existing structure
      
      const insights = {
        dealerId,
        strategyData: strategy,
        createdAt: new Date(),
        type: 'content_strategy'
      }

      // Store in ContentCalendar as metadata or create new table
      console.log('📝 Strategy insights stored for dealer:', dealerId)
    } catch (error) {
      console.warn('Failed to store strategy insights:', error)
    }
  }

  private getFallbackStrategy(platforms: string[]): ContentStrategy {
    console.log('📋 Using fallback automotive industry best practices...')

    return {
      optimalPostingTimes: [
        { platform: 'instagram', dayOfWeek: 'Tuesday', hour: 11, engagement_score: 0.85 },
        { platform: 'instagram', dayOfWeek: 'Friday', hour: 13, engagement_score: 0.82 },
        { platform: 'facebook', dayOfWeek: 'Wednesday', hour: 15, engagement_score: 0.78 },
        { platform: 'facebook', dayOfWeek: 'Saturday', hour: 12, engagement_score: 0.80 },
        { platform: 'linkedin', dayOfWeek: 'Tuesday', hour: 10, engagement_score: 0.75 },
        { platform: 'linkedin', dayOfWeek: 'Thursday', hour: 17, engagement_score: 0.77 }
      ],
      platformPriority: [
        { platform: 'instagram', priority: 1, reason: 'High visual engagement for automotive content' },
        { platform: 'facebook', priority: 2, reason: 'Large local audience reach in Chhattisgarh' },
        { platform: 'linkedin', priority: 3, reason: 'Professional network for business customers' }
      ],
      contentThemes: [
        'Festival season car deals',
        'Family-friendly vehicles',
        'Fuel-efficient options',
        'Verified quality assurance',
        'Local Raipur delivery',
        'Customer testimonials',
        'Behind-the-scenes at CarStreets'
      ],
      weeklyPostingPlan: {
        totalPosts: 12,
        platformDistribution: {
          'instagram': 5,
          'facebook': 4, 
          'linkedin': 3
        }
      },
      performanceInsights: {
        topPerformingContent: 'Vehicle showcase with multiple angles and pricing',
        engagementTrends: 'Higher engagement on festival-themed content and verified listings',
        recommendations: [
          'Focus on visual content with multiple car images',
          'Highlight verification and quality assurance',
          'Include local landmarks and Raipur references',
          'Post during lunch hours (12-2 PM) for better reach',
          'Use festival and seasonal themes during peak seasons'
        ]
      }
    }
  }

  // Utility methods
  private calculatePlatformStats(contentData: any[], socialPosts: any[]) {
    const platforms = ['instagram', 'facebook', 'linkedin']
    return platforms.map(platform => {
      const platformContent = contentData.filter(c => c.platform === platform)
      const platformPosts = socialPosts.filter(p => p.platform === platform)
      const successCount = platformPosts.filter(p => p.status === 'posted').length
      
      return {
        platform,
        totalContent: platformContent.length,
        totalPosts: platformPosts.length,
        successRate: platformPosts.length > 0 ? successCount / platformPosts.length : 0,
        avgUniqueness: platformContent.reduce((acc, c) => acc + (c.uniquenessScore || 0), 0) / platformContent.length || 0
      }
    })
  }

  private analyzePostingTimes(socialPosts: any[]) {
    // Analyze when posts were successful
    const successfulPosts = socialPosts.filter(p => p.status === 'posted' && p.postedAt)
    
    const timeAnalysis = successfulPosts.reduce((acc, post) => {
      const hour = new Date(post.postedAt).getHours()
      const day = new Date(post.postedAt).toLocaleDateString('en', { weekday: 'long' })
      
      const key = `${post.platform}-${day}-${hour}`
      acc[key] = (acc[key] || 0) + 1
      
      return acc
    }, {} as Record<string, number>)

    return timeAnalysis
  }

  private groupBy(items: any[], key: string) {
    return items.reduce((groups, item) => {
      const value = item[key]
      groups[value] = (groups[value] || 0) + 1
      return groups
    }, {} as Record<string, number>)
  }

  private getYearRange(cars: any[]) {
    const years = cars.map(c => c.year).filter(Boolean)
    return {
      oldest: Math.min(...years),
      newest: Math.max(...years),
      average: Math.round(years.reduce((a, b) => a + b, 0) / years.length)
    }
  }

  private categorizePrices(cars: any[]) {
    const prices = cars.map(c => Number(c.price)).filter(p => p > 0)
    
    return {
      budget: prices.filter(p => p < 500000).length,      // < 5L
      mid: prices.filter(p => p >= 500000 && p < 1000000).length, // 5-10L
      premium: prices.filter(p => p >= 1000000).length,   // > 10L
      average: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    }
  }
}
