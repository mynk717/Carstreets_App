import { NextRequest, NextResponse } from 'next/server'
import { extractOLXMetadata } from '@/lib/scrapers/url-extractor'
import { verifyAdminAuth } from '@/lib/auth/admin'


// app/api/admin/listings/url-import/route.ts
export async function POST(request: NextRequest) {
  const { itemUrl } = await request.json()
  
  // Parse URL and extract metadata
  const metadata = await extractMetadataFromUrl(itemUrl)
  
  return NextResponse.json({
    success: true,
    metadata,
    message: 'Auto-filled from URL - please verify and add image URLs'
  })
}

// Helper function for different platforms
async function extractMetadataFromUrl(url: string) {
  if (url.includes('olx.in')) {
    return await extractOLXMetadata(url)
  }
  // Add other platforms later
  throw new Error('Platform not supported yet')
}
