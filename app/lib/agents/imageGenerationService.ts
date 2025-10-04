import { prisma } from '@/lib/prisma'

export interface CarData {
  id: string
  brand: string
  model: string
  year: number
  price: number
  images?: string[]
}

export interface ImageGenerationResult {
  success: boolean
  imageUrl?: string
  originalImages: string[]
  cost: number
  platform: string
  promptUsed: string
  error?: string
  model?: string
  certification?: string
}

export class ImageGenerationService {
  private baseUrl: string

  constructor() {
    // Use your existing structure - detected from your codebase
    this.baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
  }

  /**
   * Generate branded images using your existing fal.ai nano-banana API
   * This coordinates with your existing app/api/admin/thumbnails endpoint
   */
  async generateContentImages(
    carData: CarData, 
    platforms: string[] = ['instagram', 'facebook', 'linkedin']
  ): Promise<{
    carId: string
    images: ImageGenerationResult[]
    totalCost: number
    success: boolean
    error?: string
  }> {
    try {
      console.log('🎨 ImageGenerationService: Using existing fal.ai API for platforms:', platforms)

      // Get car data from database (matches your existing pattern)
      const carRecord = await prisma.car.findUnique({
        where: { id: carData.id },
        select: {
          images: true,
          brand: true,
          model: true,
          year: true,
          price: true
        }
      })

      if (!carRecord) {
        throw new Error(`Car ${carData.id} not found in database`)
      }

      // Handle Prisma JSON field properly
let imageUrls: string[] = []

// Parse the images field based on its type
if (carRecord.images) {
  if (Array.isArray(carRecord.images)) {
    imageUrls = carRecord.images as string[]
  } else if (typeof carRecord.images === 'string') {
    try {
      // Try to parse if it's a JSON string
      const parsed = JSON.parse(carRecord.images)
      imageUrls = Array.isArray(parsed) ? parsed : [carRecord.images]
    } catch {
      // If parsing fails, treat as single image URL
      imageUrls = [carRecord.images]
    }
  }
} else if (carData.images) {
  imageUrls = Array.isArray(carData.images) ? carData.images : [carData.images]
}

if (imageUrls.length === 0) {
  console.warn('No images available for car, will generate text-only content')
  return {
    carId: carData.id,
    images: platforms.map(platform => ({
      success: false,
      originalImages: [],
      cost: 0,
      platform,
      promptUsed: 'No images available',
      error: 'No source images for nano-banana generation'
    })),
    totalCost: 0,
    success: false,
    error: 'No source images available'
  }
}


      // Generate images for each platform using your EXISTING thumbnails API
      const imagePromises = platforms.map(async (platform): Promise<ImageGenerationResult> => {
        try {
          console.log(`🎨 Calling your existing API for ${platform}: ${carRecord.year} ${carRecord.brand} ${carRecord.model}`)

          // Call your existing thumbnails API (matches your current implementation)
          const response = await fetch(`${this.baseUrl}/api/admin/thumbnails`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // No auth header - your API will handle session validation
            },
            body: JSON.stringify({
              // Match your existing API structure from image-studio
              carData: {
                id: carData.id,
                make: carRecord.brand,  // Using 'make' to match your existing API
                model: carRecord.model,
                year: carRecord.year,
                price: Number(carRecord.price)
              },
              platform,
              style: 'professional-automotive'  // Matches your existing options
            })
          })

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Thumbnails API failed: ${response.status} - ${errorText}`)
          }

          const result = await response.json()

          return {
            success: result.success || false,
            imageUrl: result.imageUrl,
            originalImages: result.originalImages || imageUrls,
            cost: result.cost || 0.039, // fal.ai nano-banana cost
            platform,
            promptUsed: result.promptUsed || result.prompt || 'Generated via existing API',
            model: result.model || 'fal-ai/nano-banana/edit',
            certification: result.certification
          }

        } catch (error) {
          console.error(`❌ ImageGenerationService failed for ${platform}:`, error)
          
          return {
            success: false,
            originalImages: imageUrls,
            cost: 0,
            platform,
            promptUsed: 'Error occurred during generation',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })

      const images = await Promise.all(imagePromises)
      const totalCost = images.reduce((sum, img) => sum + img.cost, 0)
      const successCount = images.filter(img => img.success).length

      console.log(`✅ ImageGenerationService completed: ${successCount}/${images.length} successful, cost: $${totalCost.toFixed(3)}`)

      return {
        carId: carData.id,
        images,
        totalCost,
        success: successCount > 0
      }

    } catch (error) {
      console.error('❌ ImageGenerationService failed:', error)
      
      return {
        carId: carData.id,
        images: platforms.map(platform => ({
          success: false,
          originalImages: carData.images || [],
          cost: 0,
          platform,
          promptUsed: 'Service error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })),
        totalCost: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Check if your existing fal.ai service is available
   */
  async checkServiceHealth(): Promise<{
    available: boolean
    model: string
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/thumbnails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carData: {
            id: 'health-check',
            make: 'Test',
            model: 'Car',
            year: 2020,
            price: 500000
          },
          platform: 'instagram',
          style: 'professional-automotive'
        })
      })

      return {
        available: response.ok,
        model: 'fal-ai/nano-banana/edit',
        error: response.ok ? undefined : `Service unavailable: ${response.status}`
      }

    } catch (error) {
      return {
        available: false,
        model: 'fal-ai/nano-banana/edit',
        error: error instanceof Error ? error.message : 'Health check failed'
      }
    }
  }
}

export default ImageGenerationService
