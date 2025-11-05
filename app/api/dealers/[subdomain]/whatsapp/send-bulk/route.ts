import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/api/auth/[...nextauth]/route'

export async function POST(
  request: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subdomain } = params
    const { templateId, contactIds, customVariables } = await request.json()

    // ✅ Step 1: Validate dealer & auth
    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: {
        id: true,
        email: true,
        metaAccessToken: true,
        metaAccessTokenExpiry: true,
        whatsappBusinessAccountId: true,
        whatsappPhoneNumberId: true
      }
    })

    if (!dealer || session.user.email !== dealer.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ✅ Step 2: Check token expiry
    if (dealer.metaAccessTokenExpiry &&
        new Date(dealer.metaAccessTokenExpiry) < new Date()) {
      return NextResponse.json(
        { error: 'Meta token expired - please reconnect Facebook' },
        { status: 401 }
      )
    }

    if (!dealer.metaAccessToken || !dealer.whatsappPhoneNumberId) {
      return NextResponse.json(
        { error: 'WhatsApp not connected' },
        { status: 400 }
      )
    }

    // ✅ Step 3: Get & validate template (CRITICAL: dealerId scope)
    const template = await prisma.whatsAppTemplate.findUnique({
      where: { id: templateId },
      select: {
        id: true,
        name: true,
        language: true,
        bodyText: true,
        status: true,
        dealerId: true  // Validate ownership
      }
    })

    if (!template || template.dealerId !== dealer.id || template.status !== 'APPROVED') {
      console.warn(
        `⚠️ SECURITY: Invalid template access - 
         Template: ${templateId}, Dealer: ${dealer.id}, Status: ${template?.status}`
      )
      return NextResponse.json(
        { error: 'Template not found or not approved' },
        { status: 400 }
      )
    }

    // ✅ Step 4: Get contacts (CRITICAL: dealerId scope + optedIn)
    const contacts = await prisma.whatsAppContact.findMany({
      where: {
        dealerId: dealer.id,  // ✅ Only dealer's contacts
        id: { in: contactIds },
        optedIn: true  // ✅ Respect consent
      },
      select: { id: true, phoneNumber: true, name: true }
    })

    if (contacts.length === 0) {
      return NextResponse.json(
        { error: 'No valid contacts found' },
        { status: 400 }
      )
    }

    // ✅ Step 5: Send via WhatsApp API
    const token = dealer.metaAccessToken
    const results = []
    let sentCount = 0
    let failedCount = 0

    for (const contact of contacts) {
      try {
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${dealer.whatsappPhoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: contact.phoneNumber,
              type: 'template',
              template: {
                name: template.name,
                language: { code: template.language },
                components: customVariables ? [{
                  type: 'body',
                  parameters: customVariables.map((v: string) => ({
                    type: 'text',
                    text: v
                  }))
                }] : []
              }
            })
          }
        )

        const result = await response.json()

        // ✅ Log message
        await prisma.whatsAppMessage.create({
          data: {
            dealerId: dealer.id,
            contactId: contact.id,
            phoneNumber: contact.phoneNumber,
            messageType: 'template',
            templateId: template.id,
            content: template.bodyText,
            messageId: result.messages?.[0]?.id || '',
            status: response.ok ? 'sent' : 'failed'
          }
        })

        if (response.ok) {
          sentCount++
          results.push({
            contactId: contact.id,
            phone: contact.phoneNumber,
            success: true,
            messageId: result.messages?.[0]?.id
          })
        } else {
          failedCount++
          results.push({
            contactId: contact.id,
            phone: contact.phoneNumber,
            success: false,
            error: result.error?.message || 'Failed'
          })
        }
      } catch (error: any) {
        failedCount++
        results.push({
          contactId: contact.id,
          phone: contact.phoneNumber,
          success: false,
          error: error.message
        })
      }
    }

    console.log(
      `📱 WhatsApp bulk send complete - Dealer: ${subdomain}, 
       Sent: ${sentCount}, Failed: ${failedCount}`
    )

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      total: contacts.length,
      results
    })

  } catch (error: any) {
    console.error('❌ WhatsApp send-bulk error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
