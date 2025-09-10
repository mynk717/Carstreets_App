import OpenAI from 'openai'
import { Car } from '../../types'
import { saveCars, fetchCars } from '../database/db'
import puppeteer from 'puppeteer'

export class HybridOLXScraper {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }

  // DETECT CHANGES: Compare current page content with stored hash
  private async hasDataChanged(currentPageContent: string): Promise<boolean> {
    try {
      const relevantContent = currentPageContent
        .match(/₹[\s]*[\d,]+|Mahindra|Hyundai|Maruti|Honda|Toyota|Tata|Renault|20\d{2}/g)
        ?.join('') || ''
      
      const currentHash = this.createSimpleHash(relevantContent)
      const lastHash = process.env.LAST_OLX_CONTENT_HASH || ''
      
      if (currentHash !== lastHash) {
        console.log(`🔄 Content changed! Scraping fresh data...`)
        return true
      }
      
      console.log('📋 Content unchanged, using cached data')
      return false
      
    } catch (error) {
      console.error('❌ Change detection failed:', error)
      return true
    }
  }

  private createSimpleHash(content: string): string {
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString()
  }

  // REAL OLX SCRAPING - APOLLO IMAGES ONLY
private async scrapeOLXProfile(profileId: string): Promise<any[]> {
  let browser
  
  try {
    console.log(`🔍 Starting REAL OLX scraping for profile: ${profileId}`)
    
    browser = await puppeteer.launch({ 
      headless: false, // Debug mode
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor',
        '--disable-web-security'
      ]
    })
    
    const page = await browser.newPage()
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    await page.setViewport({ width: 1366, height: 768 })
    
    console.log(`🌐 Navigating to: https://www.olx.in/profile/${profileId}`)
    
    const response = await page.goto(`https://www.olx.in/profile/${profileId}`, { 
      waitUntil: 'networkidle0',
      timeout: 60000 
    })
    
    if (!response || !response.ok()) {
      throw new Error(`Navigation failed: ${response?.status()}`)
    }
    
    // Wait for content
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // ✨ ENHANCED: Extract cars with multiple images
    const realCarListings = await page.evaluate(() => {
      console.log('🔍 Starting car extraction with multiple images...')
      
      const listings: any[] = []
      
      const selectors = [
        '[data-aut-id="itemCard"]',
        '[data-testid*="listing"]',
        '[data-testid*="item"]',
        '.item-card',
        '.ad-card',
        '[class*="ItemCard"]',
        'div[data-aut-id*="item"]',
        '.EIR5N',
        '[class*="listing-card"]',
        '[class*="ad-tile"]',
        'article[data-aut-id]',
        '.clearfix',
        '[class*="_1YokD2"]',
        '[class*="_1AtVbE"]',
        '[class*="UIC86"]',
        '[data-testid="ad-card"]'
      ]
      
      let foundElements: Element[] = []
      
      for (const selector of selectors) {
        try {
          const elements = Array.from(document.querySelectorAll(selector))
          console.log(`Selector "${selector}": ${elements.length} elements`)
          
          if (elements.length > 0 && elements.length < 50) {
            foundElements = elements
            break
          }
        } catch (e) {
          console.log(`Selector "${selector}" failed`)
        }
      }
      
      if (foundElements.length === 0) {
        console.log('🔄 Trying price-based detection...')
        
        const allElements = Array.from(document.querySelectorAll('div, article, section'))
        foundElements = allElements.filter(el => {
          const text = el.textContent || ''
          return /₹[\s]*[1-9][\d,]{2,}/.test(text) && 
                 text.length < 500 && 
                 text.length > 20
        }).slice(0, 50)
      }
      
      // ✨ NEW: Enhanced extraction with multiple images
      foundElements.forEach((element, index) => {
        const elementText = element.textContent || ''
        
        if (elementText.length > 800) return
        
        console.log(`Processing element ${index + 1}...`)
        
        const priceMatch = elementText.match(/₹[\s]*([1-9][\d,]{1,10})(?!\d)/)
        if (!priceMatch) return
        
        const price = priceMatch[1]
        
        const yearMatch = elementText.match(/\b(20[12]\d)\b/)
        const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear() - 3
        
        // Extract title
        let title = ''
        const titleElement = element.querySelector('[data-aut-id="itemTitle"], h3, h2, .title, [class*="title"]')
        
        if (titleElement && titleElement.textContent) {
          title = titleElement.textContent.trim()
        } else {
          const lines = elementText.split('\n').filter(line => line.trim().length > 0)
          for (const line of lines) {
            if (line.length > 10 && line.length < 100 && 
                /\b(Mahindra|Hyundai|Maruti|Honda|Toyota|Tata|Renault|Ford|Kia|MG|Nissan|20\d{2})\b/i.test(line)) {
              title = line.trim()
              break
            }
          }
        }
        
        if (!title || title.includes('₹') || title.length > 150) return
        
        // ✨ NEW: Extract ALL images from this car listing
        const carImages: string[] = []
        
        // Look for all images in this element
        const imageElements = element.querySelectorAll('img')
        
        imageElements.forEach(imgElement => {
          const imgSrc = imgElement.src || imgElement.getAttribute('data-src') || imgElement.getAttribute('data-lazy-src')
          
          if (imgSrc && (imgSrc.includes('apollo.olx.in') || imgSrc.includes('apolloimages.olx.in'))) {
            // Convert to high quality
            let cleanUrl = imgSrc
            if (cleanUrl.includes(';s=')) {
              cleanUrl = cleanUrl.replace(/;s=\d+x\d+/, ';s=780x0')
            }
            carImages.push(cleanUrl)
          }
        })
        
        // Also check for background images in thumbnails/gallery
        const thumbnailElements = element.querySelectorAll('[class*="thumbnail"], [class*="gallery"], [class*="slider"], [data-testid*="image"]')
        
        thumbnailElements.forEach(thumb => {
          const bgImage = (window as any).getComputedStyle(thumb).backgroundImage
          if (bgImage && bgImage !== 'none') {
            const urlMatch = bgImage.match(/url\(["']?(.*?)["']?\)/)
            if (urlMatch && urlMatch[1] && urlMatch[1].includes('apollo.olx.in')) {
              let cleanUrl = urlMatch[1]
              if (cleanUrl.includes(';s=')) {
                cleanUrl = cleanUrl.replace(/;s=\d+x\d+/, ';s=780x0')
              }
              carImages.push(cleanUrl)
            }
          }
        })
        
        // Remove duplicates and ensure we have images
const uniqueImages = Array.from(new Set(carImages))
        const finalImages = uniqueImages.length > 0 
          ? uniqueImages.slice(0, 8) // Limit to 8 images max
          : ['https://apollo.olx.in/v1/files/default-car.jpg'] // Fallback
        
        // Extract other details
        const kmMatch = elementText.match(/(\d+(?:,\d+)*)\s*(?:km|kms)/i)
        
        let fuelType = 'Petrol'
        if (/diesel/i.test(elementText)) fuelType = 'Diesel'
        else if (/cng/i.test(elementText)) fuelType = 'CNG'
        else if (/electric/i.test(elementText)) fuelType = 'Electric'
        
        const transmission = /automatic|amt|cvt/i.test(elementText) ? 'Automatic' : 'Manual'
        
        const carListing = {
          id: `real_olx_${Date.now()}_${index}`,
          title: title,
          price: price,
          year: year,
          kmDriven: kmMatch ? parseInt(kmMatch[1].replace(/,/g, '')) : 50000,
          fuelType: fuelType,
          transmission: transmission,
          images: finalImages, // ✨ Multiple images array
          specs: elementText.substring(0, 200).replace(/\s+/g, ' ').trim(),
          location: 'Raipur',
          originalUrl: (window as any).location.href,
          extractedAt: new Date().toISOString()
        }
        
        listings.push(carListing)
        console.log(`✅ Car ${index + 1}: ${carListing.title} - ${finalImages.length} images`)
      })
      
      console.log(`🎯 Extracted ${listings.length} car listings with multiple images`)
      return listings
    })
    
    console.log(`✅ REAL SCRAPING COMPLETED: ${realCarListings.length} live cars`)
    return realCarListings
    
  } catch (error) {
    console.error('❌ Real scraping failed:', error)
    return []
  } finally {
    if (browser) {
      await browser.close()
    }
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
      Generate ${count} realistic used car listings with MULTIPLE high-quality images per car.
      
      For images, create realistic Apollo OLX image URLs. Each car should have 3-8 images showing:
      - Front exterior view
      - Side profile  
      - Interior dashboard
      - Rear view
      - Engine bay (for some cars)
      - Interior seats
      - Additional angles
      
      Use realistic Indian car market data:
      - Popular brands: Tata, Maruti Suzuki, Hyundai, Honda, Toyota, Mahindra, Kia, MG, Nissan
      - Price range: ₹1.5L - ₹30L 
      - Years: 2018-2024
      - Locations: Civil Lines, Shankar Nagar, Pirop Colony, Dhaneli, Sadar Bazar
      
      Return JSON with "cars" array. Each car must have:
      - images: array of 3-8 realistic image URLs (use pattern: https://apollo.olx.in/v1/files/[randomID]-IN/image;s=780x0;q=60)
      - title, brand, model, variant, price, year, fuelType, transmission, kmDriven, location, description, owners`
    }, {
      role: "user",
      content: `Generate ${count} diverse used car listings with multiple images each`
    }],
    response_format: { type: "json_object" }
  })

  const aiData = JSON.parse(response.choices[0].message.content || '{"cars": []}')
  
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
    images: Array.isArray(car.images) 
      ? car.images.slice(0, 8) // Ensure max 8 images
      : [
          // Fallback with realistic Apollo URLs
          `https://apollo.olx.in/v1/files/fy${Math.random().toString(36).substr(2, 9)}-IN/image;s=780x0;q=60`,
          `https://apollo.olx.in/v1/files/gh${Math.random().toString(36).substr(2, 9)}-IN/image;s=780x0;q=60`,
          `https://apollo.olx.in/v1/files/kl${Math.random().toString(36).substr(2, 9)}-IN/image;s=780x0;q=60`,
          `https://apollo.olx.in/v1/files/mn${Math.random().toString(36).substr(2, 9)}-IN/image;s=780x0;q=60`
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
    attributionNote: 'AI-generated realistic data with multiple images for Raipur market',
    carStreetsListed: true
  }))
}


  private createCarFromOLXData(rawData: any, index: number): Car {
    const { brand, model } = this.parseCarTitle(rawData.title)

    let price = 0
    if (rawData.price) {
      const cleanPrice = String(rawData.price).replace(/[₹\s,]/g, '')
      price = parseInt(cleanPrice) || 0
    }

    let carImages = ['https://apollo.olx.in/v1/files/default-car.jpg']
    
    if (Array.isArray(rawData.images)) {
      const apolloImages = rawData.images.filter((img: string) => 
        img && (img.includes('apollo.olx.in') || img.includes('apolloimages.olx.in'))
      )
      if (apolloImages.length > 0) {
        carImages = apolloImages.slice(0, 3)
      }
    } else if (rawData.images && typeof rawData.images === 'string') {
      if (rawData.images.includes('apollo.olx.in') || rawData.images.includes('apolloimages.olx.in')) {
        carImages = [rawData.images]
      }
    }

    return {
      id: `olx_real_${rawData.id || Date.now()}_${index}`,
      title: String(rawData.title || 'Used Car'),
      brand: brand,
      model: model,
      variant: undefined,
      price: price,
      year: Number(rawData.year) || 2020,
      fuelType: rawData.fuelType || 'Petrol',
      transmission: rawData.transmission || 'Manual',
      kmDriven: Number(rawData.kmDriven) || 50000,
      location: 'Raipur',
      images: carImages,
      description: String(rawData.specs || 'Well maintained car for sale').substring(0, 200),
      sellerType: 'Individual',
      postedDate: new Date().toISOString().split('T')[0],
      owners: 1,
      isVerified: true,
      isFeatured: index < 3,
      dataSource: 'olx-carstreets-profile',
      olxProfile: 'carstreets',
      olxProfileId: '569969876',
      originalUrl: String(rawData.originalUrl || 'https://www.olx.in/profile/569969876'),
      attributionNote: 'Live data from OLX CarStreets profile',
      carStreetsListed: true
    }
  }

  private parseCarTitle(title: string): { brand: string; model: string } {
    const brands = ['Mahindra', 'Hyundai', 'Maruti', 'Honda', 'Toyota', 'Tata', 'Renault', 'Ford', 'Kia', 'MG', 'Nissan']
    
    let brand = 'Unknown'
    for (const b of brands) {
      if (title.toLowerCase().includes(b.toLowerCase())) {
        brand = b
        break
      }
    }
    
    const words = title.split(' ')
    const model = words[1] || 'Unknown'
    
    return { brand, model }
  }

  async scrapeCarStreetsProfile() {
  try {
    console.log('🔍 CarStreets: Checking scraping schedule...')
    
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
    
    if (isProduction) {
      console.log('🌐 Production detected, using AI-generated data')
      const aiCars = await this.generateRealisticCars()
      await saveCars(aiCars)
      return await fetchCars()
    }
    
    const existingCars = await fetchCars()
    if (existingCars.length > 0) {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const latestCar = existingCars[0]
      const carDate = new Date(latestCar.createdAt || latestCar.updatedAt || Date.now())
      
      if (carDate > oneWeekAgo) {
        console.log('📋 Using cached data (fresh within last week)')
        return existingCars
      }
    }
    
    console.log('🚀 Starting REAL OLX scraping (weekly update)...')
    
    const rawOLXData = await this.scrapeOLXProfile('569969876')
    
    if (rawOLXData.length > 0) {
      console.log('✅ Real scraping successful, processing cars...')
      
      const processedCars = rawOLXData.map((rawCar: any, index: number) => 
        this.createCarFromOLXData(rawCar, index)
      )
      
      await saveCars(processedCars)
      console.log(`✅ Saved ${processedCars.length} REAL cars from OLX (Apollo images only)`)
      return processedCars
    } else {
      console.log('⚠️ No cars found, keeping existing data')
      return existingCars
    }
    
  } catch (error) {
    console.error('❌ CarStreets scraping failed:', error)
    
    const existingCars = await fetchCars()
    return existingCars
  }
}


  async scrape() {
    return this.scrapeCarStreetsProfile()
  }
}

export const carStreetsOLXScraper = new HybridOLXScraper()
