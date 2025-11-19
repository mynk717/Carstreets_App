import { NextRequest, NextResponse } from 'next/server'  // ✅ Add this import
import { prisma } from '@/lib/prisma'  // ✅ Add this import

export async function POST(request: NextRequest) {
  const { dealerId, days = 30 } = await request.json()

  // Get all users who viewed shared cars
  const shareEvents = await prisma.shareEvent.findMany({
    where: {
      dealerId,
      eventType: 'catalog_share_generated',
      timestamp: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      }
    },
    include: {
      car: true
    }
  })

  // Upload to Meta as Custom Audience
  const audienceData = {
    name: `Car Viewers - ${dealerId} - ${days}d`,
    subtype: 'CUSTOM',
    description: 'Users who viewed shared car catalog products',
    customer_file_source: 'USER_PROVIDED_ONLY'
  }

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${process.env.FACEBOOK_AD_ACCOUNT_ID}/customaudiences`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FACEBOOK_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(audienceData)
    }
  )

  const data = await response.json()  // ✅ Parse response

  return NextResponse.json({ 
    success: true, 
    audienceId: data.id  // ✅ Use data.id instead of response.data.id
  })
}
