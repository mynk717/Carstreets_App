import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper: Extract subdomain from request URL
function extractSubdomain(request: NextRequest): string | null {
  const pathParts = request.nextUrl.pathname.split("/");
  const dealersIndex = pathParts.indexOf("dealers");
  if (dealersIndex !== -1 && pathParts[dealersIndex + 1]) {
    return pathParts[dealersIndex + 1];
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    console.log('📍 postScheduled route called');

    const subdomain = extractSubdomain(request);

    if (!subdomain) {
      console.error('❌ Missing subdomain');
      return NextResponse.json({ 
        success: false, 
        error: "Missing subdomain" 
      }, { status: 400 });
    }

    console.log(`📍 Processing for subdomain: ${subdomain}`);

    // ✅ Get dealer with social tokens
    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: {
        id: true,
        businessName: true,
        metaAccessToken: true,
        metaAccessTokenExpiry: true,
        facebookPageId: true,
      }
    });

    if (!dealer) {
      console.error(`❌ Dealer not found: ${subdomain}`);
      return NextResponse.json({ 
        success: false,
        error: "Dealer not found" 
      }, { status: 404 });
    }

    console.log(`✅ Dealer found: ${dealer.businessName}`);

    // ✅ Check token expiry
    if (dealer.metaAccessTokenExpiry && new Date(dealer.metaAccessTokenExpiry) < new Date()) {
      console.error('❌ Meta access token expired');
      return NextResponse.json({
        success: false,
        error: "Meta access token expired. Please reconnect Facebook."
      }, { status: 401 });
    }

    if (!dealer.metaAccessToken) {
      console.error('❌ No social media connected');
      return NextResponse.json({
        success: false,
        error: "Social media not connected. Please connect Facebook/Instagram first."
      }, { status: 400 });
    }

    const now = new Date();

    // ✅ Fetch scheduled posts for THIS dealer only
    const scheduledContents = await prisma.contentCalendar.findMany({
      where: {
        dealerId: dealer.id,
        status: "scheduled",
        scheduledDate: { lte: now }
      },
    });

    console.log(`📊 Found ${scheduledContents.length} scheduled posts for ${subdomain}`);

    if (scheduledContents.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No scheduled posts to process",
        processed: 0
      });
    }

    const results = [];
    
    // ✅ Use production URL
    const baseUrl = process.env.PRODUCTION_URL 
      || process.env.NEXTAUTH_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    console.log(`🌐 Using base URL: ${baseUrl}`);

    for (const content of scheduledContents) {
      try {
        console.log(`🚀 Processing post ${content.id} for platform ${content.platform}`);

        let postResult;
        const imageUrl = content.brandedImage || content.originalImage;

        // ✅ Post using dealer-specific social posting routes
        if (content.platform === "facebook") {
          postResult = await fetch(`${baseUrl}/api/social/facebook/post`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dealerId: dealer.id,
              contentId: content.id,
              textContent: content.textContent,
              imageUrl: imageUrl,
            })
          });
        } else if (content.platform === "instagram") {
          postResult = await fetch(`${baseUrl}/api/social/instagram/post`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dealerId: dealer.id,
              contentId: content.id,
              textContent: content.textContent,
              imageUrl: imageUrl,
            })
          });
        } else if (content.platform === "linkedin") {
          postResult = await fetch(`${baseUrl}/api/social/linkedin/post`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dealerId: dealer.id,
              contentId: content.id,
              textContent: content.textContent,
              imageUrl: imageUrl,
            })
          });
        }

        if (postResult && postResult.ok) {
          // ✅ Update status to posted
          await prisma.contentCalendar.update({
            where: { id: content.id },
            data: {
              status: 'posted',
              postedAt: new Date(),
            }
          });

          results.push({
            contentId: content.id,
            platform: content.platform,
            status: 'posted',
            success: true
          });

          console.log(`✅ Successfully posted ${content.id} to ${content.platform}`);
        } else {
          const errorText = postResult ? await postResult.text() : 'Unknown error';
          results.push({
            contentId: content.id,
            platform: content.platform,
            status: 'failed',
            error: errorText,
            success: false
          });

          console.error(`❌ Failed to post ${content.id} to ${content.platform}: ${errorText}`);
        }
      } catch (postError) {
        console.error(`❌ Error processing post ${content.id}:`, postError);
        results.push({
          contentId: content.id,
          platform: content.platform,
          status: 'error',
          error: postError instanceof Error ? postError.message : 'Unknown error',
          success: false
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: true,
      message: `Processed ${scheduledContents.length} scheduled posts`,
      processed: scheduledContents.length,
      successful: successCount,
      failed: scheduledContents.length - successCount,
      results
    });

  } catch (error) {
    console.error("❌ Scheduled posting error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
