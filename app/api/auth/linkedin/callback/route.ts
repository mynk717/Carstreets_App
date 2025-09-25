import { NextRequest, NextResponse } from "next/server";
import { exchangeLinkedInCode, getLinkedInOrganizations, type OAuthState } from "../../../../lib/social/oauth";
import { verifyAdminAuth } from "../../../../lib/auth/admin";

export async function GET(request: NextRequest) {
  try {
    console.log("🔵 LinkedIn OAuth Callback - Marketing Dime");
    
    const { searchParams } = request.nextUrl;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth errors
    if (error) {
      console.error("❌ LinkedIn OAuth Error:", error);
      return NextResponse.redirect(
        new URL(`/admin/content?error=linkedin_oauth_${error}`, request.url)
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
    console.log("🔄 Exchanging LinkedIn code for access token");
    const tokenData = await exchangeLinkedInCode(code);

    // Get LinkedIn organization pages
    console.log("🔄 Fetching LinkedIn organizations");
    const orgsData = await getLinkedInOrganizations(tokenData.accessToken);

    // Store accounts in your database (implement based on your schema)
    console.log("💾 Storing LinkedIn accounts:", {
      userId: authResult.user?.id,
      dealerId: oauthState.dealerId,
      organizationsCount: orgsData.organizations.length,
      scope: tokenData.scope,
    });

    // TODO: Save to database
    // await saveLinkedInAccounts(authResult.user!.id, oauthState.dealerId, orgsData.organizations, tokenData);

    // Success redirect
    const successParams = new URLSearchParams({
      success: "linkedin_connected",
      organizations: orgsData.organizations.length.toString(),
    });

    return NextResponse.redirect(
      new URL(`${oauthState.redirectUrl}?${successParams.toString()}`, request.url)
    );

  } catch (error) {
    console.error("🚨 LinkedIn OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/admin/content?error=linkedin_oauth_failed", request.url)
    );
  }
}
