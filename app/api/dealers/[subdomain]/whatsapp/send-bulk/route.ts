import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/api/auth/[...nextauth]/route'  // ✅ FIXED: path
import { WhatsAppStorageService } from '@/lib/services/whatsapp-storage.service'
import { decrypt } from '@/lib/crypto';


function countTemplateParameters(bodyText: string): number {
  if (!bodyText) return 0;
  const matches = bodyText.match(/\{\{\d+\}\}/g);
  return matches ? matches.length : 0;
}

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
        bodyText: true,   // used for param count
        status: true,
        dealerId: true,
      },
    });
    
    if (
      !template ||
      template.dealerId !== dealer.id ||
      template.status !== 'APPROVED'
    ) {
      console.warn(
        `⚠️ SECURITY: Invalid template access - Template: ${templateId}, Dealer: ${dealer.id}, Status: ${template?.status}`
      );
      return NextResponse.json(
        { error: 'Template not found or not approved' },
        { status: 400 }
      );
    }
    
    // Count expected params from template.bodyText
    const templateParamCount = countTemplateParameters(template.bodyText);
    
    console.log(`📋 Template "${template.name}" expects ${templateParamCount} parameters`);
    

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
        const found = contactVariables.find(c => c.contactId === contact.id);
        const personalVariables = found?.variables || [];
    
        // Validate parameter count matches template expectations
        if (templateParamCount > 0 && personalVariables.length !== templateParamCount) {
          failedCount++;
          results.push({
            contactId: contact.id,
            phone: contact.phoneNumber,
            name: contact.name,
            success: false,
            error: `[translate:पैरामीटर गणना मेल नहीं खाती]: Template expects ${templateParamCount} but received ${personalVariables.length}`,
            errorCode: 132000,
          });
          console.error(
            `❌ VALIDATION FAILED: ${contact.phoneNumber} - Expected ${templateParamCount} params, got ${personalVariables.length}`
          );
          continue; // Skip sending to this contact
        }
    
        const templatePayload: any = {
          name: template.name,
          language: { code: template.language || 'en_US' },
        };
    
        if (templateParamCount > 0 && personalVariables.length > 0) {
          templatePayload.components = [
            {
              type: 'body',
              parameters: personalVariables.map((v: string) => ({
                type: 'text',
                text: String(v).trim(),
              })),
            },
          ];
        }
    
        const cleanPhone = contact.phoneNumber.replace(/[^0-9]/g, '');
    
        console.log(
          `📤 Sending to ${cleanPhone} (${contact.name})\n` +
          `   Template: ${template.name}\n` +
          `   Parameters: ${JSON.stringify(personalVariables)}`
        );
    
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
              to: cleanPhone,
              type: 'template',
              template: templatePayload,
            }),
          }
        );
    
        const result = await response.json();
    
        console.log(
          `📨 WhatsApp API Response for ${cleanPhone}:\n` +
          `   Status: ${response.status}\n` +
          `   Body: ${JSON.stringify(result, null, 2)}`
        );
    
        const hasError = result.error || !result.messages || result.messages.length === 0 || !response.ok;
    
        if (!hasError) {
          sentCount++;
          results.push({
            contactId: contact.id,
            phone: contact.phoneNumber,
            name: contact.name,
            success: true,
            messageId: result.messages[0].id,
          });
          console.log(`✅ SUCCESS: ${cleanPhone} - Message ID: ${result.messages[0].id}`);
        } else {
          failedCount++;
          const errorCode = result.error?.code || result.error?.error_subcode || 'UNKNOWN';
          const errorMsg = result.error?.message || 'Unknown error';
    
          results.push({
            contactId: contact.id,
            phone: contact.phoneNumber,
            name: contact.name,
            success: false,
            error: errorMsg,
            errorCode: errorCode,
            errorType: result.error?.type,
            errorSubcode: result.error?.error_subcode,
            fbTraceId: result.error?.fbtrace_id,
          });
          console.error(
            `❌ FAILED: ${cleanPhone}\n` +
            `   Code: ${errorCode}\n` +
            `   Message: ${errorMsg}\n` +
            `   Full error: ${JSON.stringify(result.error, null, 2)}`
          );
        }
      } catch (error: any) {
        failedCount++;
        results.push({
          contactId: contact.id,
          phone: contact.phoneNumber,
          name: contact.name,
          success: false,
          error: error.message || 'Exception during send',
          exception: true,
        });
        console.error(`❌ EXCEPTION: ${contact.phoneNumber}:`, error);
      }
    }
    
