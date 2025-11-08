// app/api/social/instagram/post/route.ts (FULLY SECURED)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';
import { socialPostLimiter } from '@/lib/api-rate-limit';

export async function POST(request: NextRequest) {
  try {
    const { dealerId, contentId, textContent, imageUrl } = await request.json();

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
      );
    }

    // Step 1: Validate dealer exists
    const dealer = await prisma.dealer.findUnique({
      where: { id: dealerId },
      select: {
        id: true,
        subdomain: true,
        metaAccessToken: true,
        facebookPageId: true,
        metaAccessTokenExpiry: true
      }
    });

    if (!dealer) {
      return NextResponse.json(
        { error: 'Dealer not found' },
        { status: 404 }
      );
    }

    // Step 2: Check token expiry
    if (dealer.metaAccessTokenExpiry && 
        new Date(dealer.metaAccessTokenExpiry) < new Date()) {
      return NextResponse.json(
        { error: 'Meta token expired - please reconnect' },
        { status: 401 }
      );
    }

    if (!dealer.metaAccessToken || !dealer.facebookPageId) {
      return NextResponse.json(
        { error: 'Instagram not connected' },
        { status: 400 }
      );
    }

    // Step 3: Validate content ownership
    if (contentId) {
      const content = await prisma.contentCalendar.findUnique({
        where: { id: contentId },
        select: { dealerId: true }
      });

      if (!content || content.dealerId !== dealerId) {
        console.warn(
          `⚠️ SECURITY: Unauthorized Instagram post attempt - Content: ${contentId}, Dealer: ${dealerId}`
        );
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
    }

    // ✅ Step 4: Decrypt token before use (CRITICAL FIX)
    const accessToken = decrypt(dealer.metaAccessToken);

    console.log(`📤 Creating Instagram media for dealer: ${dealer.subdomain}`);

    // Step 5: Create Instagram media (Step 1)
    const createResponse = await fetch(
      `https://graph.instagram.com/v18.0/${dealer.facebookPageId}/media`,
      {
        method: 'POST',
        body: new URLSearchParams({
          image_url: imageUrl,
          caption: textContent,
          access_token: accessToken // ✅ Use decrypted token
        })
      }
    );

    const media = await createResponse.json();

    if (!createResponse.ok) {
      throw new Error(media.error?.message || 'Failed to create media');
    }

    // Step 6: Publish media (Step 2)
    const publishResponse = await fetch(
      `https://graph.instagram.com/v18.0/${dealer.facebookPageId}/media_publish`,
      {
        method: 'POST',
        body: new URLSearchParams({
          creation_id: media.id,
          access_token: accessToken // ✅ Use decrypted token
        })
      }
    );

    const published = await publishResponse.json();

    if (!publishResponse.ok) {
      throw new Error(published.error?.message || 'Failed to publish');
    }

    console.log(`✅ Instagram post successful - Dealer: ${dealer.subdomain}, PostID: ${published.id}`);

    return NextResponse.json({
      success: true,
      postId: published.id,
      platform: 'instagram',
      dealer: dealer.subdomain
    });
  } catch (error) {
    console.error('❌ Instagram error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
