import { NextRequest, NextResponse } from 'next/server'

const allowScraping = process.env.NODE_ENV !== 'production' || process.env.ALLOW_SCRAPING === 'true'

// Add retry function with timeout
async function fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        throw new Error('Request timed out after 30 seconds')
      }
      
      if (attempt === retries) {
        throw error // Final attempt failed
      }
      
      console.warn(`Fetch attempt ${attempt}/${retries} failed, retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
      delay *= 1.5 // Exponential backoff
    }
  }
  throw new Error('Max retries reached')
}

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

    // Enhanced headers to mimic real browser
    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate', 
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        'DNT': '1'
      }
    })

    const html = await response.text()
    console.log(`✅ Successfully fetched ${html.length} characters from OLX`)
    
    // Parse the data (NO duplicate fetch here)
    const parsedData = await parseOLXListing(html, url, itemId)
    
    return NextResponse.json({
      success: true,
      data: parsedData,
      message: 'Test scraping completed successfully',
      url: url,
      timestamp: new Date().toISOString(),
      html_size: html.length
    })

  } catch (error) {
    console.error('Test scrape error:', error)
    
    // Return mock data for immediate development testing
    if (process.env.NODE_ENV === 'development') {
      // Try to get url from request body if possible
      let url: string | undefined = undefined;
      try {
        const body = await request.json();
        url = body.url;
      } catch {
        url = undefined;
      }
      return NextResponse.json({
        success: true,
        data: {
          id: "1819957445",
          url: url,
          title: "Maruti Suzuki S-Cross 1.5 Zeta, 2019, Diesel",
          price: "₹8,50,000",
          currency: "INR",
          description: "MOCK DATA - ADDITIONAL VEHICLE INFORMATION: Accidental: No, Air Conditioning: Automatic Climate Control, Alloy Wheels: Yes",
          location: { city: "Raipur", state: "Chhattisgarh", country: "India" },
          seller: { name: "Car Street", business: true, verified: true },
          images: { 
            lead: "https://apollo.olx.in:443/v1/files/tpf9v46kghxq3-IN/image",
            srcset: ["https://apollo.olx.in:443/v1/files/tpf9v46kghxq3-IN/image;s=300x600;q=60 300w"]
          },
          attributes: [
            { key: "Accidental", value: "No" },
            { key: "Air Conditioning", value: "Automatic Climate Control" },
            { key: "Color", value: "Blue" }
          ],
          validation: { 
            title_extracted: true, 
            mock_data: true,
            error_reason: error instanceof Error ? error.message : String(error)
          }
        },
        message: 'Mock data returned - OLX blocking detected',
        timestamp: new Date().toISOString()
      })
    }
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Test scraping failed',
      details: 'OLX may be blocking server-to-server requests'
    }, { status: 500 })
  }
}

// FIXED: Remove duplicate fetch call from parseOLXListing
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

  // Try to extract JSON data from script tags (FIXED: use [\s\S] instead of 's' flag)
  let jsonData = null
  const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g)
  
  if (scriptMatches) {
    for (const script of scriptMatches) {
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

  return {
    id: itemId,
    url: url,
    title: rawTitle,
    price: null, // Usually requires client-side rendering
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