for (const contact of contacts) {
  try {
    const found = contactVariables.find(c => c.contactId === contact.id);
    const personalVariables = found?.variables || [];

    // VALIDATE parameter count matches template expectation
    if (templateParamCount > 0 && personalVariables.length !== templateParamCount) {
      failedCount++;
      results.push({
        contactId: contact.id,
        phone: contact.phoneNumber,
        name: contact.name,
        success: false,
        error: `Parameter count mismatch: Template expects ${templateParamCount} but got ${personalVariables.length}`,
        errorCode: 132000,
      });
      console.error(
        `❌ VALIDATION FAILED: ${contact.phoneNumber} - Expected ${templateParamCount} params, got ${personalVariables.length}`
      );
      continue; // Skip sending to this contact
    }

    // Build the template payload per Meta API requirements
    const templatePayload: any = {
      name: template.name,
      language: { code: template.language || 'en_US' },
    };

    if (templateParamCount > 0 && personalVariables.length > 0) {
      templatePayload.components = [
        {
          type: 'body',
          parameters: personalVariables.map((v: string) => ({
            type: 'text',
            text: String(v).trim(),
          })),
        },
      ];
    } // else omit components if no params

    // Clean phone number format: remove non-digit characters
    const cleanPhone = contact.phoneNumber.replace(/[^0-9]/g, '');

    console.log(
      `📤 Sending to ${cleanPhone} (${contact.name})\n` +
      `   Template: ${template.name}\n` +
      `   Parameters: ${JSON.stringify(personalVariables)}\n` +
      `   Payload: ${JSON.stringify(templatePayload, null, 2)}`
    );

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
          to: cleanPhone,
          type: 'template',
          template: templatePayload,
        }),
      }
    );

    const result = await response.json();

    console.log(
      `📨 WhatsApp API Response for ${cleanPhone}:\n` +
      `   Status: ${response.status}\n` +
      `   Body: ${JSON.stringify(result, null, 2)}`
    );

    const hasError = result.error || !result.messages || result.messages.length === 0 || !response.ok;

    if (!hasError) {
      sentCount++;
      results.push({
        contactId: contact.id,
        phone: contact.phoneNumber,
        name: contact.name,
        success: true,
        messageId: result.messages[0].id,
      });
      console.log(`✅ SUCCESS: ${cleanPhone} - Message ID: ${result.messages[0].id}`);
    } else {
      failedCount++;
      const errorCode = result.error?.code || result.error?.error_subcode || 'UNKNOWN';
      const errorMsg = result.error?.message || result.error?.error_user_msg || 'Unknown error';

      results.push({
        contactId: contact.id,
        phone: contact.phoneNumber,
        name: contact.name,
        success: false,
        error: errorMsg,
        errorCode: errorCode,
        errorType: result.error?.type,
        errorSubcode: result.error?.error_subcode,
        fbTraceId: result.error?.fbtrace_id,
      });
      console.error(
        `❌ FAILED: ${cleanPhone}\n` +
        `   Code: ${errorCode}\n` +
        `   Message: ${errorMsg}\n` +
        `   Full error: ${JSON.stringify(result.error, null, 2)}`
      );
    }
  } catch (error: any) {
    failedCount++;
    results.push({
      contactId: contact.id,
      phone: contact.phoneNumber,
      name: contact.name,
      success: false,
      error: error.message || 'Exception during send',
      exception: true,
    });
    console.error(`❌ EXCEPTION: ${contact.phoneNumber}:`, error);
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
