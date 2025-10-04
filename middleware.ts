import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  // Only protect admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    })

    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    // Add user context to headers for API routes
    const response = NextResponse.next()
    response.headers.set('x-user-id', token.sub || '')
    response.headers.set('x-user-email', token.email || '')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}
