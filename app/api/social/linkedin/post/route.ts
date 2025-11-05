import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { dealerId, contentId, textContent, imageUrl } = await request.json()

    if (!dealerId || !textContent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get dealer's LinkedIn token from SocialMediaToken table
    const linkedInToken = await prisma.socialMediaToken.findFirst({
      where: {
        dealerId,
        platform: 'linkedin',
        expiresAt: { gt: new Date() }
      },
      select: { accessToken: true }
    })

    if (!linkedInToken) {
      return NextResponse.json(
        { error: 'LinkedIn not connected' },
        { status: 400 }
      )
    }

    // Validate content ownership
    if (contentId) {
      const content = await prisma.contentCalendar.findUnique({
        where: { id: contentId },
        select: { dealerId: true }
      })
      
      if (!content || content.dealerId !== dealerId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Get LinkedIn profile info
    const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
      headers: { Authorization: `Bearer ${linkedInToken.accessToken}` }
    })

    const profile = await profileResponse.json()

    if (!profileResponse.ok) {
      throw new Error('Failed to fetch LinkedIn profile')
    }

    // Post to LinkedIn
    const postResponse = await fetch(
      'https://api.linkedin.com/v2/ugcPosts',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${linkedInToken.accessToken}`,
          'Content-Type': 'application/json',
          'X-Linkedin-Version': '202312'
        },
        body: JSON.stringify({
          author: `urn:li:person:${profile.id}`,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: { text: textContent },
              shareMediaCategory: 'ARTICLE',
              media: [{ status: 'READY', originalUrl: imageUrl }]
            }
          },
          visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
        })
      }
    )

    const posted = await postResponse.json()

    if (!postResponse.ok) {
      throw new Error(posted.message || 'LinkedIn posting failed')
    }

    console.log(`✅ LinkedIn post successful for dealer ${dealerId}`)

    return NextResponse.json({
      success: true,
      postId: posted.id,
      platform: 'linkedin'
    })

  } catch (error) {
    console.error('❌ LinkedIn posting error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
