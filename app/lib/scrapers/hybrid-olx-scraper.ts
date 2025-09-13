import { normalizeCar } from '@/lib/parsers/car-normalizer'
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
        headless: true, // Changed to true for production
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
      
      // Enhanced: Extract cars with multiple images
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

        const parseKm = (km: any) =>
          typeof km === 'number'
            ? km
            : (() => {
                const n = parseInt(String(km).replace(/[^0-9]/g, ''), 10)
                return isNaN(n) ? 50000 : n
              })()

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
        
        // Enhanced extraction with multiple images
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
          
          // Extract ALL images from this car listing
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
            kmDriven: parseKm(kmMatch ? kmMatch[1] : '50000'),
            fuelType: fuelType,
            transmission: transmission,
            images: finalImages, // Multiple images array
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

  // Real car data processor
  private createCarFromRealOLXData(rawCar: any, index: number): Car {
    return {
      id: rawCar.id || `real_${Date.now()}_${index}`,
      title: rawCar.title,
      brand: this.extractBrand(rawCar.title),
      model: this.extractModel(rawCar.title),
      variant: this.extractVariant(rawCar.title) || 'Standard',
      price: parseInt(rawCar.price.replace(/[^\d]/g, '')) || 0,
      year: rawCar.year,
      fuelType: rawCar.fuelType,
      transmission: rawCar.transmission,
      kmDriven: rawCar.kmDriven,
      location: rawCar.location,
      images: rawCar.images || [],
      description: `${this.extractBrand(rawCar.title)} ${this.extractModel(rawCar.title)} available in ${rawCar.location}. Contact for more details.`,
      sellerType: 'Individual' as const,
      postedDate: new Date().toISOString().split('T')[0],
      owners: this.extractOwners(rawCar.title),
      isVerified: true,
      isFeatured: false,
      dataSource: 'olx-carstreets-profile' as const,
      originalUrl: rawCar.originalUrl || 'https://www.olx.in/profile/401445222',
      carStreetsListed: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  // Helper functions for data extraction
  private extractBrand(title: string): string {
    const brands = [
      'Maruti Suzuki', 'Maruti', 'Hyundai', 'Tata', 'Honda', 'Toyota', 
      'Mahindra', 'Ford', 'Renault', 'Nissan', 'Kia', 'MG', 'Skoda', 
      'Volkswagen', 'Chevrolet', 'Datsun'
    ]
    
    const lowerTitle = title.toLowerCase()
    const brand = brands.find(b => lowerTitle.includes(b.toLowerCase()))
    return brand || 'Other'
  }

  private extractModel(title: string): string {
    const words = title.split(' ')
    if (words.length > 1) {
      return words[1] || 'Unknown'
    }
    return 'Unknown'
  }

  private extractVariant(title: string): string | null {
    const variants = ['VXI', 'VXI+', 'VDI', 'LXI', 'ZXI', 'SX', 'EX', 'S', 'E', 'A', 'V', 'XV', 'XZ']
    const upperTitle = title.toUpperCase()
    const variant = variants.find(v => upperTitle.includes(v))
    return variant || null
  }

  private extractYear(title: string): number {
    const yearMatch = title.match(/20[0-9]{2}/)
    return yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear() - 2
  }

  private extractFuelType(title: string): string {
    const lowerTitle = title.toLowerCase()
    if (lowerTitle.includes('diesel')) return 'Diesel'
    if (lowerTitle.includes('cng')) return 'CNG'
    if (lowerTitle.includes('electric')) return 'Electric'
    return 'Petrol'
  }

  private extractTransmission(title: string): string {
    const lowerTitle = title.toLowerCase()
    if (lowerTitle.includes('automatic') || lowerTitle.includes('amt')) return 'Automatic'
    return 'Manual'
  }

  private extractKmDriven(title: string): number {
    const kmMatch = title.match(/(\d+)[,\s]*(\d*)\s*(km|kms|kilometres)/i)
    if (kmMatch) {
      const km = parseInt(kmMatch[1].replace(/,/g, '') + (kmMatch[2] || ''))
      return isNaN(km) ? 50000 : km
    }
    return 50000
  }

  private extractOwners(title: string): number {
    const ownerMatch = title.match(/(\d+)\s*(st|nd|rd|th)?\s*owner/i)
    return ownerMatch ? parseInt(ownerMatch[1]) : 1
  }

  // Legacy method kept for compatibility
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

    const parseKmDriven = (km: string | number): number => {
      if (typeof km === 'number') return km
      const num = parseInt(String(km).replace(/[^0-9]/g, ''), 10)
      return isNaN(num) ? 0 : num
    }

    const parseOwners = (owners: string | number): number => {
      if (typeof owners === 'number') return owners
      const match = String(owners).match(/^(\d+)/)
      return match ? parseInt(match[0], 10) : 1
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
      kmDriven: parseKmDriven(rawData.kmDriven ?? '0'),
      location: 'Raipur',
      images: carImages,
      description: String(rawData.specs || 'Well maintained car for sale').substring(0, 200),
      sellerType: 'Individual',
      postedDate: new Date().toISOString().split('T')[0],
      owners: parseOwners(rawData.owners ?? '1'),
      isVerified: true,
      isFeatured: index < 3,
      dataSource: 'olx-carstreets-profile',
      olxProfile: 'carstreets',
      olxProfileId: '401445222', // Updated profile ID
      originalUrl: String(rawData.originalUrl || 'https://www.olx.in/profile/401445222'),
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

  // Main scraping method
  async scrapeCarStreetsProfile() {
    try {
      console.log('🔍 CarStreets: Starting real scraping process...')
      
      // Check existing data freshness
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
      
      console.log('🚀 Starting REAL OLX scraping for profile: 401445222')
      
      // Attempt real scraping
      const rawOLXData = await this.scrapeOLXProfile('401445222')
      
      if (rawOLXData && rawOLXData.length > 0) {
        console.log(`✅ Real scraping successful: ${rawOLXData.length} cars found`)
        
        // Process real scraped data
        const processedCars = rawOLXData.map((rawCar: any, index: number) => 
          this.createCarFromRealOLXData(rawCar, index)
        )
        
        await saveCars(processedCars)
        console.log(`✅ Saved ${processedCars.length} REAL cars to database`)
        return processedCars
      } else {
        console.log('⚠️ No real cars found from scraping')
        return existingCars.length > 0 ? existingCars : []
      }
      
    } catch (error) {
      console.error('❌ Real scraping failed:', error)
      
      // Fallback to existing data if scraping fails
      const existingCars = await fetchCars()
      console.log(`📋 Falling back to existing data: ${existingCars.length} cars`)
      return existingCars
    }
  }

  async scrape() {
    return this.scrapeCarStreetsProfile()
  }
}

export const carStreetsOLXScraper = new HybridOLXScraper()
