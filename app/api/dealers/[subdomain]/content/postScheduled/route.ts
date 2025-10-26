// app/api/admin/content/postScheduled/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/[...nextauth]";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/[...nextauth]";


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

export async function POST(request: Request) {
const session = await getServerSession(authOptions, request);
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
const dealer = await prisma.dealer.findFirst({
  where: { dealerId: dealer.id,  subdomain: params.subdomain, userId: session.user.id }
});
if (!dealer) {
  return NextResponse.json({ error: "Forbidden: Not your dealer" }, { status: 403 });
}

  try {
    // Vercel automatically adds this header for cron jobs
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Only check auth if CRON_SECRET is set (for security)
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
    }
    const now = new Date();
    
    // Fetch scheduled posts from ContentCalendar
    const scheduledContents = await prisma.contentCalendar.findMany({
      where: { dealerId: dealer.id, 
        status: "scheduled",
        scheduledDate: { lte: now },
      },
    });

    console.log(`Found ${scheduledContents.length} scheduled posts to process`);

    for (const content of scheduledContents) {
      try {
        console.log(`🚀 Processing post ${content.id} for platform ${content.platform}`);

        // ✅ USE ENVIRONMENT VARIABLES INSTEAD OF DATABASE
        if (content.platform === "facebook") {
          const fbPageId = process.env.FACEBOOK_PAGE_ID;
          const fbAccessToken = process.env.FACEBOOK_ACCESS_TOKEN;
          
          if (!fbPageId || !fbAccessToken) {
            console.error('❌ Facebook credentials missing in environment variables');
            continue;
          }
          
          // Post to Facebook using environment variables
          await postToFacebookPage(fbAccessToken, fbPageId, content.textContent);
        }
        
        else if (content.platform === "instagram") {
          const igUserId = process.env.INSTAGRAM_USER_ID;
          const igAccessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
          
          if (!igUserId || !igAccessToken) {
            console.error('❌ Instagram credentials missing in environment variables');
            continue;
          }
          
          // Post to Instagram using environment variables
          await postToInstagram(igAccessToken, igUserId, content.textContent, content.brandedImage);
        }

        // ✅ UPDATE STATUS TO POSTED
        await prisma.contentCalendar.update({
          where: { dealerId: dealer.id,  id: content.id },
          data: { dealerId: dealer.id,  status: "posted" },
        });

        console.log(`✅ Successfully posted and updated ${content.id}`);

      } catch (postError) {
        console.error(`❌ Error processing post ${content.id}:`, postError);
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