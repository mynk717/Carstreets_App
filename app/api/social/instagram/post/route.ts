import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

interface InstagramPostRequest {
  caption: string
  imageUrl: string | string[] // Single image or carousel
  dealerId?: string
  contentId?: string // Link back to ContentCalendar
}

export async function POST(request: NextRequest) {
  try {
    console.log('📸 Instagram posting API called')

    // Verify authentication using your existing NextAuth
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { caption, imageUrl, dealerId, contentId }: InstagramPostRequest = await request.json()

    // Get Instagram access token from your existing SocialMediaToken table
    const socialToken = await prisma.socialMediaToken.findFirst({
      where: {
        platform: 'instagram',
        dealerId: dealerId || 'admin',
        expiresAt: { gt: new Date() } // Token not expired
      }
    })

    if (!socialToken) {
      return NextResponse.json({ 
        error: 'Instagram not connected or token expired',
        action: 'Please reconnect Instagram account'
      }, { status: 400 })
    }

    const { accessToken } = socialToken
    // Use the accessToken directly - there's no platformUserId field in your schema

    // For Instagram, we need to get the Instagram Business Account ID from the access token
    // This requires an additional API call to Facebook Graph API
    const accountResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?fields=instagram_business_account&access_token=${accessToken}`)
    const accountData = await accountResponse.json()
    
    if (!accountData.data || accountData.data.length === 0 || !accountData.data[0].instagram_business_account) {
      throw new Error('No Instagram Business Account found. Please connect an Instagram Business Account to your Facebook Page.')
    }

    const instagramAccountId = accountData.data[0].instagram_business_account.id

    // Handle single image vs carousel posting
    const isCarousel = Array.isArray(imageUrl) && imageUrl.length > 1
    const images = Array.isArray(imageUrl) ? imageUrl : [imageUrl]

    let postResult

    if (isCarousel) {
      // Step 1: Create media containers for each image
      const mediaContainers = []
      for (const image of images) {
        const containerResponse = await fetch(`https://graph.facebook.com/v18.0/${instagramAccountId}/media`, {
          method: 'POST',
          body: new URLSearchParams({
            image_url: image,
            is_carousel_item: 'true',
            access_token: accessToken,
          }),
        })

        if (!containerResponse.ok) {
          throw new Error(`Failed to create media container: ${containerResponse.statusText}`)
        }

        const container = await containerResponse.json()
        mediaContainers.push(container.id)
      }

      // Step 2: Create carousel container
      const carouselResponse = await fetch(`https://graph.facebook.com/v18.0/${instagramAccountId}/media`, {
        method: 'POST',
        body: new URLSearchParams({
          media_type: 'CAROUSEL',
          children: mediaContainers.join(','),
          caption: caption,
          access_token: accessToken,
        }),
      })

      if (!carouselResponse.ok) {
        throw new Error(`Failed to create carousel: ${carouselResponse.statusText}`)
      }

      const carousel = await carouselResponse.json()

      // Step 3: Publish carousel
      const publishResponse = await fetch(`https://graph.facebook.com/v18.0/${instagramAccountId}/media_publish`, {
        method: 'POST',
        body: new URLSearchParams({
          creation_id: carousel.id,
          access_token: accessToken,
        }),
      })

      postResult = await publishResponse.json()

    } else {
      // Single image post
      // Step 1: Create media container
      const containerResponse = await fetch(`https://graph.facebook.com/v18.0/${instagramAccountId}/media`, {
        method: 'POST',
        body: new URLSearchParams({
          image_url: images[0],
          caption: caption,
          access_token: accessToken,
        }),
      })

      if (!containerResponse.ok) {
        throw new Error(`Failed to create media container: ${containerResponse.statusText}`)
      }

      const container = await containerResponse.json()

      // Step 2: Publish media
      const publishResponse = await fetch(`https://graph.facebook.com/v18.0/${instagramAccountId}/media_publish`, {
        method: 'POST',
        body: new URLSearchParams({
          creation_id: container.id,
          access_token: accessToken,
        }),
      })

      postResult = await publishResponse.json()
    }

    if (!postResult.id) {
      throw new Error('Failed to publish to Instagram')
    }

    // Update your existing ContentCalendar table (using correct field names)
    if (contentId) {
      await prisma.contentCalendar.update({
        where: { id: contentId },
        data: {
          status: 'posted',
          // postedAt doesn't exist - use scheduledDate or create SocialPost entry
          scheduledDate: new Date(),
        }
      })

      // Also create a SocialPost entry to track the actual post
      await prisma.socialPost.create({
        data: {
          dealerId: dealerId || 'admin',
          platform: 'instagram',
          status: 'posted',
          postedAt: new Date(),
          // Store Instagram post ID for future reference
        }
      })
    }

    console.log('✅ Instagram post successful:', postResult.id)

    return NextResponse.json({
      success: true,
      platform: 'instagram',
      postId: postResult.id,
      message: 'Successfully posted to Instagram',
      isCarousel,
      imageCount: images.length
    })

  } catch (error) {
    console.error('❌ Instagram posting failed:', error)
    
    // Update SocialPost with error (using correct field names)
    try {
      const { contentId, dealerId } = await request.json().catch(() => ({}))
      if (contentId) {
        await prisma.socialPost.create({
          data: {
            dealerId: dealerId || 'admin',
            platform: 'instagram',
            status: 'failed',
            failureReason: error instanceof Error ? error.message : 'Unknown error'
          }
        })
      }
    } catch (dbError) {
      console.error('Failed to log error to database:', dbError)
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      platform: 'instagram'
    }, { status: 500 })
  }
}

// GET - Check Instagram connection status  
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dealerId = searchParams.get('dealerId') || 'admin'

    const socialToken = await prisma.socialMediaToken.findFirst({
      where: {
        platform: 'instagram',
        dealerId,
        expiresAt: { gt: new Date() }
      },
      select: {
        id: true,
        // platformUserId doesn't exist in your schema
        expiresAt: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      connected: !!socialToken,
      token: socialToken ? {
        id: socialToken.id,
        expires: socialToken.expiresAt,
        connectedSince: socialToken.createdAt
      } : null
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check Instagram connection'
    }, { status: 500 })
  }
}
