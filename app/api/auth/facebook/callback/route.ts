// app/api/auth/facebook/callback/route.ts (MODIFIED for multi-dealer)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { exchangeFacebookCode, getFacebookPages } from '@/lib/social/oauth'
import { encrypt } from '@/lib/crypto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        new URL(`/dealers/error?error=${error}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dealers/error?error=missing_params', request.url)
      )
    }

    // Parse state to determine dealer
    let oauthState: { subdomain: string; dealerId: string }
    try {
      oauthState = JSON.parse(decodeURIComponent(state))
    } catch {
      return NextResponse.redirect(
        new URL('/dealers/error?error=invalid_state', request.url)
      )
    }

    const { subdomain, dealerId } = oauthState

    // Verify dealer exists and is requesting
    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: { id: true, email: true }
    })

    if (!dealer || dealer.id !== dealerId) {
      return NextResponse.redirect(
        new URL(
          `/dealers/${subdomain}/dashboard/settings?error=unauthorized`,
          request.url
        )
      )
    }

    // Exchange code for token (using Marketing Dime app)
    const tokenData = await exchangeFacebookCode(code)

    // Get Facebook pages and Instagram accounts
    const pagesData = await getFacebookPages(tokenData.accessToken)

    if (!pagesData.pages || pagesData.pages.length === 0) {
      return NextResponse.redirect(
        new URL(
          `/dealers/${subdomain}/dashboard/settings?error=no_pages`,
          request.url
        )
      )
    }

    const fbPage = pagesData.pages[0]

    // ✅ CRITICAL: Store token + page info at DEALER level only
    await prisma.dealer.update({
      where: { id: dealer.id },
      data: {
        // Token from Marketing Dime app
        metaAccessToken: encrypt(tokenData.accessToken),
        metaAccessTokenExpiry: tokenData.expiresIn
          ? new Date(Date.now() + tokenData.expiresIn * 1000)
          : null,

        // Dealer's specific page IDs
        facebookPageId: fbPage.id, // THIS dealer's page
        // Instagram will be fetched when posting if available

        // Timestamp for audit
        updatedAt: new Date()
      }
    })

    console.log(`✅ Dealer ${subdomain} connected to Facebook`)

    return NextResponse.redirect(
      new URL(
        `/dealers/${subdomain}/dashboard/settings?success=meta_connected`,
        request.url
      )
    )
  } catch (error) {
    console.error('Facebook OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/dealers/error?error=oauth_failed', request.url)
    )
  }
}
