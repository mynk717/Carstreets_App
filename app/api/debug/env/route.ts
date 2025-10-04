// app/api/debug/env/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasAdminEmail: !!process.env.ADMIN_EMAIL,
    hasAdminPasswordHash: !!process.env.ADMIN_PASSWORD_HASH,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    // Don't expose actual values!
    adminEmailFirst3Chars: process.env.ADMIN_EMAIL?.substring(0, 3),
    nodeEnv: process.env.NODE_ENV
  })
}
