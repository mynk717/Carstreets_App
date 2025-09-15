import { prisma } from '@/lib/prisma'

interface ScrapedCar {
  title: string
  brand: string
  model: string
  variant?: string
  price: bigint | string | number
  year: number
  fuelType: string
  transmission: string
  kmDriven: number
  location: string
  images: string[]
  description?: string
  sellerType: string
  owners: number
  originalUrl?: string
  // Optional fields that may come from scraping
  postedDate?: string
  dataSource?: string
  olxProfile?: string
  olxProfileId?: string
  attribution?: string
  [key: string]: any
}

interface MergeResults {
  preserved: number
  updated: number
  added: number
  removed: number
  errors: number
}

export async function smartMergeScrapedCars(newScrapedCars: ScrapedCar[]): Promise<MergeResults> {
  console.log(`🔄 Starting smart merge of ${newScrapedCars.length} scraped cars...`)
  
  const results: MergeResults = {
    preserved: 0,
    updated: 0,
    added: 0,
    removed: 0,
    errors: 0
  }

  try {
    // Get all existing cars from database (only scraped cars, not user-added)
    const existingCars = await prisma.car.findMany({
      where: {
        isUserAdded: false
      }
    })

    // Create lookup map by originalUrl for fast comparison
    const existingCarsMap = new Map(
      existingCars.map(car => [car.originalUrl, car])
    )

    // Process each scraped car
    for (const scrapedCar of newScrapedCars) {
      try {
        const existingCar = existingCarsMap.get(scrapedCar.originalUrl)
        
        if (!existingCar) {
          // NEW CAR: Add fresh
          await prisma.car.create({
            data: {
              title: scrapedCar.title,
              brand: scrapedCar.brand,
              model: scrapedCar.model,
              variant: scrapedCar.variant || null,
              price: typeof scrapedCar.price === 'bigint' 
                ? scrapedCar.price 
                : BigInt(scrapedCar.price?.toString().replace(/[^\d]/g, '') || '0'),
              year: scrapedCar.year,
              fuelType: scrapedCar.fuelType,
              transmission: scrapedCar.transmission,
              kmDriven: scrapedCar.kmDriven,
              location: scrapedCar.location,
              images: scrapedCar.images,
              description: scrapedCar.description || '',
              sellerType: scrapedCar.sellerType,
              owners: scrapedCar.owners,
              originalUrl: scrapedCar.originalUrl || null,
              // FIXED: Add required fields
              postedDate: scrapedCar.postedDate || new Date().toISOString().split('T')[0], // Default to today
              dataSource: scrapedCar.dataSource || 'olx-scraping', // Default source
              olxProfile: scrapedCar.olxProfile || null,
              olxProfileId: scrapedCar.olxProfileId || null,
              attribution: scrapedCar.attribution || null,
              // Tracking fields
              manuallyEdited: false,
              editedFields: [],
              lastScrapedAt: new Date(),
              isUserAdded: false,
              scrapedData: scrapedCar,
              // Status fields
              isVerified: true,
              isFeatured: false,
              carStreetsListed: false
            }
          })
          results.added++
          console.log(`✅ Added new car: ${scrapedCar.title}`)
          
        } else if (existingCar.manuallyEdited) {
          // MANUALLY EDITED: Preserve user edits, only update non-edited fields
          const editedFieldsList = Array.isArray(existingCar.editedFields) 
            ? existingCar.editedFields as string[]
            : []

          const updateData: any = {
            lastScrapedAt: new Date(),
            scrapedData: scrapedCar
          }

          // Only update fields that user hasn't manually edited
          const protectedFields = ['title', 'price', 'description', 'location', 'images', 'kmDriven', 'year', 'owners', 'brand', 'model', 'variant', 'fuelType', 'transmission']
          
          for (const field of protectedFields) {
            if (!editedFieldsList.includes(field) && scrapedCar[field] !== undefined) {
              if (field === 'price') {
                updateData[field] = typeof scrapedCar.price === 'bigint' 
                  ? scrapedCar.price 
                  : BigInt(scrapedCar.price?.toString().replace(/[^\d]/g, '') || '0')
              } else {
                updateData[field] = scrapedCar[field]
              }
            }
          }

          await prisma.car.update({
            where: { id: existingCar.id },
            data: updateData
          })
          
          results.preserved++
          console.log(`🛡️ Preserved manual edits: ${existingCar.title}`)
          
        } else {
          // NOT EDITED: Safe to update with fresh scraped data
          await prisma.car.update({
            where: { id: existingCar.id },
            data: {
              title: scrapedCar.title,
              brand: scrapedCar.brand,
              model: scrapedCar.model,
              variant: scrapedCar.variant || null,
              price: typeof scrapedCar.price === 'bigint' 
                ? scrapedCar.price 
                : BigInt(scrapedCar.price?.toString().replace(/[^\d]/g, '') || '0'),
              year: scrapedCar.year,
              fuelType: scrapedCar.fuelType,
              transmission: scrapedCar.transmission,
              kmDriven: scrapedCar.kmDriven,
              location: scrapedCar.location,
              images: scrapedCar.images,
              description: scrapedCar.description || '',
              sellerType: scrapedCar.sellerType,
              owners: scrapedCar.owners,
              // FIXED: Update required fields
              postedDate: scrapedCar.postedDate || existingCar.postedDate,
              dataSource: scrapedCar.dataSource || existingCar.dataSource || 'olx-scraping',
              olxProfile: scrapedCar.olxProfile || existingCar.olxProfile,
              olxProfileId: scrapedCar.olxProfileId || existingCar.olxProfileId,
              attribution: scrapedCar.attribution || existingCar.attribution,
              lastScrapedAt: new Date(),
              scrapedData: scrapedCar,
              // Keep existing tracking fields
              manuallyEdited: existingCar.manuallyEdited,
              editedFields: existingCar.editedFields,
              isUserAdded: existingCar.isUserAdded
            }
          })
          results.updated++
          console.log(`🔄 Updated scraped car: ${scrapedCar.title}`)
        }
        
        // Remove from map to track processed cars
        existingCarsMap.delete(scrapedCar.originalUrl)
        
      } catch (error) {
        console.error(`❌ Error processing car ${scrapedCar.title}:`, error)
        results.errors++
      }
    }

    // Handle cars that are no longer in scraped data (removed from OLX)
    const removedCars = Array.from(existingCarsMap.values())
    for (const removedCar of removedCars) {
      try {
        if (removedCar.manuallyEdited || (Array.isArray(removedCar.images) && removedCar.images.length > 0)) {
          // Keep manually edited cars or cars with uploaded images
          await prisma.car.update({
            where: { id: removedCar.id },
            data: {
              dataSource: 'manual-preserved'
            }
          })
          console.log(`🛡️ Preserved removed car with edits: ${removedCar.title}`)
        } else {
          // Safe to remove cars with no manual edits
          await prisma.car.delete({
            where: { id: removedCar.id }
          })
          results.removed++
          console.log(`🗑️ Removed car no longer on OLX: ${removedCar.title}`)
        }
      } catch (error) {
        console.error(`❌ Error handling removed car:`, error)
        results.errors++
      }
    }

  } catch (error) {
    console.error('❌ Smart merge failed:', error)
    results.errors++
  }

  console.log(`✅ Smart merge completed:`, results)
  return results
}
