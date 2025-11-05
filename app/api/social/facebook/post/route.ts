// app/api/social/facebook/post/route.ts (REVISED)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { dealerId, contentId, textContent, imageUrl } = await request.json()

    if (!dealerId || !textContent || !imageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // ✅ Step 1: Validate dealer exists
    const dealer = await prisma.dealer.findUnique({
      where: { id: dealerId },
      select: {
        id: true,
        subdomain: true,
        metaAccessToken: true,
        facebookPageId: true,
        metaAccessTokenExpiry: true
      }
    })

    if (!dealer) {
      return NextResponse.json(
        { error: 'Dealer not found' },
        { status: 404 }
      )
    }

    // ✅ Step 2: Check token expiry (crucial with shared app)
    if (dealer.metaAccessTokenExpiry && 
        new Date(dealer.metaAccessTokenExpiry) < new Date()) {
      return NextResponse.json(
        { error: 'Facebook token expired - please reconnect' },
        { status: 401 }
      )
    }

    if (!dealer.metaAccessToken || !dealer.facebookPageId) {
      return NextResponse.json(
        { error: 'Facebook not connected for this dealer' },
        { status: 400 }
      )
    }

    // ✅ Step 3: Validate content ownership (CRITICAL for multi-dealer)
    if (contentId) {
      const content = await prisma.contentCalendar.findUnique({
        where: { id: contentId },
        select: { dealerId: true, carId: true }
      })

      // Double-check: content must belong to THIS dealer
      if (!content || content.dealerId !== dealerId) {
        console.warn(
          `⚠️ SECURITY: Attempt to post content from wrong dealer. 
           Content: ${contentId}, Requesting Dealer: ${dealerId}`
        )
        return NextResponse.json(
          { error: 'Forbidden - content does not belong to this dealer' },
          { status: 403 }
        )
      }
    }

    // ✅ Step 4: Post to Facebook with dealer's token
    console.log(
      `📤 Posting to Facebook for dealer: ${dealer.subdomain} 
       (Page: ${dealer.facebookPageId})`
    )

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${dealer.facebookPageId}/photos`,
      {
        method: 'POST',
        body: new URLSearchParams({
          url: imageUrl,
          caption: textContent,
          access_token: dealer.metaAccessToken // ✅ DEALER'S token, not global
        })
      }
    )

    const result = await response.json()

    if (!response.ok) {
      console.error(
        `❌ Facebook posting failed for ${dealer.subdomain}:`,
        result.error
      )
      return NextResponse.json(
        { error: result.error?.message || 'Facebook posting failed' },
        { status: 400 }
      )
    }

    console.log(
      `✅ Successfully posted to Facebook - Dealer: ${dealer.subdomain}, 
       PostID: ${result.id}`
    )

    return NextResponse.json({
      success: true,
      postId: result.id,
      platform: 'facebook',
      dealer: dealer.subdomain
    })
  } catch (error) {
    console.error('❌ Facebook posting error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
