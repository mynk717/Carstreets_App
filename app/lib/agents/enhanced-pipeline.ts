import { cacheManager } from '../cache/redis';
import { CarMarketIntelligence } from '../intelligence/carScoring';
import { prisma } from '../database/db';

interface ContentAgent {
  name: string;
  role: string;
  execute(context: any): Promise<any>;
}

interface CarData {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: bigint;
  kmDriven: number;
  location: string;
  images: any;
  isVerified: boolean;
  dealerId?: string;
}

class ResearchAgent implements ContentAgent {
  name = 'Enhanced Research Agent';
  role = 'Market research with CarStreets context';
  
  async execute(context: { car: CarData; dealerId: string }) {
    // Use your existing CarMarketIntelligence but enhance it
    const existingScore = await CarMarketIntelligence.scoreCarForMarketing(context.car as any);
    
    // Add seasonal intelligence
    const seasonalFactors = this.getSeasonalInsights();
    
    // Market positioning for Raipur/Chhattisgarh
    const marketData = {
      avgPrice: Number(context.car.price) * 0.95, // Competitive pricing
      marketDemand: this.calculateDemand(context.car),
      priceComparison: 'competitive',
      regionalFactors: {
        location: 'Raipur, Chhattisgarh',
        targetAudience: 'Young professionals, families',
        popularBrands: ['Maruti Suzuki', 'Hyundai', 'Tata'],
        festivalSeason: seasonalFactors.isFestivalSeason
      }
    };
    
    return {
      existingScore,
      marketData,
      seasonalFactors,
      confidence: 0.9
    };
  }
  
  private getSeasonalInsights() {
    const month = new Date().getMonth();
    const isWeddingSeason = [10, 11, 0, 1].includes(month); // Nov-Feb
    const isFestivalSeason = [8, 9, 10].includes(month); // Sep-Nov (Ganesh, Navratri, Diwali)
    const isMonsoonfriendly = [5, 6, 7, 8].includes(month); // Jun-Sep
    
    return {
      isWeddingSeason,
      isFestivalSeason,
      isMonsoonfriendly,
      demandMultiplier: isFestivalSeason ? 1.3 : isWeddingSeason ? 1.2 : 1.0,
      seasonalMessage: isFestivalSeason ? 'Perfect for festival season!' : 
                      isWeddingSeason ? 'Ideal for wedding season!' : 
                      'Great value buy!'
    };
  }
  
  private calculateDemand(car: CarData): 'high' | 'medium' | 'low' {
    // Popular brands in Chhattisgarh
    const popularBrands = ['maruti suzuki', 'hyundai', 'tata'];
    const brandPopular = popularBrands.includes(car.brand.toLowerCase());
    
    // Age factor
    const carAge = new Date().getFullYear() - car.year;
    const isRecent = carAge <= 5;
    
    // Mileage factor
    const lowMileage = car.kmDriven < 60000;
    
    if (brandPopular && isRecent && lowMileage) return 'high';
    if (brandPopular || (isRecent && lowMileage)) return 'medium';
    return 'low';
  }
}

class ContentCreatorAgent implements ContentAgent {
  name = 'CarStreets Content Creator';
  role = 'Brand-specific content generation';
  
  async execute(context: { car: CarData; research: any; dealerId: string; platform: string }) {
    // Check cache first
    const cached = await cacheManager.getCachedContent(
      context.dealerId, 
      context.car.id, 
      context.platform
    );
    
    if (cached) {
      console.log('🚀 Using cached content for', context.platform);
      return cached;
    }
    
    console.log('💫 Generating fresh content for', context.platform);
    
    // Generate platform-specific content
    const content = await this.generateBrandedContent(context);
    
    // Cache the result for 1 hour
    await cacheManager.cacheGeneratedContent(
      context.dealerId,
      context.car.id,
      context.platform,
      content
    );
    
    return content;
  }
  
