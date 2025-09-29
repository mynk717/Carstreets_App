import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fetch from "node-fetch";

// Helper: Post content to Facebook Page
async function postToFacebookPage(pageAccessToken: string, pageId: string, message: string, imageUrl?: string) {
  const url = `https://graph.facebook.com/v17.0/${pageId}/feed`;
  const body: any = {
    message,
    access_token: pageAccessToken,
  };

  if (imageUrl) {
    // Facebook Graph API requires first uploading photos for image posts,
    // for simplicity we post text message here. Image posting logic can be added.
  }

  const res = await fetch(url, {
    method: "POST",
    body: new URLSearchParams(body),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Facebook posting failed: ${JSON.stringify(json)}`);
  }
  return json;
}

// Helper: Post content to Instagram (Facebook Graph API for Instagram Business Account)
async function postToInstagram(igUserAccessToken: string, igUserId: string, caption: string, imageUrl: string) {
  // Instagram Content Publishing requires two steps:
  // 1) Create a media object container
  const createMediaUrl = `https://graph.facebook.com/v17.0/${igUserId}/media`;
  let res = await fetch(createMediaUrl, {
    method: "POST",
    body: new URLSearchParams({
      image_url: imageUrl,
      caption: caption,
      access_token: igUserAccessToken,
    }),
  });
  let json = await res.json();
  if (!res.ok) throw new Error(`Instagram media creation failed: ${JSON.stringify(json)}`);

  const containerId = json.id;

  // 2) Publish the container
  const publishUrl = `https://graph.facebook.com/v17.0/${igUserId}/media_publish`;
  res = await fetch(publishUrl, {
    method: "POST",
    body: new URLSearchParams({
      creation_id: containerId,
      access_token: igUserAccessToken,
    }),
  });
  json = await res.json();
  if (!res.ok) throw new Error(`Instagram publish failed: ${JSON.stringify(json)}`);

  return json;
}

export async function POST() {
  try {
    // 1. Query scheduled content due for posting
    const now = new Date();
    const scheduledContents = await prisma.contentCalendar.findMany({
      where: {
        status: "scheduled",
        scheduledDate: {
          lte: now,
        },
      },
      include: {
        // Include platform tokens if you store them in related tables (adjust accordingly)
        socialMediaToken: true, 
      },
    });

    for (const content of scheduledContents) {
      try {
        if (content.platform === "facebook") {
          // Assume stored Facebook page token & pageId are in content.socialMediaToken
          const pageToken = content.socialMediaToken?.facebookPageAccessToken;
          const pageId = content.socialMediaToken?.facebookPageId;
          if (!pageToken || !pageId) throw new Error("Missing Facebook Page token or ID");

          await postToFacebookPage(pageToken, pageId, content.textContent || "");
        } else if (content.platform === "instagram") {
          const igToken = content.socialMediaToken?.instagramAccessToken;
          const igUserId = content.socialMediaToken?.instagramUserId;
          if (!igToken || !igUserId) throw new Error("Missing Instagram token or User ID");

          if (!content.brandedImage) throw new Error("Instagram post requires brandedImage URL");

          await postToInstagram(igToken, igUserId, content.textContent || "", content.brandedImage);
        } else {
          console.log(`Unsupported platform ${content.platform} for post ID ${content.id}`);
          continue;
        }

        // Update content status to posted
        await prisma.contentCalendar.update({
          where: { id: content.id },
          data: {
            status: "posted",
            postedAt: new Date(),
          },
        });
        console.log(`Content ${content.id} posted successfully on ${content.platform}`);
      } catch (platformError) {
        console.error(`Failed posting content ${content.id} to ${content.platform}:`, platformError);
      }
    }

    return NextResponse.json({ success: true, message: "Scheduled posts processed." });
  } catch (error) {
    console.error("Scheduled posting error:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
