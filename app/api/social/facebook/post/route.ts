// app/api/social/facebook/post/route.ts (FULLY FIXED)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/crypto'; // ✅ Imported
import { socialPostLimiter } from '@/lib/api-rate-limit'; // ✅ Add this

export async function POST(request: NextRequest) {
  try {
    const { dealerId, contentId, textContent, imageUrl } = await request.json()

    // ✅ STEP 0: Rate limiting (MUST be first)
    const { success } = await socialPostLimiter.limit(dealerId || 'anonymous');
    if (!success) {
      return NextResponse.json(
        { error: 'Posting too frequently. Please wait before posting again.' },
        { status: 429 }
      );
    }

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

    // ✅ Step 2: Check token expiry
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

    // ✅ Step 3: Validate content ownership
    if (contentId) {
      const content = await prisma.contentCalendar.findUnique({
        where: { id: contentId },
        select: { dealerId: true, carId: true }
      })

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

    // ✅ Step 4: Decrypt token before use (CRITICAL FIX)
    const accessToken = decrypt(dealer.metaAccessToken); // ← FIX: Decrypt!
    
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
          access_token: accessToken // ✅ Use decrypted token
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
