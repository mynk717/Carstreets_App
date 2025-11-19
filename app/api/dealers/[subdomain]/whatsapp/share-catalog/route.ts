import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    const { carId, dealerId, method } = await request.json()

    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: {
        id: true,
        facebookCatalogId: true,
        metaAccessToken: true,
        whatsappPhoneNumberId: true,
      }
    })

    if (!dealer || !dealer.facebookCatalogId) {
      return NextResponse.json({ 
        error: 'Meta catalog not configured' 
      }, { status: 400 })
    }

    const car = await prisma.car.findUnique({
      where: { id: carId },
      include: { dealer: true }
    })

    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }

    // ✅ Generate Meta Commerce Manager catalog link
    // This link when shared shows scrollable images in WhatsApp!
    const catalogLink = `https://www.facebook.com/commerce/products/${carId}/?referrer=whatsapp`

    // ✅ Track share event for analytics
    await prisma.shareEvent.create({
      data: {
        eventType: 'catalog_share_generated',
        carId,
        dealerId,
        shareMethod: 'catalog',
        timestamp: new Date(),
        metadata: {
          carTitle: `${car.year} ${car.brand} ${car.model}`,
          price: Number(car.price),
        }
      }
    })

    // ✅ Optional: Send catalog message directly via WhatsApp API
    if (method === 'send_now') {
      const whatsappResponse = await fetch(
        `https://graph.facebook.com/v18.0/${dealer.whatsappPhoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${dealer.metaAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: '919876543210',  // Get from request
            type: 'interactive',
            interactive: {
              type: 'product',
              body: {
                text: `Check out this ${car.year} ${car.brand} ${car.model}!`
              },
              action: {
                catalog_id: dealer.facebookCatalogId,
                product_retailer_id: carId  // Your car ID in catalog
              }
            }
          })
        }
      )

      const whatsappData = await whatsappResponse.json()
      
      if (!whatsappResponse.ok) {
        console.error('WhatsApp catalog message error:', whatsappData)
      }
    }

    return NextResponse.json({
      success: true,
      catalogLink,
      message: 'Catalog link generated. Share on WhatsApp to show scrollable images!'
    })

  } catch (error) {
    console.error('Catalog share error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate catalog link' 
    }, { status: 500 })
  }
}
