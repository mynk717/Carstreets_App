import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

interface LinkedInPostRequest {
  caption: string
  imageUrl?: string | string[] // Single image (LinkedIn doesn't support carousels natively)
  dealerId?: string
  contentId?: string // Link back to ContentCalendar
  organizationId?: string // Specific LinkedIn organization/company page
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔗 LinkedIn posting API called')

    // Verify authentication using your existing NextAuth system
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { caption, imageUrl, dealerId, contentId, organizationId }: LinkedInPostRequest = await request.json()

    // Get LinkedIn access token from your existing SocialMediaToken table
    const socialToken = await prisma.socialMediaToken.findFirst({
      where: {
        platform: 'linkedin',
        dealerId: dealerId || 'admin',
        expiresAt: { gt: new Date() } // Token not expired
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
        error: 'LinkedIn not connected or token expired',
        action: 'Please reconnect LinkedIn account'
      }, { status: 400 })
    }

    const { accessToken } = socialToken

    // Get LinkedIn user profile (person URN) for posting
    const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    })

    if (!profileResponse.ok) {
      throw new Error('Failed to get LinkedIn profile')
    }

    const profile = await profileResponse.json()
    const personUrn = `urn:li:person:${profile.id}`

    // Determine who is posting (person vs organization)
    let author: { person: string } | { organization: string } = { person: personUrn }
    let authorUrn = personUrn
    
    if (organizationId) {
      // Verify organization access using your existing getLinkedInOrganizations function
      const orgsResponse = await fetch('https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&projection=(elements*(organization~(id,localizedName),roleAssignee~(localizedFirstName,localizedLastName)))', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      })

      if (orgsResponse.ok) {
        const orgsData = await orgsResponse.json()
        const hasAccess = orgsData.elements?.some((element: any) => 
          element.organization?.id === organizationId
        )

        if (hasAccess) {
            const orgUrn = `urn:li:organization:${organizationId}`
          author = { organization: orgUrn }
          authorUrn = orgUrn

        }
      }
    }

    let postResult

    if (imageUrl) {
      // LinkedIn image post (single image only - LinkedIn doesn't support carousels like Instagram)
      const imageToUse = Array.isArray(imageUrl) ? imageUrl[0] : imageUrl

      // Step 1: Upload image to LinkedIn
      const uploadResponse = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner: authorUrn,
            serviceRelationships: [
              {
                relationshipType: 'OWNER',
                identifier: 'urn:li:userGeneratedContent'
              }
            ]
          }
        })
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to register LinkedIn image upload')
      }

      const uploadData = await uploadResponse.json()
      const uploadUrl = uploadData.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl
      const asset = uploadData.value.asset

      // Step 2: Upload the actual image
      const imageResponse = await fetch(imageToUse)
      const imageBuffer = await imageResponse.arrayBuffer()

      const imageUploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: imageBuffer
      })

      if (!imageUploadResponse.ok) {
        throw new Error('Failed to upload image to LinkedIn')
      }

      // Step 3: Create the post with image
      const postResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          author: authorUrn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: caption
              },
              shareMediaCategory: 'IMAGE',
              media: [
                {
                  status: 'READY',
                  description: {
                    text: caption
                  },
                  media: asset,
                  title: {
                    text: 'Car Listing'
                  }
                }
              ]
            }
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
          }
        })
      })

      postResult = await postResponse.json()

      if (!postResponse.ok) {
        throw new Error(`LinkedIn image posting failed: ${postResult.message || postResponse.statusText}`)
      }

    } else {
      // Text-only post
      const postResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          author: authorUrn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: caption
              },
              shareMediaCategory: 'NONE'
            }
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
          }
        })
      })

      postResult = await postResponse.json()

      if (!postResponse.ok) {
        throw new Error(`LinkedIn text posting failed: ${postResult.message || postResponse.statusText}`)
      }
    }

    if (!postResult.id) {
      throw new Error('Failed to publish to LinkedIn')
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
          platform: 'linkedin',
          status: 'posted',
          postedAt: new Date(),
          // Store LinkedIn post ID for future reference
        }
      })
    }

    console.log('✅ LinkedIn post successful:', postResult.id)

    return NextResponse.json({
      success: true,
      platform: 'linkedin',
      postId: postResult.id,
      message: 'Successfully posted to LinkedIn',
      hasImage: !!imageUrl,
      organizationId,
      authorType: organizationId ? 'organization' : 'person'
    })

  } catch (error) {
    console.error('❌ LinkedIn posting failed:', error)
    
    // Update SocialPost with error using your existing schema fields
    try {
      const body = await request.json().catch(() => ({}))
      if (body.contentId) {
        await prisma.socialPost.create({
          data: {
            dealerId: body.dealerId || 'admin',
            platform: 'linkedin',
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
      platform: 'linkedin'
    }, { status: 500 })
  }
}

// GET - Check LinkedIn connection status and available organizations
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
        platform: 'linkedin',
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

    // Get available LinkedIn organizations using your existing function logic
    try {
      const orgsResponse = await fetch('https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&projection=(elements*(organization~(id,localizedName,logoV2(original~:playableStreams))))', {
        headers: {
          'Authorization': `Bearer ${socialToken.accessToken}`,
          'Content-Type': 'application/json',
        }
      })

      const orgsData = await orgsResponse.json()

      return NextResponse.json({
        connected: true,
        token: {
          id: socialToken.id,
          expires: socialToken.expiresAt,
          connectedSince: socialToken.createdAt
          // Note: We don't return accessToken in the response for security
        },
        organizations: orgsData.elements?.map((element: any) => ({
          id: element.organization?.id,
          name: element.organization?.localizedName,
          logoUrl: element.organization?.logoV2?.original?.elements?.[0]?.identifiers?.[0]?.identifier
        })) || []
      })

    } catch (orgError) {
      return NextResponse.json({
        connected: true,
        token: {
          id: socialToken.id,
          expires: socialToken.expiresAt,
          connectedSince: socialToken.createdAt
        },
        organizations: [],
        error: 'Could not fetch organizations'
      })
    }

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check LinkedIn connection'
    }, { status: 500 })
  }
}
