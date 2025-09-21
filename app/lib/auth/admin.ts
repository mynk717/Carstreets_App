// lib/auth/admin.ts - ENHANCED VERSION
import { NextRequest } from 'next/server';

const ADMIN_TOKEN = 'admin-temp-key';

export async function verifyAdminAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    console.log('🔐 Admin auth check:', {
      hasAuthHeader: !!authHeader,
      authHeaderValue: authHeader ? `${authHeader.substring(0, 10)}...` : 'None',
      expectedToken: `Bearer ${ADMIN_TOKEN}`,
      method: request.method,
      url: request.url
    });
    
    // ✅ FIXED: More robust token validation
    if (authHeader === `Bearer ${ADMIN_TOKEN}`) {
      console.log('✅ Admin authentication successful');
      return { success: true, user: { role: 'admin' } };
    }
    
    // ✅ FIXED: Better error details for debugging
    console.log('❌ Admin authentication failed:', {
      received: authHeader,
      expected: `Bearer ${ADMIN_TOKEN}`,
      match: authHeader === `Bearer ${ADMIN_TOKEN}`
    });
    
    return { 
      success: false, 
      error: 'Invalid or missing authorization token'
    };
  } catch (error) {
    console.error('❌ Auth verification error:', error);
    return { 
      success: false, 
      error: 'Authentication verification failed' 
    };
  }
}

// ✅ NEW: Helper function to create auth headers for internal API calls
export function createAuthHeaders(): HeadersInit {
  return {
    'Authorization': `Bearer ${ADMIN_TOKEN}`,
    'Content-Type': 'application/json'
  };
}

// ✅ NEW: Validation function for external use
export function isValidAdminToken(token: string): boolean {
  return token === `Bearer ${ADMIN_TOKEN}`;
}