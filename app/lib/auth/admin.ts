import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]/route";

// Marketing Dime Admin Configuration
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "shukla.mayank247@gmail.com";
const COMPANY_NAME = process.env.COMPANY_NAME || "Marketing Dime";
const LEGACY_TOKEN = "admin-temp-key"; // For backwards compatibility during migration

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    company: string;
  };
  error?: string;
}

/**
 * Verify admin authentication using NextAuth session
 * This replaces the old Bearer token system
 */
export async function verifyAdminAuth(request: NextRequest): Promise<AuthResult> {
  try {
    console.log("🔐 Marketing Dime Auth Check:", {
      method: request.method,
      url: request.nextUrl.pathname,
      hasAuthHeader: !!request.headers.get("authorization"),
    });

    // Try NextAuth session first (modern auth)
    const session = await getServerSession(authOptions);
    if (session?.user?.email === ADMIN_EMAIL) {
      console.log("✅ NextAuth session valid for:", session.user.email);
      return {
        success: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name || "Mayank",
          role: "admin",
          company: COMPANY_NAME,
        },
      };
    }

    // Fallback to legacy Bearer token (for migration period)
    const authHeader = request.headers.get("authorization");
    if (authHeader === `Bearer ${LEGACY_TOKEN}`) {
      console.log("⚠️ Legacy token auth (migrate to NextAuth soon)");
      return {
        success: true,
        user: {
          id: "1",
          email: ADMIN_EMAIL,
          name: "Mayank",
          role: "admin",
          company: COMPANY_NAME,
        },
      };
    }

    console.log("❌ Authentication failed - no valid session or token");
    return {
      success: false,
      error: "Invalid or missing authentication",
    };
  } catch (error) {
    console.error("🚨 Auth verification error:", error);
    return {
      success: false,
      error: "Authentication verification failed",
    };
  }
}

/**
 * Create auth headers for internal API calls
 * Use NextAuth session when available, fallback to Bearer token
 */
export function createAuthHeaders(): HeadersInit {
  return {
    "Authorization": `Bearer ${LEGACY_TOKEN}`,
    "Content-Type": "application/json",
    "X-Company": COMPANY_NAME,
    "X-Admin-Email": ADMIN_EMAIL,
  };
}

/**
 * Validate legacy admin token (backwards compatibility)
 */
export function isValidAdminToken(token: string): boolean {
  return token === `Bearer ${LEGACY_TOKEN}`;
}

/**
 * Marketing Dime branding helper
 */
export function getCompanyInfo() {
  return {
    name: COMPANY_NAME,
    domain: process.env.COMPANY_DOMAIN || "mktgdime.com",
    legalName: process.env.COMPANY_LEGAL_NAME || "MKTDM Media and Marketing OPC Pvt Ltd",
    adminEmail: ADMIN_EMAIL,
    carStreetsApp: process.env.CARSTREETS_BRAND || "CarStreetsApp",
  };
}

/**
 * Check if user has admin privileges for Marketing Dime operations
 */
export function hasMarketingDimeAccess(userEmail: string): boolean {
  return userEmail === ADMIN_EMAIL || userEmail.endsWith("@mktgdime.com");
}
