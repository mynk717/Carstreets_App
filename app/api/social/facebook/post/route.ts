import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

interface FacebookPostRequest {
  caption: string
  imageUrl: string | string[] // Single image or carousel
  dealerId?: string
  contentId?: string // Link back to ContentCalendar
  pageId?: string // Specific Facebook page ID
}

export async function POST(request: NextRequest) {
  try {
    console.log('📘 Facebook posting API called')

    // Verify authentication using your existing NextAuth system
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { caption, imageUrl, dealerId, contentId, pageId }: FacebookPostRequest = await request.json()

    // Get Facebook access token from your existing SocialMediaToken table
    const socialToken = await prisma.socialMediaToken.findFirst({
      where: {
        platform: 'facebook',
        dealerId: dealerId || 'admin',
        expiresAt: { gt: new Date() } // Token not expired
      }
    })

    if (!socialToken) {
      return NextResponse.json({ 
        error: 'Facebook not connected or token expired',
        action: 'Please reconnect Facebook account'
      }, { status: 400 })
    }

    const { accessToken } = socialToken

    // Use pageId if provided, otherwise get first available page
    let targetPageId = pageId
    let pageAccessToken = accessToken

    if (!targetPageId) {
      // Get Facebook pages using your existing getFacebookPages function
      const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token&access_token=${accessToken}`)
      const pagesData = await pagesResponse.json()
      
      if (!pagesData.data || pagesData.data.length === 0) {
        return NextResponse.json({
          error: 'No Facebook pages found',
          action: 'Please ensure you have admin access to at least one Facebook page'
        }, { status: 400 })
      }

      // Use the first available page
      targetPageId = pagesData.data[0].id
      pageAccessToken = pagesData.data[0].access_token
    }

    // Handle single image vs carousel posting
    const isCarousel = Array.isArray(imageUrl) && imageUrl.length > 1
    const images = Array.isArray(imageUrl) ? imageUrl : [imageUrl]

    let postResult

    if (isCarousel) {
      // Facebook doesn't support carousel creation via API like Instagram
      // Instead, post the first image with caption mentioning multiple images
      const mainImageUrl = images[0]
      
      const response = await fetch(`https://graph.facebook.com/v18.0/${targetPageId}/photos`, {
        method: 'POST',
        body: new URLSearchParams({
          url: mainImageUrl,
          caption: `${caption}\n\n📸 ${images.length} photos available - Contact us for more details!`,
          access_token: pageAccessToken,
        }),
      })

      postResult = await response.json()

      if (!response.ok) {
        throw new Error(`Facebook posting failed: ${postResult.error?.message || response.statusText}`)
      }

    } else {
      // Single image post
      const response = await fetch(`https://graph.facebook.com/v18.0/${targetPageId}/photos`, {
        method: 'POST',
        body: new URLSearchParams({
          url: images[0],
          caption: caption,
          access_token: pageAccessToken,
        }),
      })

      postResult = await response.json()

      if (!response.ok) {
        throw new Error(`Facebook posting failed: ${postResult.error?.message || response.statusText}`)
      }
    }

    if (!postResult.id && !postResult.post_id) {
      throw new Error('Failed to publish to Facebook')
    }

    // Update your existing ContentCalendar table (using correct field names from your schema)
    if (contentId) {
      await prisma.contentCalendar.update({
        where: { id: contentId },
        data: {
          status: 'posted',
          scheduledDate: new Date(), // Update timestamp
        }
      })

      // Also create a SocialPost entry to track the actual post
      await prisma.socialPost.create({
        data: {
          dealerId: dealerId || 'admin',
          platform: 'facebook',
          status: 'posted',
          postedAt: new Date(),
          // Store Facebook post ID for future reference
        }
      })
    }

    console.log('✅ Facebook post successful:', postResult.id || postResult.post_id)

    return NextResponse.json({
      success: true,
      platform: 'facebook',
      postId: postResult.id || postResult.post_id,
      message: 'Successfully posted to Facebook',
      isCarousel,
      imageCount: images.length,
      pageId: targetPageId
    })

  } catch (error) {
    console.error('❌ Facebook posting failed:', error)
    
    // Update SocialPost with error using your existing schema fields
    try {
      const body = await request.json().catch(() => ({}))
      if (body.contentId) {
        await prisma.socialPost.create({
          data: {
            dealerId: body.dealerId || 'admin',
            platform: 'facebook',
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
      platform: 'facebook'
    }, { status: 500 })
  }
}

// GET - Check Facebook connection status and available pages
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
        platform: 'facebook',
        dealerId,
        expiresAt: { gt: new Date() }
      },
      select: {
        id: true,
        expiresAt: true,
        createdAt: true,
        accessToken: true
      }
    })

    if (!socialToken) {
      return NextResponse.json({
        connected: false,
        token: null
      })
    }

    // Get available Facebook pages
    try {
      const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?fields=id,name&access_token=${socialToken.accessToken}`)
      const pagesData = await pagesResponse.json()

      return NextResponse.json({
        connected: true,
        token: {
          id: socialToken.id,
          expires: socialToken.expiresAt,
          connectedSince: socialToken.createdAt
        },
        pages: pagesData.data || []
      })
    } catch (pageError) {
      return NextResponse.json({
        connected: true,
        token: {
          id: socialToken.id,
          expires: socialToken.expiresAt,
          connectedSince: socialToken.createdAt
        },
        pages: [],
        error: 'Could not fetch pages'
      })
    }

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check Facebook connection'
    }, { status: 500 })
  }
}
