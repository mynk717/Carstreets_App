import { NextRequest, NextResponse } from "next/server";
import { exchangeFacebookCode, getFacebookPages, type OAuthState } from "@/lib/social/oauth";
import { verifyAdminAuth } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  try {
    console.log("🔵 Facebook OAuth Callback - Marketing Dime / Dealer");
    
    const { searchParams } = request.nextUrl;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth errors
    if (error) {
      console.error("❌ Facebook OAuth Error:", error);
      return NextResponse.redirect(
        new URL(`/admin/content?error=facebook_oauth_${error}`, request.url)
      );
    }

    if (!code || !state) {
      console.error("❌ Missing code or state parameter");
      return NextResponse.redirect(
        new URL("/admin/content?error=missing_oauth_params", request.url)
      );
    }

    // Parse state to determine if admin or dealer flow
    let oauthState: OAuthState & { subdomain?: string; flow?: 'admin' | 'dealer' };
    try {
      oauthState = JSON.parse(decodeURIComponent(state));
    } catch {
      console.error("❌ Invalid OAuth state");
      return NextResponse.redirect(
        new URL("/admin/content?error=invalid_state", request.url)
      );
    }

    // Exchange code for access token
    console.log("🔄 Exchanging Facebook code for access token");
    const tokenData = await exchangeFacebookCode(code);

    // Get Facebook pages and Instagram accounts
    console.log("🔄 Fetching Facebook pages and Instagram accounts");
    const pagesData = await getFacebookPages(tokenData.accessToken);

    // Determine flow: Admin or Dealer
    if (oauthState.flow === 'dealer' && oauthState.subdomain) {
      // DEALER FLOW: Save to dealer profile
      console.log("👤 Dealer OAuth Flow for subdomain:", oauthState.subdomain);

      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return NextResponse.redirect(
          new URL("/auth/signin?error=unauthorized", request.url)
        );
      }

      const dealer = await prisma.dealer.findUnique({
        where: { subdomain: oauthState.subdomain },
        select: { id: true, email: true },
      });

      if (!dealer || session.user.email !== dealer.email) {
        return NextResponse.redirect(
          new URL(`/dealers/${oauthState.subdomain}/dashboard/settings?error=forbidden`, request.url)
        );
      }

      // Fetch WhatsApp Business Accounts
      let wabaData: any = null;
      try {
        const wabaResponse = await fetch(
          `https://graph.facebook.com/v18.0/me/businesses?fields=owned_whatsapp_business_accounts{id,name,phone_numbers}&access_token=${tokenData.accessToken}`
        );
        if (wabaResponse.ok) {
          wabaData = await wabaResponse.json();
        }
      } catch (e) {
        console.warn("Could not fetch WABA:", e);
      }

      const waba = wabaData?.data?.[0]?.owned_whatsapp_business_accounts?.data?.[0];
      const phoneNumber = waba?.phone_numbers?.[0];
      const fbPage = pagesData.pages[0];

      // Update dealer profile
      await prisma.dealer.update({
        where: { id: dealer.id },
        data: {
          metaAccessToken: tokenData.accessToken,
          metaAccessTokenExpiry: tokenData.expiresIn
            ? new Date(Date.now() + tokenData.expiresIn * 1000)
            : null,
          whatsappBusinessAccountId: waba?.id || null,
          whatsappBusinessNumber: phoneNumber?.display_phone_number || null,
          whatsappBusinessVerified: phoneNumber?.verified_name ? true : false,
          facebookPageId: fbPage?.id || null,
// facebookCatalogId will be fetched separately if needed
},
      });

      // Determine success message
      const hasWaba = !!waba;
      const hasFbPage = !!fbPage;
      let successMessage = 'meta_connected';
      if (hasWaba && hasFbPage) successMessage = 'all_connected';
      else if (hasWaba) successMessage = 'whatsapp_connected';
      else if (hasFbPage) successMessage = 'facebook_connected';
      else successMessage = 'token_saved';

      return NextResponse.redirect(
        new URL(`/dealers/${oauthState.subdomain}/dashboard/settings?success=${successMessage}`, request.url)
      );

    } else {
      // ADMIN FLOW: Original behavior
      console.log("🔧 Admin OAuth Flow");

      const authResult = await verifyAdminAuth(request);
      if (!authResult.success) {
        console.error("❌ Unauthorized OAuth callback");
        return NextResponse.redirect(
          new URL("/admin/content?error=unauthorized", request.url)
        );
      }

      console.log("💾 Storing Facebook/Instagram accounts:", {
        userId: authResult.user?.id,
        dealerId: oauthState.dealerId,
        pagesCount: pagesData.pages.length,
        hasInstagram: pagesData.pages.some(p => p.instagramBusinessAccount),
      });

      // TODO: Save to database for admin
      // await saveSocialAccounts(authResult.user!.id, oauthState.dealerId, pagesData.pages);

      const successParams = new URLSearchParams({
        success: "facebook_connected",
        pages: pagesData.pages.length.toString(),
        instagram: pagesData.pages.filter(p => p.instagramBusinessAccount).length.toString(),
      });

      return NextResponse.redirect(
        new URL(`${oauthState.redirectUrl}?${successParams.toString()}`, request.url)
      );
    }

  } catch (error) {
    console.error("🚨 Facebook OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/admin/content?error=facebook_oauth_failed", request.url)
    );
  }
}
