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
    
    // Enhanced stealth
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en', 'hi'] });
      
      delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Array;
      delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Promise;
      delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
      delete (window as any).chrome_asyncScriptInfo;
      delete (window as any).$cdc_asdjflasutopfhvcZLmcfl_;
    })
    
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
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'debug-real-olx.png', fullPage: true })
    console.log('📸 Debug screenshot: debug-real-olx.png')
    
    // Get page content for change detection
    const pageContent = await page.content()
    
    // Check if content changed
    const hasChanged = await this.hasDataChanged(pageContent)
    if (!hasChanged) {
      console.log('📋 No changes detected, using cached data')
      return []
    }
    
    // FIXED CAR EXTRACTION - NO MORE CONCATENATION
    const realCarListings = await page.evaluate(() => {
      console.log('🔍 Starting car extraction...')
      
      const listings: any[] = []
      
      // EXPANDED SELECTORS FOR ALL 41 CARS
      const selectors = [
        '[data-aut-id="itemCard"]',
        '[data-testid*="listing"]',
        '[data-testid*="item"]',
        '.item-card',
        '.ad-card',
        '[class*="ItemCard"]',
        'div[data-aut-id*="item"]',
        // NEW SELECTORS TO CATCH MORE CARS:
        '.EIR5N',                    // OLX specific
        '[class*="listing-card"]',
        '[class*="ad-tile"]', 
        'article[data-aut-id]',
        '.clearfix',                 // Common OLX wrapper
        '[class*="_1YokD2"]',        // OLX dynamic classes
        '[class*="_1AtVbE"]',
        '[class*="UIC86"]',
        '[data-testid="ad-card"]'    // Modern OLX
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
        }).slice(0, 50) // Increased to catch more cars
        
        console.log(`Price-based: ${foundElements.length} elements`)
      }
      
      // FIXED EXTRACTION - SEPARATE PRICE AND YEAR
      foundElements.forEach((element, index) => {
        const elementText = element.textContent || ''
        
        if (elementText.length > 800) return
        
        console.log(`Processing element ${index + 1}...`)
        
        // IMPROVED PRICE EXTRACTION - NO CONCATENATION
        const priceMatch = elementText.match(/₹[\s]*([1-9][\d,]{1,10})(?!\d)/)
        if (!priceMatch) return
        
        const price = priceMatch[1]
        console.log(`Found price: ₹${price}`)
        
        // SEPARATE YEAR EXTRACTION
        const yearMatch = elementText.match(/\b(20[12]\d)\b/)
        const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear() - 3
        console.log(`Found year: ${year}`)
        
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
        
        console.log(`Found title: "${title}"`)
        
        // APOLLO IMAGE EXTRACTION ONLY
        const imageElement = element.querySelector('img')
        let carImage = 'https://apollo.olx.in/v1/files/default-car.jpg' // Default
        
        if (imageElement && imageElement.src) {
          if (imageElement.src.includes('apollo.olx.in') || imageElement.src.includes('apolloimages.olx.in')) {
            carImage = imageElement.src
            console.log(`✅ Found Apollo image: ${carImage}`)
          } else {
            console.log(`⚠️ Skipping non-Apollo image: ${imageElement.src}`)
          }
        }
        
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
          price: price,                    // SEPARATE PRICE
          year: year,                      // SEPARATE YEAR
          kmDriven: kmMatch ? parseInt(kmMatch[1].replace(/,/g, '')) : 50000,
          fuelType: fuelType,
          transmission: transmission,
          images: [carImage], // Only Apollo images
          specs: elementText.substring(0, 200).replace(/\s+/g, ' ').trim(),
          location: 'Raipur',
          originalUrl: window.location.href,
          extractedAt: new Date().toISOString()
        }
        
        listings.push(carListing)
        console.log(`✅ Car ${index + 1}: ${carListing.title} - ₹${carListing.price} - ${carListing.year}`)
      })
      
      console.log(`🎯 Extracted ${listings.length} car listings with Apollo images`)
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


  // Convert scraped data to Car objects
  private createCarFromOLXData(rawData: any, index: number): Car {
    const { brand, model } = this.parseCarTitle(rawData.title)

    // Parse price (remove commas)
    let price = 0
    if (rawData.price) {
      const cleanPrice = String(rawData.price).replace(/[₹\s,]/g, '')
      price = parseInt(cleanPrice) || 0
    }

    // APOLLO-ONLY IMAGE FILTERING
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
      images: carImages, // Only Apollo images
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
      
      // Check for recent data (1 week)
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
