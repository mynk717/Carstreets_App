import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/api/auth/[...nextauth]/route'  // ✅ FIXED: path
import { WhatsAppStorageService } from '@/lib/services/whatsapp-storage.service'
import { decrypt } from '@/lib/crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> } // ✅ FIXED: Promise
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subdomain } = await params // ✅ FIXED: await params

    const { templateId, contactVariables } = await request.json();

    // ✅ Step 1: Validate dealer & auth
    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: {
        id: true,
        email: true,
        whatsappBusinessAccountId: true,
        whatsappPhoneNumberId: true,
      },
    })

    if (!dealer || session.user.email !== dealer.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ✅ Step 2: Check token expiry
    const accessToken = process.env.WHATSAPP_API_TOKEN || 
                     process.env.MOTOYARD_WHATSAPP_PLATFORM_TOKEN || '';

    if (!accessToken) {
      return NextResponse.json(
        { error: 'WhatsApp not configured' },
        { status: 500 }
      );
    }

    if (!dealer.whatsappPhoneNumberId) {
      return NextResponse.json(
        { error: 'WhatsApp phone number not configured' },
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
        dealerId: dealer.id,
        id: { in: contactVariables.map((c) => c.contactId) },
        optedIn: true,
      },
      select: { id: true, phoneNumber: true, name: true },
    });

    if (contacts.length === 0) {
      return NextResponse.json(
        { error: 'No valid contacts found' },
        { status: 400 }
      )
    }

    // ✅ Step 5: Send via WhatsApp API
    const results = []
    let sentCount = 0
    let failedCount = 0

    for (const contact of contacts) {
      try {
        console.log(
          `📤 Sending WhatsApp to ${contact.phoneNumber} using template: ${template.name}`
        );
    
        const found = contactVariables.find(c => c.contactId === contact.id);
        const personalVariables = found?.variables || [];
    
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${dealer.whatsappPhoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: contact.phoneNumber,
              type: 'template',
              template: {
                name: template.name,
                language: { code: template.language || 'en_US' },
                components: personalVariables.length > 0 ? [
                  {
                    type: 'body',
                    parameters: personalVariables.map((v: string) => ({
                      type: 'text',
                      text: v,
                    })),
                  },
                ] : undefined,
              },
            }),
          }
        );
    
        const result = await response.json();
        // Log the exact WhatsApp API response for diagnosis!
        console.log("WhatsApp API response:", result);
    
        if (response.ok && result.messages && result.messages.length > 0) {
          sentCount++;
          results.push({
            contactId: contact.id,
            phone: contact.phoneNumber,
            success: true,
            messageId: result.messages[0].id,
          });
        } else {
          failedCount++;
          results.push({
            contactId: contact.id,
            phone: contact.phoneNumber,
            success: false,
            error: result.error?.message || 'Failed',
          });
          console.error(
            `❌ Failed to send to ${contact.phoneNumber}: ${result.error?.message || 'Unknown error'}`
          );
        }
      } catch (error: any) {
        failedCount++;
        results.push({
          contactId: contact.id,
          phone: contact.phoneNumber,
          success: false,
          error: error.message || 'Exception',
        });
        console.error(`❌ Exception sending to ${contact.phoneNumber}:`, error);
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
  } catch (error: any) { // <-- GLOBAL handler for the entire try block
    console.error('❌ WhatsApp send-bulk error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