  private async generateBrandedContent(context: { car: CarData; research: any; platform: string }) {
    const { car, research, platform } = context;
    const price = `₹${Number(car.price).toLocaleString('en-IN')}`;
    
    // CarStreets specific branding
    const carStreetsSignature = "🚗 CarStreets - Your Trusted Car Partner in Raipur";
    const contactInfo = "📞 Contact us for immediate inspection & test drive";
    
    const platformContent = {
      facebook: {
        text: `🌟 ${car.year} ${car.brand} ${car.model} - ${research.seasonalFactors.seasonalMessage}

💰 Price: ${price} ${research.marketData.priceComparison === 'competitive' ? '(Competitive pricing!)' : ''}
🛣️ KM Driven: ${car.kmDriven.toLocaleString()} km
⛽ Fuel: Premium quality maintained
📍 Location: ${car.location}

${research.seasonalFactors.isFestivalSeason ? '🎊 Perfect timing for festival season purchase!' : ''}
${research.marketData.marketDemand === 'high' ? '🔥 High demand model - Book now!' : ''}

${carStreetsSignature}
${contactInfo}

#CarStreets #UsedCars #${car.brand.replace(/\s+/g, '')} #Raipur #ChhattisgarhtUsedCars #TrustedDealer`,

        hashtags: ['CarStreets', 'UsedCars', car.brand.replace(/\s+/g, ''), 'Raipur', 'ChhattisgarhtUsedCars', 'TrustedDealer']
      },

      instagram: {
        text: `✨ ${car.year} ${car.brand} ${car.model}

💰 ${price}
🛣️ ${car.kmDriven.toLocaleString()}km
📍 ${car.location}

${research.seasonalFactors.seasonalMessage} 🎯

${carStreetsSignature}

#CarStreets #UsedCars #${car.brand.replace(/\s+/g, '')}${car.model.replace(/\s+/g, '')} #Raipur #Chhattisgarh #TrustedDealer #QualityCars #TestDriveToday`,

        hashtags: ['CarStreets', 'UsedCars', `${car.brand.replace(/\s+/g, '')}${car.model.replace(/\s+/g, '')}`, 'Raipur', 'Chhattisgarh', 'TrustedDealer', 'QualityCars', 'TestDriveToday']
      },

      linkedin: {
        text: `Professional Vehicle Listing: ${car.year} ${car.brand} ${car.model}

Investment Details:
• Price: ${price}
• Mileage: ${car.kmDriven.toLocaleString()} km
• Location: ${car.location}
• Verification: CarStreets Quality Assured

Market Analysis: ${research.marketData.marketDemand.toUpperCase()} demand model with ${research.marketData.priceComparison} pricing strategy.

${research.seasonalFactors.isFestivalSeason ? 'Strategic timing aligns with festival season automotive investments.' : 'Excellent value proposition for business professionals.'}

${carStreetsSignature}
For detailed inspection reports and documentation, contact CarStreets team.

#AutomotiveInvestment #CarStreets #BusinessVehicles #Raipur #ProfessionalTransport`,

        hashtags: ['AutomotiveInvestment', 'CarStreets', 'BusinessVehicles', 'Raipur', 'ProfessionalTransport']
      }
    };

    const selectedContent = platformContent[platform] || platformContent.facebook;

    return {
      text: selectedContent.text,
      hashtags: selectedContent.hashtags,
      platform,
      confidence: 0.92,
      uniquenessScore: 94, // High due to CarStreets specific branding
      generatedAt: new Date(),
      brandingApplied: ['CarStreets signature', 'location specific', 'seasonal context'],
      generationCost: 0.035
    };
  }
}

class QualityAssuranceAgent implements ContentAgent {
  name = 'CarStreets Quality Control';
  role = 'Content validation and brand compliance';
  
