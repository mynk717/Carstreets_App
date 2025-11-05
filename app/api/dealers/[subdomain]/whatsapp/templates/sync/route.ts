import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }  // ✅ CORRECT: Promise
) {
  try {
    const { subdomain } = await params  // ✅ CORRECT: await

    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: {
        id: true,
        whatsappBusinessAccountId: true,
        metaAccessToken: true,  // ✅ KEEP: Keep this as-is
      },
    })

    if (!dealer?.whatsappBusinessAccountId) {
      return NextResponse.json(
        { success: false, error: 'WhatsApp not connected' },
        { status: 400 }
      )
    }

    // ✅ KEEP: Use the token from dealer record (don't change to env)
    const token = dealer.metaAccessToken

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Meta access token not configured' },
        { status: 400 }
      )
    }

    console.log(`📱 Fetching templates for dealer: ${subdomain}`)

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${dealer.whatsappBusinessAccountId}/message_templates`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to fetch templates from Meta')
    }

    const data = await response.json()
    const metaTemplates = data.data || []

    console.log(`Found ${metaTemplates.length} templates from Meta`)

    // Sync to database
    let synced = 0
    for (const metaTemplate of metaTemplates) {
      await prisma.whatsAppTemplate.upsert({
        where: {
          dealerId_name: {
            dealerId: dealer.id,
            name: metaTemplate.name,
          },
        },
        update: {
          status: metaTemplate.status,
          metaTemplateId: metaTemplate.id,
          language: metaTemplate.language,
          category: metaTemplate.category,
          bodyText: metaTemplate.components?.find((c: any) => c.type === 'BODY')?.text || '',
          footerText:
            metaTemplate.components?.find((c: any) => c.type === 'FOOTER')?.text || null,
        },
        create: {
          dealerId: dealer.id,
          name: metaTemplate.name,
          status: metaTemplate.status,
          metaTemplateId: metaTemplate.id,
          language: metaTemplate.language,
          category: metaTemplate.category,
          bodyText: metaTemplate.components?.find((c: any) => c.type === 'BODY')?.text || '',
          footerText:
            metaTemplate.components?.find((c: any) => c.type === 'FOOTER')?.text || null,
        },
      })
      synced++
    }

    console.log(`✅ Synced ${synced} templates for dealer: ${subdomain}`)

    return NextResponse.json({ success: true, synced })
  } catch (error: any) {
    console.error('Template sync error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
