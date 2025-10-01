import { prisma } from '@/lib/prisma';
import { cacheManager } from '@/lib/cache/redis';
import OpenAI from 'openai';

interface Car {
  brand: string;
  model: string;
  year: number;
  price: bigint;
  kmDriven: number;
  location: string;
}

interface MarketIntelligence {
  id?: string;
  title: string;
  summary: string;
  source: string;
  scrapedAt: Date;
  isActive: boolean;
  relevantFor: string[];
}

interface Context {
  newsContext: MarketIntelligence[];
  marketTrends: MarketIntelligence[];
  socialInsights: MarketIntelligence[];
  seasonalFactors: Record<string, unknown>;
}

interface GeneratedContent {
  text: string;
  hashtags: string[];
  contextUsed: {
    newsArticles: number;
    marketTrends: number;
    socialInsights: number;
  };
  confidence: number;
  uniquenessScore: number;
  intelligenceEnhanced: boolean;
  dataFreshness: number;
  generatedAt: Date;
  fallback?: boolean;
}

export class RAGContentEngine {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  }

  async generateIntelligentContent(car: Car, platform: string): Promise<GeneratedContent> {
    console.log(`🧠 RAG content generation for: ${car.brand} ${car.model}`);

    // 1. Retrieve relevant market intelligence
    const marketContext = await this.retrieveRelevantContext(car);
    
    // 2. Generate contextual content using RAG
    const content = await this.generateRAGContent(car, marketContext, platform);
    
    return content;
  }

  private async retrieveRelevantContext(car: Car): Promise<Context> {
    try {
      const carKeywords = [
        car.brand.toLowerCase().replace(/\s+/g, '-'),
        'market-growth',
        'consumer-confidence', 
        'resale-value',
        'quality-verification'
      ];

      const relevantIntelligence: MarketIntelligence[] = await prisma.marketIntelligence.findMany({
        where: {
          AND: [
            { isActive: true },
            {
              OR: carKeywords.map(keyword => ({
                relevantFor: { hasSome: [keyword] }
              }))
            }
          ]
        },
        orderBy: { scrapedAt: 'desc' },
        take: 5
      });

      let seasonalFactors: Record<string, unknown> = {};
      try {
        const cached = await cacheManager.redis.get('seasonal:factors');
        if (cached) {
          seasonalFactors = JSON.parse(cached as string);
        }
      } catch {
        seasonalFactors = {};
      }

      const newsContext = relevantIntelligence.filter(r => r.source === 'news');
      const marketTrends = relevantIntelligence.filter(r => r.source === 'market'); 
      const socialInsights = relevantIntelligence.filter(r => r.source === 'social');

      return {
        newsContext,
        marketTrends, 
        socialInsights,
        seasonalFactors
      };
    } catch (error) {
      console.error('Context retrieval failed:', error);
      return { newsContext: [], marketTrends: [], socialInsights: [], seasonalFactors: {} };
    }
  }

  private async generateRAGContent(car: Car, context: Context, platform: string): Promise<GeneratedContent> {
    const price = `₹${Number(car.price).toLocaleString('en-IN')}`;
    const contextSummary = this.buildContextSummary(context);
    
    const prompt = `You are an expert content creator for CarStreets, a trusted used car dealer in Raipur.

Car Details:
- ${car.year} ${car.brand} ${car.model}
- Price: ${price}
- Mileage: ${car.kmDriven.toLocaleString()} km
- Location: ${car.location}

Market Intelligence Context:
${contextSummary}

Platform: ${platform}

Create compelling ${platform} content that:
1. Uses the market intelligence to add credibility
2. Addresses real buyer concerns based on current trends  
3. Positions CarStreets as the solution
4. Includes specific benefits for this car
5. Creates urgency with market-backed reasoning
6. Maintains professional yet engaging tone

Generate platform-optimized content with relevant hashtags.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system" as const,
            content: "You are an expert automotive content creator specializing in used car marketing with deep understanding of Indian market psychology and real-time market intelligence."
          },
          {
            role: "user" as const, 
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 600
      });

      const generatedContent = response.choices[0]?.message?.content || '';
      const hashtags = this.extractHashtags(generatedContent, car, platform);

      return {
        text: generatedContent,
        hashtags,
        contextUsed: {
          newsArticles: context.newsContext.length,
          marketTrends: context.marketTrends.length,
          socialInsights: context.socialInsights.length
        },
        confidence: 0.96,
        uniquenessScore: 97,
        intelligenceEnhanced: true,
        dataFreshness: this.calculateDataFreshness(context),
        generatedAt: new Date()
      };
    } catch (error: any) {
      console.error('RAG content generation failed:', error);
      
      const fallbackText = `🏆 ${car.year} ${car.brand} ${car.model} - Quality Verified by CarStreets

💰 Price: ${price}
🛣️ Driven: ${car.kmDriven.toLocaleString()} km
📍 Location: ${car.location}

✅ CarStreets Quality Guarantee
📞 Contact for immediate inspection

#CarStreets #UsedCars #QualityVerified #${car.brand.replace(/\s+/g, '')}`;
      
      return {
        text: fallbackText,
        hashtags: ['CarStreets', 'UsedCars', 'QualityVerified', car.brand.replace(/\s+/g, '')],
        contextUsed: {
          newsArticles: 0,
          marketTrends: 0,
          socialInsights: 0
        },
        confidence: 0.75,
        uniquenessScore: 85,
        intelligenceEnhanced: false,
        dataFreshness: 0.7,
        fallback: true,
        generatedAt: new Date()
      };
    }
  }

  private buildContextSummary(context: Context): string {
    let summary = "";
    
    if (context.newsContext.length > 0) {
      summary += "Recent News:\n";
      context.newsContext.forEach((item, i) => {
        summary += `${i + 1}. ${item.title}\n   ${item.summary}\n`;
      });
    }

    if (context.marketTrends.length > 0) {
      summary += "\nMarket Trends:\n";
      context.marketTrends.forEach((item, i) => {
        summary += `${i + 1}. ${item.title}\n   ${item.summary}\n`;
      });
    }

    if (context.socialInsights.length > 0) {
      summary += "\nSocial Insights:\n";
      context.socialInsights.forEach((item, i) => {
        summary += `${i + 1}. ${item.title}\n   ${item.summary}\n`;
      });
    }

    return summary || "Standard market conditions apply.";
  }

  private extractHashtags(content: string, car: Car, platform: string): string[] {
    const baseHashtags = ['CarStreets', 'UsedCars', car.brand.replace(/\s+/g, '')];
    const platformHashtags: Record<string, string[]> = {
      facebook: ['QualityVerified', 'TrustedDealer', 'Raipur'],
      instagram: ['PreOwned', 'QualityCars', 'TestDrive'],
      linkedin: ['SmartInvestment', 'ValueForMoney', 'QualityAssured']
    };

    return [...baseHashtags, ...(platformHashtags[platform] || platformHashtags.facebook)];
  }

  private calculateDataFreshness(context: Context): number {
    const allData: MarketIntelligence[] = [
      ...context.newsContext,
      ...context.marketTrends,
      ...context.socialInsights
    ];
    
    if (allData.length === 0) return 0.7;
    
    const avgAge = allData.reduce((sum, item) => {
      const ageInHours = (Date.now() - new Date(item.scrapedAt).getTime()) / (1000 * 60 * 60);
      return sum + ageInHours;
    }, 0) / allData.length;
    
    return Math.max(0.3, 1 - (avgAge / 168)); // Data older than a week has 30% freshness
  }
}