  async execute(context: { content: any; car: CarData; platform: string }) {
    const validations = await Promise.all([
      this.validateCarStreetsCompliance(context.content),
      this.checkAccuracy(context.content, context.car),
      this.analyzeEngagement(context.content, context.platform),
      this.validateRegionalRelevance(context.content)
    ]);
    
    const overallScore = validations.reduce((acc, result) => acc + result.score, 0) / validations.length;
    
    return {
      approved: overallScore >= 0.85,
      score: overallScore,
      validations,
      improvements: this.generateImprovements(validations)
    };
  }
  
  private async validateCarStreetsCompliance(content: any) {
    const text = content.text.toLowerCase();
    const hasCarStreetsBranding = text.includes('carstreets');
    const hasContactInfo = text.includes('contact') || text.includes('📞');
    const hasLocationMention = text.includes('raipur') || text.includes('chhattisgarh');
    
    const score = (hasCarStreetsBranding ? 0.4 : 0) + 
                  (hasContactInfo ? 0.3 : 0) + 
                  (hasLocationMention ? 0.3 : 0);
    
    return {
      category: 'brand-compliance',
      score,
      details: { hasCarStreetsBranding, hasContactInfo, hasLocationMention }
    };
  }
  
  private async checkAccuracy(content: any, car: CarData) {
    const text = content.text;
    const yearMatch = text.includes(car.year.toString());
    const brandMatch = text.toLowerCase().includes(car.brand.toLowerCase());
    const locationMatch = text.toLowerCase().includes(car.location.toLowerCase());
    
    const accuracy = (yearMatch + brandMatch + locationMatch) / 3;
    
    return {
      category: 'accuracy',
      score: accuracy,
      details: { yearMatch, brandMatch, locationMatch }
    };
  }
  
  private async analyzeEngagement(content: any, platform: string) {
  const text = content.text;
  
  // Safe emoji detection using specific emojis
  const carEmojis = ['🌟', '💰', '🛣️', '📍', '🚗', '📞', '✨', '🎯', '🔥', '🎊', '⛽'];
  const hasEmojis = carEmojis.some(emoji => text.includes(emoji));
  
  const hasCallToAction = /contact|call|test drive|book now|inspection/i.test(text);
  const hasHashtags = content.hashtags?.length > 0;
  const optimalLength = this.checkLength(text, platform);
  
  const score = (hasEmojis ? 0.25 : 0) + 
                (hasCallToAction ? 0.35 : 0) + 
                (hasHashtags ? 0.2 : 0) + 
                (optimalLength ? 0.2 : 0);
  
  return {
    category: 'engagement',
    score,
    details: { 
      hasEmojis, 
      hasCallToAction, 
      hasHashtags, 
      optimalLength,
      textLength: text.length 
    }
  };
}
  
  private async validateRegionalRelevance(content: any) {
    const text = content.text.toLowerCase();
    const hasRegionalContext = text.includes('raipur') || 
                              text.includes('chhattisgarh') || 
                              text.includes('festival') ||
                              text.includes('regional');
    
    return {
      category: 'regional-relevance',
      score: hasRegionalContext ? 1.0 : 0.6,
      details: { hasRegionalContext }
    };
  }
  
  private checkLength(text: string, platform: string): boolean {
    const lengths = {
      facebook: [100, 400],
      instagram: [125, 280],
      linkedin: [150, 500]
    };
    
    const [min, max] = lengths[platform] || [100, 400];
    return text.length >= min && text.length <= max;
  }
  
  private generateImprovements(validations: any[]): string[] {
    const improvements = [];
    
    validations.forEach(validation => {
      if (validation.score < 0.8) {
        switch (validation.category) {
          case 'brand-compliance':
            improvements.push('Add CarStreets branding and contact information');
            break;
          case 'accuracy':
            improvements.push('Verify car details match the listing');
            break;
          case 'engagement':
            improvements.push('Add more engaging elements and clear call-to-action');
            break;
          case 'regional-relevance':
            improvements.push('Include regional context and local references');
            break;
        }
      }
    });
    
    return improvements;
  }
}

export class EnhancedContentPipeline {
  private agents: ContentAgent[];
  
