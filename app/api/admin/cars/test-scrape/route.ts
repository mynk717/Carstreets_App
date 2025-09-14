import { NextRequest, NextResponse } from 'next/server'

// Environment check to prevent scraping in production
const allowScraping = process.env.NODE_ENV !== 'production' || process.env.ALLOW_SCRAPING === 'true'

export async function POST(request: NextRequest) {
  if (!allowScraping) {
    return NextResponse.json({ 
      error: 'Scraping disabled in production environment' 
    }, { status: 403 })
  }

  try {
    const { url } = await request.json()

    if (!url || !url.includes('olx.in')) {
      return NextResponse.json({ 
        error: 'Valid OLX URL required' 
      }, { status: 400 })
    }

    // Extract item ID from URL
    const itemIdMatch = url.match(/iid-(\d+)/)
    if (!itemIdMatch) {
      return NextResponse.json({ 
        error: 'Could not extract item ID from URL' 
      }, { status: 400 })
    }

    const itemId = itemIdMatch[1]

    // Fetch page content
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })

    if (!response.ok) {
      return NextResponse.json({ 
        error: `Failed to fetch page: ${response.status}` 
      }, { status: 400 })
    }

    const html = await response.text()
    
    // Parse the data using the format you specified
    const parsedData = await parseOLXListing(html, url, itemId)
    
    return NextResponse.json({
      success: true,
      data: parsedData,
      message: 'Test scraping completed successfully',
      url: url,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Test scrape error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Test scraping failed' 
    }, { status: 500 })
  }
}

async function parseOLXListing(html: string, url: string, itemId: string) {
  // Extract title from HTML
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i)
  const rawTitle = titleMatch ? titleMatch[1].replace(/ - Cars - \d+.*$/, '').trim() : null

  // Extract meta description
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*?)["']/i)
  const description = descMatch ? descMatch[1] : null

  // Extract OG image
  const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']*?)["']/i)
  const leadImage = ogImageMatch ? ogImageMatch[1] : null

  // Try to extract JSON data from script tags
  let jsonData = null
  const scriptMatches = html.match(/<script[^>]*>([^]*?)<\/script>/g)
  
  if (scriptMatches) {
    for (const script of scriptMatches) {
      // Look for embedded JSON data
      if (script.includes('users') && script.includes('categories')) {
        try {
          const jsonStart = script.indexOf('{')
          const jsonEnd = script.lastIndexOf('}') + 1
          if (jsonStart !== -1 && jsonEnd > jsonStart) {
            const jsonStr = script.slice(jsonStart, jsonEnd)
            jsonData = JSON.parse(jsonStr)
            break
          }
        } catch (e) {
          // Continue looking in other scripts
          continue
        }
      }
    }
  }

  // Parse location from JSON data or fallback
  let location = { city: 'Unknown', state: 'Unknown', country: 'India' }
  if (jsonData?.addressComponents) {
    const components = jsonData.addressComponents
    location = {
      city: components.find((c: any) => c.type === 'CITY')?.name || 'Unknown',
      state: components.find((c: any) => c.type === 'STATE')?.name || 'Unknown',
      country: components.find((c: any) => c.type === 'COUNTRY')?.name || 'India'
    }
  }

  // Parse seller info
  let seller = { name: 'Unknown', business: false, verified: false }
  if (jsonData?.users?.elements) {
    const sellerData = Object.values(jsonData.users.elements)[0] as any
    if (sellerData) {
      seller = {
        name: sellerData.name || 'Unknown',
        business: sellerData.business || false,
        verified: sellerData.kycVerified || false
      }
    }
  }

  // Build image srcset if available
  let images = { lead: leadImage, srcset: [] }
  if (leadImage) {
    const baseUrl = leadImage.replace(/;s=.*$/, '')
    images.srcset = [
      `${baseUrl};s=100x200;q=60 100w`,
      `${baseUrl};s=200x400;q=60 200w`,
      `${baseUrl};s=300x600;q=60 300w`,
      `${baseUrl};s=400x800;q=60 400w`,
      `${baseUrl};s=600x1200;q=60 600w`
    ]
  }

  // Parse attributes from description
  const attributes: Array<{key: string, value: string}> = []
  if (description) {
    const lines = description.split(/[:\n]/)
    for (let i = 0; i < lines.length - 1; i += 2) {
      const key = lines[i]?.trim()
      const value = lines[i + 1]?.trim()
      if (key && value && key !== value) {
        attributes.push({ key, value })
      }
    }
  }
// Add timeout and retry logic
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

try {
  const response = await fetch(url, {
    method: 'GET',
    signal: controller.signal,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none'
    }
  })
  
  clearTimeout(timeoutId)
  
  if (!response.ok) {
    return NextResponse.json({ 
      error: `HTTP ${response.status}: ${response.statusText}` 
    }, { status: 400 })
  }
  
  // ... rest of your parsing code
} catch (error) {
  clearTimeout(timeoutId)
  if (error.name === 'AbortError') {
    return NextResponse.json({ 
      error: 'Request timed out after 30 seconds' 
    }, { status: 408 })
  }
  // ... existing error handling
}

  return {
    id: itemId,
    url: url,
    title: rawTitle,
    price: null, // Often requires client-side rendering
    currency: 'INR',
    description: description,
    attributes: attributes,
    category: {
      top: { id: '5', name: 'Cars' },
      sub: { id: '84', name: 'Cars' }
    },
    location: location,
    seller: seller,
    images: images,
    posted_at: null,
    source: 'olx',
    raw_signals: {
      og_image: leadImage,
      canonical: url,
      has_json_data: !!jsonData,
      script_count: scriptMatches?.length || 0
    },
    validation: {
      title_extracted: !!rawTitle,
      description_extracted: !!description,
      image_extracted: !!leadImage,
      location_extracted: location.city !== 'Unknown',
      seller_extracted: seller.name !== 'Unknown',
      attributes_count: attributes.length
    }
  }
}
