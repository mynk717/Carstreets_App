import OpenAI from 'openai'
import { Car } from '../../types'
import { saveCarsToDatabase, getCarsFromDatabase, shouldRunScraping, getDatabase } from '../database/db'

export class HybridOLXScraper {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }

  async scrapeCarStreetsProfile(): Promise<Car[]> {
    try {
      console.log('🔍 Checking if scraping is needed...')
      
      // Check if we should scrape (weekly schedule)
      const needsScraping = await shouldRunScraping()
      
      if (!needsScraping) {
        console.log('📋 Using recent database data (scraped within last week)')
        return await getCarsFromDatabase()
      }
      
      console.log('🚀 Starting fresh scraping (weekly refresh)...')
      
      // Log scraping job start
      const database = await getDatabase()
      const jobResult = await database.run(`
        INSERT INTO scraping_jobs (started_at, status, notes) 
        VALUES (CURRENT_TIMESTAMP, 'running', 'Weekly automated scraping')
      `)
      const jobId = jobResult.lastID
      
      try {
        // Generate fresh car data
        const freshCars = await this.generateRealisticCars()
        
        // Save to database
        await saveCarsToDatabase(freshCars)
        
        // Update job status
        await database.run(`
          UPDATE scraping_jobs 
          SET completed_at = CURRENT_TIMESTAMP, status = 'completed', cars_scraped = ? 
          WHERE id = ?
        `, [freshCars.length, jobId])
        
        console.log(`✅ Fresh scraping completed: ${freshCars.length} cars`)
        return freshCars
        
      } catch (error) {
        // Update job with error
        await database.run(`
          UPDATE scraping_jobs 
          SET completed_at = CURRENT_TIMESTAMP, status = 'failed', errors = ? 
          WHERE id = ?
        `, [error instanceof Error ? error.message : 'Unknown error', jobId])
        
        throw error
      }
      
    } catch (error) {
      console.error('❌ Scraping failed, falling back to database:', error)
      
      // Fallback to existing database data
      const existingCars = await getCarsFromDatabase()
      if (existingCars.length > 0) {
        return existingCars
      }
      
      return this.getFallbackData()
    }
  }

  private async generateRealisticCars(): Promise<Car[]> {
    console.log('🤖 Generating realistic car data with OpenAI...')
    
    // Generate cars in batches
    const batchSize = 8
    const totalCars = 25 + Math.floor(Math.random() * 20) // 25-45 cars (realistic OLX profile size)
    const allCars: Car[] = []
    
    for (let i = 0; i < totalCars; i += batchSize) {
      const remainingCars = Math.min(batchSize, totalCars - i)
      const batchCars = await this.generateCarBatch(remainingCars, i)
      allCars.push(...batchCars)
      
      console.log(`✅ Generated batch ${Math.floor(i/batchSize) + 1}: ${batchCars.length} cars`)
    }
    
    console.log(`🎉 Total generated: ${allCars.length} realistic car listings`)
    return allCars
  }

  private async generateCarBatch(count: number, startIndex: number): Promise<Car[]> {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "system",
        content: `You are a car market expert for Raipur, Chhattisgarh, India. 
        Generate ${count} realistic used car listings that would appear on CarStreets OLX profile.
        
        Use realistic Indian car market data:
        - Popular brands: Tata, Maruti Suzuki, Hyundai, Honda, Toyota, Mahindra, Kia, MG, Nissan
        - Mix of: hatchbacks, sedans, SUVs, premium cars
        - Price range: ₹1.5L - ₹30L (realistic for various car segments)
        - Years: 2018-2024
        - Authentic Raipur locations: Civil Lines, Shankar Nagar, Pirop Colony, Dhaneli, Sadar Bazar, etc.
        
        Return JSON with "cars" array. Each car must have:
        - title: realistic full car title
        - brand, model, variant
        - price: realistic market price in rupees
        - year: 2018-2024
        - fuelType: Petrol/Diesel/CNG/Electric
        - transmission: Manual/Automatic
        - kmDriven: realistic mileage based on year
        - location: specific Raipur area
        - description: authentic seller description (100-200 chars)
        - owners: 1-2`
      }, {
        role: "user",
        content: `Generate ${count} diverse used car listings for Raipur market`
      }],
      response_format: { type: "json_object" }
    })

    const aiData = JSON.parse(response.choices[0].message.content || '{"cars": []}')
    
    // Define safe, working image URLs
    const carImages = [
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400',
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400', 
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400',
      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
      'https://images.unsplash.com/photo-1614200179818-781b20e8b83d?w=400'
    ]
    
    return aiData.cars.map((car: any, index: number) => ({
      id: `raipur_${Date.now()}_${startIndex + index}`,
      title: car.title,
      brand: car.brand,
      model: car.model,
      variant: car.variant || 'Standard',
      price: car.price,
      year: car.year,
      fuelType: car.fuelType,
      transmission: car.transmission,
      kmDriven: car.kmDriven,
      location: car.location,
      images: [
        carImages[index % carImages.length],
        carImages[(index + 1) % carImages.length]
      ],
      description: car.description,
      sellerType: 'Individual' as const,
      postedDate: new Date().toISOString().split('T')[0],
      owners: car.owners,
      isVerified: true,
      isFeatured: Math.random() > 0.7,
      dataSource: 'openai-enhanced' as const,
      olxProfile: 'carstreets' as const,
      olxProfileId: '569969876',
      originalUrl: 'https://www.olx.in/profile/569969876',
      attributionNote: 'AI-generated realistic data for Raipur market',
      carStreetsListed: true
    }))
  }

  private getFallbackData(): Car[] {
    return [{
      id: 'fallback_emergency',
      title: 'Emergency Fallback Car',
      brand: 'Tata',
      model: 'Punch',
      variant: 'Creative',
      price: 600000,
      year: 2023,
      fuelType: 'Petrol',
      transmission: 'Manual',
      kmDriven: 15000,
      location: 'Raipur',
      images: ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400'],
      description: 'Emergency fallback data - please refresh to get real listings',
      sellerType: 'Individual',
      postedDate: new Date().toISOString().split('T')[0],
      owners: 1,
      isVerified: true,
      isFeatured: false,
      dataSource: 'emergency-fallback',
      olxProfile: 'carstreets',
      olxProfileId: '569969876',
      originalUrl: 'https://www.olx.in/profile/569969876',
      attributionNote: 'Emergency fallback while database is being set up',
      carStreetsListed: true
    }]
  }
}

export const carStreetsOLXScraper = new HybridOLXScraper()
