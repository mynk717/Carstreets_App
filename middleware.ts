import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl
  
  console.log('🔍 Middleware:', { hostname, pathname: url.pathname })

  // Platform domain: motoyard.mktgdime.com or localhost
  const isPlatformDomain = hostname === 'motoyard.mktgdime.com' || 
                           hostname === 'localhost:3000' ||
                           hostname.startsWith('localhost')

  if (isPlatformDomain) {
    // Allow platform routes (homepage, pricing, auth, admin)
    if (url.pathname === '/' || 
        url.pathname.startsWith('/pricing') ||
        url.pathname.startsWith('/features') ||
        url.pathname.startsWith('/about') ||
        url.pathname.startsWith('/auth') ||
        url.pathname.startsWith('/admin') ||
        url.pathname.startsWith('/dealers') ||
        url.pathname.startsWith('/api')) {
      return NextResponse.next()
    }
  }

  // Subdomain detection: *.motoyard.mktgdime.com
  if (hostname.endsWith('.motoyard.mktgdime.com') && hostname !== 'motoyard.mktgdime.com') {
    const subdomain = hostname.replace('.motoyard.mktgdime.com', '')
    
    console.log('🏢 Detected subdomain:', subdomain)
    
    // ✅ FIX: Don't rewrite if path already starts with /dealers/[subdomain]
    if (url.pathname.startsWith(`/dealers/${subdomain}`)) {
      console.log('✅ Path already correct, no rewrite needed')
      return NextResponse.next()
    }
    
    // Rewrite to dealer-specific route ONLY if not already there
    const newUrl = url.clone()
    newUrl.pathname = `/dealers/${subdomain}${url.pathname}`
    
    console.log('↪️  Rewriting to:', newUrl.pathname)
    return NextResponse.rewrite(newUrl)
  }

  // Custom domain detection (future feature)
  // TODO: Check database for custom domains
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder
     * - api routes (they handle their own logic)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
