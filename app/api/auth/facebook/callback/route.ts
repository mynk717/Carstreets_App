import { NextRequest, NextResponse } from "next/server";
import { exchangeFacebookCode, getFacebookPages, type OAuthState } from "../../../../lib/social/oauth";
import { verifyAdminAuth } from "../../../../lib/auth/admin";

export async function GET(request: NextRequest) {
  try {
    console.log("🔵 Facebook OAuth Callback - Marketing Dime");
    
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

    // Verify admin authentication
    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      console.error("❌ Unauthorized OAuth callback");
      return NextResponse.redirect(
        new URL("/admin/content?error=unauthorized", request.url)
      );
    }

    // Parse state
    let oauthState: OAuthState;
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

    // Store accounts in your database (implement based on your schema)
    console.log("💾 Storing Facebook/Instagram accounts:", {
      userId: authResult.user?.id,
      dealerId: oauthState.dealerId,
      pagesCount: pagesData.pages.length,
      hasInstagram: pagesData.pages.some(p => p.instagramBusinessAccount),
    });

    // TODO: Save to database
    // await saveSocialAccounts(authResult.user!.id, oauthState.dealerId, pagesData.pages);

    // Success redirect
    const successParams = new URLSearchParams({
      success: "facebook_connected",
      pages: pagesData.pages.length.toString(),
      instagram: pagesData.pages.filter(p => p.instagramBusinessAccount).length.toString(),
    });

    return NextResponse.redirect(
      new URL(`${oauthState.redirectUrl}?${successParams.toString()}`, request.url)
    );

  } catch (error) {
    console.error("🚨 Facebook OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/admin/content?error=facebook_oauth_failed", request.url)
    );
  }
}
