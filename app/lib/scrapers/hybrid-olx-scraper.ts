import { normalizeCar } from '@/lib/parsers/car-normalizer'
import OpenAI from 'openai'
import { Car } from '../../types'
import { saveCars, fetchCars } from '../database/db'
import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

// Type definitions for better TypeScript support
type FuelType = 'Petrol' | 'Diesel' | 'CNG' | 'Electric' | 'Hybrid'
type TransmissionType = 'Manual' | 'Automatic' | 'AMT' | 'CVT'
type SellerType = 'Individual' | 'Dealer'
type DataSource = 'olx-carstreets-profile' | 'manual' | 'api'

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

  // ENHANCED: Individual Car Page Scraper for detailed specs
  private async scrapeIndividualCarPage(carUrl: string, browser: any): Promise<any> {
    let page
    try {
      console.log(`🔍 Scraping individual car page: ${carUrl}`)
      
      page = await browser.newPage()
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
      
      await page.goto(carUrl, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      })

      await new Promise(resolve => setTimeout(resolve, 3000))

      const detailedSpecs = await page.evaluate(() => {
        const extractDetailedSpecs = () => {
          const specs: Record<string, any> = {}
          
          // Extract all specification tables and lists
          const specTables = document.querySelectorAll('[data-testid*="spec"], [class*="spec"], .specifications, [class*="detail"]')
          
          specTables.forEach((table: Element) => {
            const rows = table.querySelectorAll('tr, li, div')
            rows.forEach((row: Element) => {
              const text = row.textContent || ''
              
              // Engine specifications
              if (/engine|displacement/i.test(text)) {
                const engineMatch = text.match(/(\d+(?:\.\d+)?)\s*(cc|litre|liter)/i)
                if (engineMatch) specs.engineDisplacement = engineMatch[1]
              }
              
              // Mileage
              if (/mileage|kmpl/i.test(text)) {
                const mileageMatch = text.match(/(\d+(?:\.\d+)?)\s*(kmpl|km\/l)/i)
                if (mileageMatch) specs.mileage = mileageMatch[1]
              }
              
              // Seating capacity
              if (/seat|capacity/i.test(text)) {
                const seatMatch = text.match(/(\d+)\s*seat/i)
                if (seatMatch) specs.seatingCapacity = parseInt(seatMatch[1])
              }
              
              // Body type
              if (/body|type/i.test(text)) {
                const bodyTypes = ['sedan', 'hatchback', 'suv', 'muv', 'coupe', 'convertible', 'wagon']
                const bodyType = bodyTypes.find(type => 
                  text.toLowerCase().includes(type)
                )
                if (bodyType) specs.bodyType = bodyType
              }
              
              // Colors
              if (/color|colour/i.test(text)) {
                const colors = ['white', 'black', 'silver', 'red', 'blue', 'grey', 'gray', 'brown', 'green']
                const color = colors.find(c => 
                  text.toLowerCase().includes(c)
                )
                if (color) specs.color = color
              }
            })
          })
          
          // Extract additional images
          const allImages: string[] = []
          const imageElements = document.querySelectorAll('img')
          
          imageElements.forEach((img: HTMLImageElement) => {
            const src = img.src || img.getAttribute('data-src')
            if (src && (src.includes('apollo.olx.in') || src.includes('apolloimages.olx.in'))) {
              // Convert to high quality
              let cleanUrl = src
              if (cleanUrl.includes(';s=')) {
                cleanUrl = cleanUrl.replace(/;s=\d+x\d+/, ';s=780x0')
              }
              allImages.push(cleanUrl)
            }
          })
          
          specs.additionalImages = Array.from(new Set(allImages)).slice(0, 10)
          
          // Extract seller information
          const sellerSection = document.querySelector('[data-testid*="seller"], [class*="seller"], .seller-info')
          if (sellerSection) {
            const sellerText = sellerSection.textContent || ''
            if (/dealer|showroom/i.test(sellerText)) {
              specs.sellerType = 'Dealer'
            } else {
              specs.sellerType = 'Individual'
            }
            
            // Extract seller location
            const locationMatch = sellerText.match(/(Raipur|Bhilai|Durg|Chhattisgarh)/i)
            if (locationMatch) specs.exactLocation = locationMatch[1]
          }
          // Enhanced KM extraction from detail page
const kmElements = document.querySelectorAll('[data-testid*="km"], [class*="km"], [class*="driven"]');
kmElements.forEach((element: Element) => {
  const text = element.textContent || '';
  const kmMatch = text.match(/(\d+(?:,\d+)*)\s*(?:km|kms)/i);
  if (kmMatch) {
    const km = parseInt(kmMatch[1].replace(/,/g, ''), 10);
    if (km > 100 && km < 500000) {
      specs.actualKmDriven = km;
    }
  }
});

          return specs
        }
        
        return extractDetailedSpecs()
      })

      console.log(`✅ Individual page scraped: ${Object.keys(detailedSpecs).length} additional specs`)
      return detailedSpecs

    } catch (error) {
      console.error(`❌ Individual page scraping failed for ${carUrl}:`, error)
      return {}
    } finally {
      if (page) {
        await page.close()
      }
    }
  }

  // ENHANCED: Advanced Car Specs Parser
  private parseCarSpecs(rawSpecs: string, individualPageData?: any): Record<string, any> {
    const specs: Record<string, any> = {
      // Default values
      engineDisplacement: null,
      mileage: null,
      seatingCapacity: 5,
      bodyType: 'Unknown',
      color: 'Not Specified',
      registrationState: 'CG',
      insuranceValid: 'Unknown',
      ...individualPageData // Merge individual page data
    }

    try {
      // Engine displacement parsing
      const engineMatch = rawSpecs.match(/(\d+(?:\.\d+)?)\s*(cc|litre|liter)/i)
      if (engineMatch) {
        specs.engineDisplacement = `${engineMatch[1]} ${engineMatch[2].toLowerCase()}`
      }

      // Mileage parsing
      const mileageMatch = rawSpecs.match(/(\d+(?:\.\d+)?)\s*(kmpl|km\/l|kilometres)/i)
      if (mileageMatch) {
        specs.mileage = `${mileageMatch[1]} kmpl`
      }

      // Insurance parsing
      if (/insurance/i.test(rawSpecs)) {
        const insuranceMatch = rawSpecs.match(/insurance\s*(valid|expired|comprehensive|third party)/i)
        if (insuranceMatch) {
          specs.insuranceValid = insuranceMatch[1]
        }
      }

      // Registration year parsing
      const regMatch = rawSpecs.match(/registration\s*:?\s*(20\d{2})|registered\s*(20\d{2})/i)
      if (regMatch) {
        specs.registrationYear = parseInt(regMatch[1] || regMatch[2])
      }

      // Advanced parsing from text
      const lowerSpecs = rawSpecs.toLowerCase()

      // Body type detection
      const bodyTypes = {
        'sedan': ['sedan', 'saloon'],
        'hatchback': ['hatchback', 'hatch'],
        'suv': ['suv', 'sport utility', 'utility vehicle'],
        'muv': ['muv', 'multi utility', 'people mover'],
        'coupe': ['coupe', 'coup'],
        'convertible': ['convertible', 'cabriolet'],
        'wagon': ['wagon', 'estate']
      }

      for (const [type, keywords] of Object.entries(bodyTypes)) {
        if (keywords.some(keyword => lowerSpecs.includes(keyword))) {
          specs.bodyType = type
          break
        }
      }

      // Color detection
      const colors = ['white', 'black', 'silver', 'red', 'blue', 'grey', 'gray', 'brown', 'green', 'yellow', 'orange']
      const detectedColor = colors.find(color => lowerSpecs.includes(color))
      if (detectedColor) {
        specs.color = detectedColor
      }

      // Seating capacity
      const seatMatch = rawSpecs.match(/(\d+)\s*seat/i)
      if (seatMatch) {
        specs.seatingCapacity = parseInt(seatMatch[1])
      }

      // Power steering, AC, etc.
      specs.features = {
        powerSteering: /power steering/i.test(rawSpecs),
        airConditioning: /air condition|ac|climate/i.test(rawSpecs),
        powerWindows: /power window/i.test(rawSpecs),
        centralLocking: /central lock/i.test(rawSpecs),
        musicSystem: /music|stereo|audio/i.test(rawSpecs)
      }

    } catch (error) {
      console.error('❌ Specs parsing error:', error)
    }

    return specs
  }

  // REAL OLX SCRAPING - APOLLO IMAGES ONLY with Individual Page Support
  private async scrapeOLXProfile(profileId: string): Promise<any[]> {
    let browser
    
    try {
      console.log(`🔍 Starting REAL OLX scraping for profile: ${profileId}`)
      
      browser = await puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: true
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
      // Load more button handling to get all cars
await page.evaluate(async () => {
  let loadMoreClicks = 0;
  const maxClicks = 3;
  
  while (loadMoreClicks < maxClicks) {
    const loadMoreButton = document.querySelector('[data-aut-id="btnLoadMore"], .loadMore, [class*="load"], [class*="more"], button[class*="load"]');
    
    if (loadMoreButton && loadMoreButton.textContent?.toLowerCase().includes('more')) {
      console.log(`🔄 Clicking load more button (${loadMoreClicks + 1}/${maxClicks})`);
      (loadMoreButton as HTMLElement).click();
      await new Promise(resolve => setTimeout(resolve, 3000));
      loadMoreClicks++;
    } else {
      console.log('🔍 No more "Load More" button found');
      break;
    }
  }
});

      // Enhanced: Extract cars with multiple images and individual page URLs
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
        
        // Enhanced extraction with multiple images and individual URLs
        foundElements.forEach((element, index) => {
          const elementText = element.textContent || ''
          
          if (elementText.length > 800) return
          
          console.log(`Processing element ${index + 1}...`)
          
          const priceMatch = elementText.match(/₹[\s]*([1-9][\d,]{1,10})(?!\d)/)
          if (!priceMatch) return
          
          const price = priceMatch[1]
          
          const yearMatch = elementText.match(/\b(20[17]\d)\b/)
          const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear() - 3
          
          // Extract individual car page URL
          let carPageUrl = ''
          const linkElement = element.querySelector('a[href*="/item/"]') as HTMLAnchorElement
          if (linkElement && linkElement.href) {
            carPageUrl = linkElement.href.startsWith('http') 
              ? linkElement.href 
              : `https://www.olx.in${linkElement.href}`
          }
          
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
            const imgElement2 = imgElement as HTMLImageElement
            const imgSrc = imgElement2.src || imgElement2.getAttribute('data-src') || imgElement2.getAttribute('data-lazy-src')
            
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
            individualPageUrl: carPageUrl, // Individual car page URL for detailed scraping
            extractedAt: new Date().toISOString()
          }
          
          listings.push(carListing)
          console.log(`✅ Car ${index + 1}: ${carListing.title} - ${finalImages.length} images`)
        })
        
        console.log(`🎯 Extracted ${listings.length} car listings with multiple images`)
        return listings
      })
      
      // ENHANCED: Scrape individual car pages for detailed specs (limit to first 5 for performance)
      const enhancedListings = []
      for (let i = 0; i < Math.min(realCarListings.length, 15); i++) {
        const listing = realCarListings[i]
        
        if (listing.individualPageUrl) {
          console.log(`🔍 Scraping individual page ${i + 1}/${Math.min(realCarListings.length, 15)}`)
          const individualPageData = await this.scrapeIndividualCarPage(listing.individualPageUrl, browser)
          
          // Parse and merge specs
          const parsedSpecs = this.parseCarSpecs(listing.specs, individualPageData)
          
          enhancedListings.push({
            ...listing,
            detailedSpecs: parsedSpecs,
            images: [...listing.images, ...(individualPageData.additionalImages || [])].slice(0, 10)
          })
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 2000))
        } else {
          // Just parse basic specs
          const parsedSpecs = this.parseCarSpecs(listing.specs)
          enhancedListings.push({
            ...listing,
            detailedSpecs: parsedSpecs
          })
        }
      }
      
      // Add remaining listings without individual page scraping
      for (let i = 15; i < realCarListings.length; i++) {
        const listing = realCarListings[i]
        const parsedSpecs = this.parseCarSpecs(listing.specs)
        enhancedListings.push({
          ...listing,
          detailedSpecs: parsedSpecs
        })
      }
      
      console.log(`✅ REAL SCRAPING COMPLETED: ${enhancedListings.length} live cars with enhanced specs`)
      return enhancedListings
      
    } catch (error) {
      console.error('❌ Real scraping failed:', error)
      return []
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }

  // Helper function to normalize fuel type
  private normalizeFuelType(fuelType: string): FuelType {
    const normalized = fuelType.toLowerCase()
    if (normalized.includes('diesel')) return 'Diesel'
    if (normalized.includes('cng')) return 'CNG'
    if (normalized.includes('electric')) return 'Electric'
    if (normalized.includes('hybrid')) return 'Hybrid'
    return 'Petrol'
  }

  // Helper function to normalize transmission type
  private normalizeTransmission(transmission: string): TransmissionType {
    const normalized = transmission.toLowerCase()
    if (normalized.includes('automatic')) return 'Automatic'
    if (normalized.includes('amt')) return 'AMT'
    if (normalized.includes('cvt')) return 'CVT'
    return 'Manual'
  }

  // Helper function to normalize seller type
  private normalizeSellerType(sellerType: string): SellerType {
    const normalized = sellerType.toLowerCase()
    if (normalized.includes('dealer') || normalized.includes('showroom')) return 'Dealer'
    return 'Individual'
  }

 private extractKmFromSpecs(specs: string): number {
  const kmPatterns = [
    /(\d+(?:,\d+)*)\s*(?:km|kms|kilometres)/i,
    /driven[:\s]*(\d+(?:,\d+)*)/i,
    /(\d+(?:,\d+)*)\s*kilo/i
  ];
  
  for (const pattern of kmPatterns) {
    const match = specs.match(pattern);
    if (match) {
      const km = parseInt(match[1].replace(/,/g, ''), 10);
      if (!isNaN(km) && km > 100 && km < 500000) {
        return km;
      }
    }
  }
  
  return 50000;
}

  // Updated car data processor with proper type handling
  private async createCarFromRealOLXData(rawCar: any, index: number): Promise<Car> {
    const detailedSpecs = rawCar.detailedSpecs || {}
    
    const rawCarData = {
      id: rawCar.id || `real_${Date.now()}_${index}`,
      title: rawCar.title,
      brand: this.extractBrand(rawCar.title),
      model: this.extractModel(rawCar.title),
      variant: this.extractVariant(rawCar.title) || undefined,
      price: parseInt(rawCar.price.replace(/[^\d]/g, '')) || 0,
      year: rawCar.year,
      fuelType: this.normalizeFuelType(rawCar.fuelType),
      transmission: this.normalizeTransmission(rawCar.transmission),
      kmDriven: detailedSpecs.actualKmDriven || rawCar.kmDriven || this.extractKmFromSpecs(rawCar.specs),
      location: detailedSpecs.exactLocation || rawCar.location,
      images: Array.isArray(rawCar.images) ? rawCar.images : [],
      description: `${this.extractBrand(rawCar.title)} ${this.extractModel(rawCar.title)} available in ${rawCar.location}. 
        ${detailedSpecs.engineDisplacement ? `Engine: ${detailedSpecs.engineDisplacement}. ` : ''}
        ${detailedSpecs.mileage ? `Mileage: ${detailedSpecs.mileage}. ` : ''}
        ${detailedSpecs.color ? `Color: ${detailedSpecs.color}. ` : ''}
        Contact for more details.`,
      sellerType: this.normalizeSellerType(detailedSpecs.sellerType || 'Individual'),
      postedDate: new Date().toISOString().split('T'),
      owners: this.extractOwners(rawCar.title),
      isVerified: true,
      isFeatured: false,
      dataSource: 'olx-carstreets-profile' as DataSource,
      originalUrl: rawCar.originalUrl || 'https://www.olx.in/profile/401445222',
      carStreetsListed: true,
      // Enhanced specs - only add if supported by Car interface
      ...(detailedSpecs.engineDisplacement && { engineDisplacement: detailedSpecs.engineDisplacement }),
      ...(detailedSpecs.mileage && { mileage: detailedSpecs.mileage }),
      ...(detailedSpecs.seatingCapacity && { seatingCapacity: detailedSpecs.seatingCapacity }),
      ...(detailedSpecs.bodyType && { bodyType: detailedSpecs.bodyType }),
      ...(detailedSpecs.color && { color: detailedSpecs.color }),
      ...(detailedSpecs.registrationState && { registrationState: detailedSpecs.registrationState }),
      ...(detailedSpecs.insuranceValid && { insuranceValid: detailedSpecs.insuranceValid }),
      ...(detailedSpecs.features && { features: detailedSpecs.features }),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Use normalizeCar function to ensure database compatibility
    return normalizeCar(rawCarData)
  }

  // Helper functions for data extraction (with proper type handling)
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
    return yearMatch ? parseInt(yearMatch[0], 10) : new Date().getFullYear() - 2
  }

  private extractFuelType(title: string): FuelType {
    return this.normalizeFuelType(title)
  }

  private extractTransmission(title: string): TransmissionType {
    return this.normalizeTransmission(title)
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

  // Updated legacy method with proper type handling
  private async createCarFromOLXData(rawData: any, index: number): Promise<Car> {
    const { brand, model } = this.parseCarTitle(rawData.title)

    let price = 0
    if (rawData.price) {
      const cleanPrice = String(rawData.price).replace(/[₹\s,]/g, '')
      price = parseInt(cleanPrice) || 0
    }

    let carImages: string[] = ['https://apollo.olx.in/v1/files/default-car.jpg']
    
    // RELAXED image validation for debugging - accept ANY reasonable image
    if (Array.isArray(rawData.images)) {
      const validImages = rawData.images.filter((img: string) => 
        img && img.length > 10 && (img.startsWith('http') || img.startsWith('/'))
      )
      if (validImages.length > 0) {
        carImages = validImages.slice(0, 3)
        console.log(`🖼️ Using ${validImages.length} images for car: ${rawData.title}`)
      } else {
        console.log(`⚠️ No valid images found for car: ${rawData.title}`)
      }
    } else if (rawData.images && typeof rawData.images === 'string') {
      if (rawData.images.length > 10 && (rawData.images.startsWith('http') || rawData.images.startsWith('/'))) {
        carImages = [rawData.images]
        console.log(`🖼️ Using single image for car: ${rawData.title}`)
      } else {
        console.log(`⚠️ Invalid image format for car: ${rawData.title}`)
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

    const rawCarData = {
      id: `olx_real_${rawData.id || Date.now()}_${index}`,
      title: String(rawData.title || 'Used Car'),
      brand: brand,
      model: model,
      variant: undefined,
      price: price,
      year: Number(rawData.year) || 2020,
      fuelType: this.normalizeFuelType(rawData.fuelType || 'Petrol'),
      transmission: this.normalizeTransmission(rawData.transmission || 'Manual'),
      kmDriven: parseKmDriven(rawData.kmDriven ?? '0'),
      location: 'Raipur',
      images: carImages,
      description: String(rawData.specs || 'Well maintained car for sale').substring(0, 200),
      sellerType: this.normalizeSellerType('Individual'),
      postedDate: new Date().toISOString().split('T')[0],
      owners: parseOwners(rawData.owners ?? '1'),
      isVerified: true,
      isFeatured: index < 3,
      dataSource: 'olx-carstreets-profile' as DataSource,
      originalUrl: String(rawData.originalUrl || 'https://www.olx.in/profile/401445222'),
      carStreetsListed: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log(`✅ Processing car ${index + 1}: ${rawCarData.title} - ₹${price}`)
    
    // Use normalizeCar function to ensure database compatibility
    return normalizeCar(rawCarData)
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

  // Main scraping method with proper type handling
  async scrapeCarStreetsProfile(): Promise<Car[]> {
    const forceFresh = process.env.FORCE_FRESH_SCRAPE === 'true'
    try {
      if (forceFresh) {
        console.log('🔥 FORCE_FRESH_SCRAPE enabled - bypassing all cache')
        const rawOLXData = await this.scrapeOLXProfile(process.env.OLX_PROFILE_ID || '401445222')
        console.log('🔧 DEBUG: Raw scraped data length:', rawOLXData ? rawOLXData.length : 'null')

        if (rawOLXData && rawOLXData.length > 0) {
          console.log(`✅ Real scraping successful: ${rawOLXData.length} cars found`)
          const processedCars: Car[] = []
          for (let i = 0; i < rawOLXData.length; i++) {
            try {
              const processedCar = await this.createCarFromRealOLXData(rawOLXData[i], i)
              processedCars.push(processedCar)
            } catch (error) {
              console.error(`Error processing car ${i}:`, error)
              continue
            }
          }
          if (processedCars.length > 0) {
            await saveCars(processedCars)
            console.log(`✅ Saved ${processedCars.length} REAL cars to database`)
            return processedCars
          } else {
            console.log('⚠️ No cars could be processed')
            return []
          }
        } else {
          console.log('⚠️ No real cars found from scraping')
          return []
        }
      } else {
        // NORMAL cache logic
        console.log('🔍 CarStreets: Starting real scraping process...')
        
        // Check existing data freshness
        const existingCars = await fetchCars()
        if (existingCars.length > 0) {
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          const latestCar = existingCars[0]
          const carDate = new Date(latestCar.createdAt || latestCar.updatedAt || Date.now())
          const daysSinceUpdate = (Date.now() - carDate.getTime()) / (1000 * 60 * 60 * 24)
          
          console.log(`📅 Latest car date: ${carDate.toISOString()}`)
          console.log(`📊 Days since last update: ${daysSinceUpdate.toFixed(2)}`)
          
          if (carDate > oneWeekAgo) {
            console.log(`🔒 Cache BLOCKING: Using cached data (${daysSinceUpdate.toFixed(2)} days old, < 7 days)`)
            return existingCars.map((car: any, i: number) => normalizeCar(car))
          } else {
            console.log(`✅ Cache ALLOWING: Data is ${daysSinceUpdate.toFixed(2)} days old (> 7 days)`)
          }
        }
        
        console.log('🚀 Starting REAL OLX scraping for profile:', process.env.OLX_PROFILE_ID || '401445222')
        
        // Attempt real scraping with enhanced features
        const rawOLXData = await this.scrapeOLXProfile(process.env.OLX_PROFILE_ID || '401445222')
        console.log('🔧 DEBUG: Raw scraped data length:', rawOLXData ? rawOLXData.length : 'null')

        if (rawOLXData && rawOLXData.length > 0) {
          console.log(`✅ Real scraping successful: ${rawOLXData.length} cars found`)
          
          // Process real scraped data with proper async handling
          const processedCars: Car[] = []
          for (let i = 0; i < rawOLXData.length; i++) {
            try {
              const processedCar = await this.createCarFromRealOLXData(rawOLXData[i], i)
              processedCars.push(processedCar)
            } catch (error) {
              console.error(`Error processing car ${i}:`, error)
              continue
            }
          }
          
          if (processedCars.length > 0) {
            await saveCars(processedCars)
            console.log(`✅ Saved ${processedCars.length} REAL cars to database`)
            return processedCars
          } else {
            console.log('⚠️ No cars could be processed')
            return existingCars.length > 0 ? existingCars.map((car: any) => normalizeCar(car)) : []
          }
        } else {
          console.log('⚠️ No real cars found from scraping')
          return existingCars.length > 0 ? existingCars.map((car: any) => normalizeCar(car)) : []
        }
      }
      
    } catch (error) {
      console.error('❌ Real scraping failed:', error)
      
      // Fallback to existing data if scraping fails
      const existingCars = await fetchCars()
      console.log(`📋 Falling back to existing data: ${existingCars.length} cars`)
      return existingCars.map((car: any) => normalizeCar(car))
    }
  }


  async scrape(): Promise<Car[]> {
    return this.scrapeCarStreetsProfile()
  }
}

export const carStreetsOLXScraper = new HybridOLXScraper()