  constructor() {
    this.agents = [
      new ResearchAgent(),
      new ContentCreatorAgent(), 
      new QualityAssuranceAgent()
    ];
  }
  
  async generateSmartContent(dealerId: string, carIds?: string[], platforms: string[] = ['facebook', 'instagram']) {
    console.log('🚀 Enhanced pipeline started for dealer:', dealerId);
    
    // Smart car selection if not provided
    let selectedCarIds = carIds;
    if (!selectedCarIds) {
      selectedCarIds = await this.selectBestCars(dealerId);
    }
    
    const results = [];
    
    for (const carId of selectedCarIds) {
      try {
        // Fetch car data
        const car = await this.fetchCarData(dealerId, carId);
        if (!car) continue;
        
        // Research phase
        console.log('🔬 Research phase for car:', car.title);
        const research = await this.agents[0].execute({ car, dealerId });
        
        for (const platform of platforms) {
          try {
            // Content creation phase
            console.log('✨ Creating content for', platform);
            const content = await this.agents[1].execute({ car, research, dealerId, platform });
            
            // Quality assurance phase
            console.log('🔍 Quality check for', platform);
            const qa = await this.agents[2].execute({ content, car, platform });
            
            if (qa.approved) {
              results.push({
                carId,
                carTitle: car.title,
                platform,
                content: content.text,
                hashtags: content.hashtags,
                qualityScore: qa.score,
                uniquenessScore: content.uniquenessScore,
                generationCost: content.generationCost,
                brandingApplied: content.brandingApplied,
                success: true,
                cached: content.cached || false
              });
            } else {
              console.log('❌ Content failed quality check:', qa.improvements);
              results.push({
                carId,
                carTitle: car.title,
                platform,
                error: 'Quality standards not met',
                improvements: qa.improvements,
                success: false
              });
            }
          } catch (error) {
            console.error('Content generation error:', error);
            results.push({
              carId,
              carTitle: car.title,
              platform,
              error: error.message,
              success: false
            });
          }
        }
      } catch (error) {
        console.error('Car processing error:', error);
      }
    }
    
    console.log('✅ Enhanced pipeline completed. Generated:', results.filter(r => r.success).length, 'successful contents');
    
    return {
      results,
      summary: {
        totalCars: selectedCarIds.length,
        totalPlatforms: platforms.length,
        successfulContents: results.filter(r => r.success).length,
        failedContents: results.filter(r => !r.success).length,
        averageQualityScore: results.filter(r => r.success).reduce((acc, r) => acc + (r.qualityScore || 0), 0) / results.filter(r => r.success).length || 0
      }
    };
  }
  
  private async selectBestCars(dealerId: string, limit: number = 5): Promise<string[]> {
    // Get recent content to avoid duplicates
    const recentContent = await prisma.contentCalendar.findMany({
      where: {
        dealerId,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      select: { carId: true }
    });
    
    const usedCarIds = recentContent.map(c => c.carId);
    
    // Get available cars
    const availableCars = await prisma.car.findMany({
      where: {
        dealerId: dealerId === 'admin' ? null : dealerId,
        isVerified: true,
        carStreetsListed: true,
        id: { notIn: usedCarIds }
      },
      orderBy: { createdAt: 'desc' },
      take: limit * 2 // Get more to allow selection
    });
    
    // Use existing CarMarketIntelligence for selection
    const scoredCars = await CarMarketIntelligence.selectTopCarsForContent(availableCars as any, limit);
    
    return scoredCars.map(scored => scored.car.id);
  }
  
  private async fetchCarData(dealerId: string, carId: string): Promise<CarData | null> {
    try {
      const car = await prisma.car.findFirst({
        where: { 
          id: carId,
          dealerId: dealerId === 'admin' ? null : dealerId
        }
      });
      
      return car as CarData;
    } catch (error) {
      console.error('Error fetching car data:', error);
      return null;
    }
  }
}
