import { NextRequest } from "next/server";

// Marketing Dime Social Media Configuration
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET!;
const BASE_URL = process.env.NEXTAUTH_URL || "https://your-domain.com";

export interface SocialAccount {
  platform: "facebook" | "instagram" | "linkedin";
  accountId: string;
  accountName: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  permissions: string[];
  isActive: boolean;
}

export interface OAuthState {
  platform: "facebook" | "linkedin";
  redirectUrl: string;
  dealerId?: string;
  userId: string;
}

/**
 * Generate Facebook OAuth URL for Marketing Dime Business Portfolio
 */
export function generateFacebookOAuthUrl(userId: string, dealerId?: string): string {
  const state = encodeURIComponent(JSON.stringify({
    platform: "facebook",
    redirectUrl: "/admin/content",
    dealerId,
    userId,
  } as OAuthState));

  const scopes = [
    "pages_manage_posts",
    "pages_read_engagement", 
    "instagram_basic",
    "instagram_content_publish",
    "business_management",
  ].join(",");

  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID,
    redirect_uri: `${BASE_URL}/api/auth/facebook/callback`,
    scope: scopes,
    response_type: "code",
    state,
  });

  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
}

/**
 * Generate LinkedIn OAuth URL for Marketing Dime Business Page
 */
export function generateLinkedInOAuthUrl(userId: string, dealerId?: string): string {
  const state = encodeURIComponent(JSON.stringify({
    platform: "linkedin",
    redirectUrl: "/admin/content", 
    dealerId,
    userId,
  } as OAuthState));

  const scopes = [
    "w_member_social",
    "w_organization_social",
    "r_organization_social",
    "rw_organization_admin",
  ].join(" ");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: LINKEDIN_CLIENT_ID,
    redirect_uri: `${BASE_URL}/api/auth/linkedin/callback`,
    state,
    scope: scopes,
  });

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

/**
 * Exchange Facebook authorization code for access token
 */
export async function exchangeFacebookCode(code: string): Promise<{
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}> {
  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID,
    client_secret: FACEBOOK_APP_SECRET,
    redirect_uri: `${BASE_URL}/api/auth/facebook/callback`,
    code,
  });

  const response = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?${params.toString()}`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Facebook token exchange failed: ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    accessToken: data.access_token,
    tokenType: data.token_type || "bearer",
    expiresIn: data.expires_in || 3600,
  };
}

/**
 * Exchange LinkedIn authorization code for access token
 */
export async function exchangeLinkedInCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scope: string;
}> {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: LINKEDIN_CLIENT_ID,
    client_secret: LINKEDIN_CLIENT_SECRET,
    redirect_uri: `${BASE_URL}/api/auth/linkedin/callback`,
  });

  const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`LinkedIn token exchange failed: ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    scope: data.scope,
  };
}

/**
 * Get Facebook Pages and Instagram accounts for Marketing Dime
 */
export async function getFacebookPages(accessToken: string): Promise<{
  pages: Array<{
    id: string;
    name: string;
    accessToken: string;
    instagramBusinessAccount?: {
      id: string;
      name: string;
    };
  }>;
}> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,name}&access_token=${accessToken}`,
    {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch Facebook pages: ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    pages: data.data.map((page: any) => ({
      id: page.id,
      name: page.name,
      accessToken: page.access_token,
      instagramBusinessAccount: page.instagram_business_account ? {
        id: page.instagram_business_account.id,
        name: page.instagram_business_account.name,
      } : undefined,
    })),
  };
}

/**
 * Get LinkedIn organization info for Marketing Dime
 */
export async function getLinkedInOrganizations(accessToken: string): Promise<{
  organizations: Array<{
    id: string;
    name: string;
    logoUrl?: string;
  }>;
}> {
  const response = await fetch(
    "https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&projection=(elements*(organization~(id,localizedName,logoV2(original~:playableStreams))))",
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch LinkedIn organizations: ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    organizations: data.elements.map((element: any) => ({
      id: element.organization.id,
      name: element.organization.localizedName,
      logoUrl: element.organization.logoV2?.original?.elements?.[0]?.identifiers?.[0]?.identifier,
    })),
  };
}

/**
 * Validate and refresh access tokens
 */
export async function validateAccessToken(platform: "facebook" | "linkedin", accessToken: string): Promise<{
  isValid: boolean;
  expiresIn?: number;
  error?: string;
}> {
  try {
    if (platform === "facebook") {
      const response = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${accessToken}`);
      return {
        isValid: response.ok,
        error: response.ok ? undefined : "Invalid Facebook token",
      };
    } else if (platform === "linkedin") {
      const response = await fetch("https://api.linkedin.com/v2/me", {
        headers: { "Authorization": `Bearer ${accessToken}` },
      });
      return {
        isValid: response.ok,
        error: response.ok ? undefined : "Invalid LinkedIn token",
      };
    }
  } catch (error) {
    return {
      isValid: false,
      error: `Token validation failed: ${error}`,
    };
  }
  
  return { isValid: false, error: "Unknown platform" };
}
