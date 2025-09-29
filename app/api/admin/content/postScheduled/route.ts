// app/api/admin/content/postScheduled/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper: Post content to Facebook Page
async function postToFacebookPage(pageAccessToken: string, pageId: string, message: string) {
  const url = `https://graph.facebook.com/v17.0/${pageId}/feed`;
  const body = new URLSearchParams({
    message,
    access_token: pageAccessToken,
  });
  const res = await fetch(url, { method: "POST", body });
  const json = await res.json();
  if (!res.ok) throw new Error(`Facebook posting failed: ${JSON.stringify(json)}`);
  return json;
}

// Helper: Post content to Instagram
async function postToInstagram(igAccessToken: string, igUserId: string, caption: string, imageUrl: string) {
  // Step 1: Create media container
  let res = await fetch(`https://graph.facebook.com/v17.0/${igUserId}/media`, {
    method: "POST",
    body: new URLSearchParams({
      image_url: imageUrl,
      caption,
      access_token: igAccessToken,
    }),
  });
  let json = await res.json();
  if (!res.ok) throw new Error(`Instagram media creation failed: ${JSON.stringify(json)}`);
  const containerId = json.id;

  // Step 2: Publish media container
  res = await fetch(`https://graph.facebook.com/v17.0/${igUserId}/media_publish`, {
    method: "POST",
    body: new URLSearchParams({
      creation_id: containerId,
      access_token: igAccessToken,
    }),
  });
  json = await res.json();
  if (!res.ok) throw new Error(`Instagram publish failed: ${JSON.stringify(json)}`);
  return json;
}

export async function POST() {
  try {
    const now = new Date();
    
    // Fetch scheduled posts from ContentCalendar
    const scheduledContents = await prisma.contentCalendar.findMany({
      where: {
        status: "scheduled",
        scheduledDate: { lte: now },
      },
    });

    console.log(`Found ${scheduledContents.length} scheduled posts to process`);

    for (const content of scheduledContents) {
      try {
        // Fetch social media tokens for this dealer and platform
        const tokens = await prisma.socialMediaToken.findFirst({
          where: {
            dealerId: content.dealerId,
            platform: content.platform,
          },
        });

        if (!tokens) {
          console.error(`No social media tokens found for dealerId=${content.dealerId} and platform=${content.platform}`);
          continue;
        }

        // Check if token is expired
        if (tokens.expiresAt && tokens.expiresAt < now) {
          console.error(`Token expired for dealerId=${content.dealerId} and platform=${content.platform}`);
          continue;
        }

        if (content.platform === "facebook") {
          // For Facebook, we need pageId - you might store this in a separate field or get it from API
          // For now, using accessToken directly (adjust based on your token storage strategy)
          await postToFacebookPage(tokens.accessToken, "your-page-id", content.textContent || "");
        } else if (content.platform === "instagram") {
          if (!content.brandedImage) {
            throw new Error("Instagram post requires a brandedImage URL");
          }
          // For Instagram, we need the Instagram User ID (adjust based on your storage)
          await postToInstagram(tokens.accessToken, "your-ig-user-id", content.textContent || "", content.brandedImage);
        } else {
          console.log(`Unsupported platform ${content.platform} for content ID ${content.id}`);
          continue;
        }

        // Update post status to "posted"
        await prisma.contentCalendar.update({
          where: { id: content.id },
          data: { 
            status: "posted",
            // You could add postedAt field to schema if needed
          },
        });

        // Create a record in SocialPost table for tracking
        await prisma.socialPost.create({
          data: {
            dealerId: content.dealerId,
            platform: content.platform,
            status: "posted",
            postedAt: now,
          },
        });

        console.log(`Content ID ${content.id} posted successfully on ${content.platform}`);
      } catch (postError) {
        console.error(`Posting failed for content ID ${content.id} on platform ${content.platform}:`, postError);
        
        // Update status to failed
        await prisma.contentCalendar.update({
          where: { id: content.id },
          data: { status: "failed" },
        });

        // Record failure in SocialPost table
        await prisma.socialPost.create({
          data: {
            dealerId: content.dealerId,
            platform: content.platform,
            status: "failed",
            failureReason: postError.message,
          },
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${scheduledContents.length} scheduled posts`,
      processed: scheduledContents.length
    });
  } catch (error) {
    console.error("Scheduled posting error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}