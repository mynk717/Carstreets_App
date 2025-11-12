import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/api/auth/[...nextauth]/route'  // ✅ FIXED: path
import { WhatsAppStorageService } from '@/lib/services/whatsapp-storage.service'


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }  // ✅ FIXED: Promise
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subdomain } = await params  // ✅ FIXED: await params

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
        whatsappPhoneNumberId: true,
      },
    })

    if (!dealer || session.user.email !== dealer.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ✅ Step 2: Check token expiry
    if (
      dealer.metaAccessTokenExpiry &&
      new Date(dealer.metaAccessTokenExpiry) < new Date()
    ) {
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
        dealerId: true, // Validate ownership
      },
    })

    if (
      !template ||
      template.dealerId !== dealer.id ||
      template.status !== 'APPROVED'
    ) {
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
        dealerId: dealer.id, // ✅ Only dealer's contacts
        id: { in: contactIds },
        optedIn: true, // ✅ Respect consent
      },
      select: { id: true, phoneNumber: true, name: true },
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
        console.log(
          `📤 Sending WhatsApp to ${contact.phoneNumber} using template: ${template.name}`
        )

        const response = await fetch(
          `https://graph.facebook.com/v18.0/${dealer.whatsappPhoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: contact.phoneNumber,
              type: 'template',
              template: {
                name: template.name,
                language: { code: template.language || 'en_US' },
                components: customVariables && customVariables.length > 0 ? [
                  {
                    type: 'body',
                    parameters: customVariables.map((v: string) => ({
                      type: 'text',
                      text: v,
                    })),
                  },
                ] : [],
              },
            }),
          }
        )

        const result = await response.json()

        console.log(
          `API Response: ${response.ok ? '✅ Success' : '❌ Failed'} - ${JSON.stringify(result)}`
        )

        // ✅ Log message
        const message = await prisma.whatsAppMessage.create({
          data: {
            dealerId: dealer.id,
            contactId: contact.id,
            phoneNumber: contact.phoneNumber,
            messageType: 'template',
            templateId: template.id,
            content: template.bodyText,
            messageId: result.messages?.[0]?.id || null,
            status: response.ok ? 'sent' : 'failed',
            error: response.ok ? null : result.error?.message || 'Unknown error',
          },
        })

        if (response.ok) {
          sentCount++
          console.log(`✅ Message sent to ${contact.phoneNumber}`)
          const messageId = result.messages?.[0]?.id;
          if (messageId) {
            try {
              await WhatsAppStorageService.saveMessage({
                id: messageId,
                dealerId: dealer.id,
                contactId: contact.id,
                phoneNumber: contact.phoneNumber,
                direction: 'outbound',
                content: template.bodyText,
                messageType: 'template',
                status: 'sent',
                timestamp: Date.now(),
                templateName: template.name,
              });

              // Update conversation summary
              await prisma.whatsAppConversationSummary.upsert({
                where: {
                  dealerId_contactId: {
                    dealerId: dealer.id,
                    contactId: contact.id,
                  },
                },
                update: {
                  lastMessageAt: new Date(),
                  lastMessagePreview: template.bodyText.substring(0, 100),
                  totalMessages: { increment: 1 },
                },
                create: {
                  dealerId: dealer.id,
                  contactId: contact.id,
                  lastMessageAt: new Date(),
                  lastMessagePreview: template.bodyText.substring(0, 100),
                  totalMessages: 1,
                  unreadCount: 0,
                },
              });
            } catch (redisError) {
              console.error('⚠️ Redis storage failed (non-critical):', redisError);
            }
          }
          results.push({
            contactId: contact.id,
            phone: contact.phoneNumber,
            success: true,
            messageId: result.messages?.[0]?.id,
          })
        } else {
          failedCount++
          console.error(
            `❌ Failed to send to ${contact.phoneNumber}: ${result.error?.message}`
          )
          results.push({
            contactId: contact.id,
            phone: contact.phoneNumber,
            success: false,
            error: result.error?.message || 'Failed',
          })
        }
      } catch (error: any) {
        failedCount++
        console.error(`❌ Exception sending to ${contact.phoneNumber}:`, error)

        // Log error to database
        await prisma.whatsAppMessage.create({
          data: {
            dealerId: dealer.id,
            contactId: contact.id,
            phoneNumber: contact.phoneNumber,
            messageType: 'template',
            templateId: template.id,
            content: template.bodyText,
            status: 'failed',
            error: error.message,
          },
        })

        results.push({
          contactId: contact.id,
          phone: contact.phoneNumber,
          success: false,
          error: error.message,
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
      results,
    })
  } catch (error: any) {
    console.error('❌ WhatsApp send-bulk error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
