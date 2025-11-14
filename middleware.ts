// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl
  
  console.log('🔍 Middleware:', { hostname, pathname: url.pathname })

  const isPlatformDomain = hostname === 'motoyard.mktgdime.com' || 
                           hostname === 'localhost:3000' ||
                           hostname.startsWith('localhost') ||
                           hostname.startsWith('127.0.0.1') ||
                           hostname.includes('cloudworkstations.dev') ||
                           hostname.includes('vercel.app')

  if (isPlatformDomain) {
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

  if (hostname.endsWith('.motoyard.mktgdime.com') && hostname !== 'motoyard.mktgdime.com') {
  const subdomain = hostname.replace('.motoyard.mktgdime.com', '')
  
  // ✅ FIX: Don't rewrite if path already contains /dealers/{subdomain}
  if (!url.pathname.startsWith(`/dealers/${subdomain}`)) {
    const newUrl = url.clone()
    newUrl.pathname = `/dealers/${subdomain}${url.pathname}`
    return NextResponse.rewrite(newUrl)
  }
  
  // Path already has /dealers/{subdomain}, let it through
  return NextResponse.next()
}
}

export const config = {
  matcher: [
    // ✅ CRITICAL: Exclude webhooks and auth
    '/((?!api/webhooks|api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
