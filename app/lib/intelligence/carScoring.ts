// lib/intelligence/carScoring.ts
import { Car } from '@prisma/client'

interface CarScore {
  car: Car
  score: number
  reasons: string[]
  marketProbability: number
}

export class CarMarketIntelligence {
  private static readonly SCORING_WEIGHTS = {
    priceRange: 0.25,
    popularity: 0.20,
    condition: 0.20,
    verification: 0.15,
    demand: 0.20
  }

  static async scoreCarForMarketing(car: Car): Promise<CarScore> {
    let score = 0
    const reasons: string[] = []
    
    const dataQualityBonus = car.manuallyEdited ? 1 : 0
  
  // 1. Price Range Scoring (using accurate prices!)
  const priceScore = this.calculatePriceScore(car.price, car.brand)
  score += priceScore * this.SCORING_WEIGHTS.priceRange
  if (priceScore > 7) reasons.push('Competitive pricing')
  if (car.manuallyEdited) reasons.push('Price verified by admin')

    // 2. Brand Popularity Score
    const brandScore = this.getBrandPopularityScore(car.brand)
    score += brandScore * this.SCORING_WEIGHTS.popularity
    if (brandScore > 7) reasons.push('Popular brand')

    // 3. Condition Score (KM + Year)
    const conditionScore = this.calculateConditionScore(car.kmDriven, car.year)
    score += conditionScore * this.SCORING_WEIGHTS.condition
    if (conditionScore > 7) reasons.push('Excellent condition')

    // 4. Verification & Trust Score
    const verificationScore = this.getVerificationScore(car)
    score += verificationScore * this.SCORING_WEIGHTS.verification
    if (car.isVerified) reasons.push('Verified listing')

    // 5. Market Demand Score (Based on fuel type, transmission, location)
    const demandScore = this.calculateDemandScore(car)
    score += demandScore * this.SCORING_WEIGHTS.demand
    if (demandScore > 7) reasons.push('High market demand')
  score += dataQualityBonus
    const marketProbability = Math.min(score / 10 * 100, 95) // Cap at 95%

    return {
      car,
      score,
      reasons,
      marketProbability
    }
  }

  private static calculatePriceScore(price: bigint, brand: string): number {
    const priceNum = Number(price)
    const brandMultipliers = {
      'Maruti Suzuki': { min: 200000, max: 800000 },
      'Hyundai': { min: 300000, max: 1200000 },
      'Honda': { min: 400000, max: 1500000 },
      'Toyota': { min: 500000, max: 2000000 }
    }
    
    const range = brandMultipliers[brand] || { min: 200000, max: 1000000 }
    if (priceNum >= range.min && priceNum <= range.max) return 8
    if (priceNum < range.min * 0.8 || priceNum > range.max * 1.2) return 4
    return 6
  }

  private static getBrandPopularityScore(brand: string): number {
    const popularBrands = {
      'Maruti Suzuki': 9,
      'Hyundai': 8,
      'Honda': 8,
      'Toyota': 9,
      'Tata': 7,
      'Mahindra': 7
    }
    return popularBrands[brand] || 5
  }

  private static calculateConditionScore(kmDriven: number, year: number): number {
    const currentYear = new Date().getFullYear()
    const age = currentYear - year
    
    // Lower KM and newer cars score higher
    if (kmDriven < 30000 && age < 3) return 9
    if (kmDriven < 60000 && age < 5) return 8
    if (kmDriven < 100000 && age < 8) return 6
    return 4
  }

  private static getVerificationScore(car: Car): number {
    let score = 5 // Base score
    if (car.isVerified) score += 3
    if (car.isFeatured) score += 2
    if (car.images && Array.isArray(car.images) && car.images.length > 3) score += 1
    return Math.min(score, 10)
  }

  private static calculateDemandScore(car: Car): number {
    let score = 5
    
    // Fuel type preferences
    if (car.fuelType === 'Petrol') score += 2
    if (car.fuelType === 'Diesel') score += 1
    if (car.fuelType === 'CNG') score += 3
    
    // Transmission preferences  
    if (car.transmission === 'Automatic') score += 2
    
    // Location factor (you can customize for your market)
    if (car.location.includes('Raipur')) score += 1
    
    return Math.min(score, 10)
  }

  static async selectTopCarsForContent(cars: Car[], limit: number = 5): Promise<CarScore[]> {
    const scoredCars = await Promise.all(
      cars.map(car => this.scoreCarForMarketing(car))
    )
    
    return scoredCars
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }
}
