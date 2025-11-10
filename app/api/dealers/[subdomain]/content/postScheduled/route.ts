import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// Helper: Extract subdomain from request URL
function extractSubdomain(request: NextRequest) {
  const pathParts = request.nextUrl.pathname.split("/");
  return pathParts[pathParts.indexOf("dealers") + 1];
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subdomain = extractSubdomain(request);

    // ✅ Get dealer with social tokens (FIXED: removed invalid field)
    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: {
        id: true,
        businessName: true,
        metaAccessToken: true,
        metaAccessTokenExpiry: true,
        facebookPageId: true,
        // ✅ REMOVED: instagramBusinessAccountId (doesn't exist in schema)
      }
    });

    if (!dealer) {
      return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
    }

    // ✅ Verify session user matches dealer
    if (session.user.id !== dealer.id) {
      return NextResponse.json({ error: "Forbidden: Not your dealer" }, { status: 403 });
    }

    // ✅ Check token expiry
    if (dealer.metaAccessTokenExpiry && new Date(dealer.metaAccessTokenExpiry) < new Date()) {
      return NextResponse.json({
        error: "Meta access token expired. Please reconnect Facebook."
      }, { status: 401 });
    }

    if (!dealer.metaAccessToken) {
      return NextResponse.json({
        error: "Social media not connected. Please connect Facebook/Instagram first."
      }, { status: 400 });
    }

    // Optional: Secure cronjob via header
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
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

    console.log(`Found ${scheduledContents.length} scheduled posts for dealer ${subdomain}`);

    const results = [];

    for (const content of scheduledContents) {
      try {
        console.log(`🚀 Processing post ${content.id} for platform ${content.platform}`);

        let postResult;

        // ✅ Post using dealer-specific social posting routes
        if (content.platform === "facebook") {
          postResult = await fetch(`${process.env.NEXTAUTH_URL}/api/social/facebook/post`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dealerId: dealer.id,
              contentId: content.id,
              textContent: content.textContent,
              imageUrl: content.brandedImage || content.originalImage,
            })
          });
        } else if (content.platform === "instagram") {
          postResult = await fetch(`${process.env.NEXTAUTH_URL}/api/social/instagram/post`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dealerId: dealer.id,
              contentId: content.id,
              textContent: content.textContent,
              imageUrl: content.brandedImage || content.originalImage,
            })
          });
        } else if (content.platform === "linkedin") {
          postResult = await fetch(`${process.env.NEXTAUTH_URL}/api/social/linkedin/post`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dealerId: dealer.id,
              contentId: content.id,
              textContent: content.textContent,
              imageUrl: content.brandedImage || content.originalImage,
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
        console.error(`Error processing post ${content.id}:`, postError);
        results.push({
          contentId: content.id,
          platform: content.platform,
          status: 'error',
          error: postError instanceof Error ? postError.message : 'Unknown error',
          success: false
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${scheduledContents.length} scheduled posts`,
      processed: scheduledContents.length,
      results
    });

  } catch (error) {
    console.error("Scheduled posting error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
