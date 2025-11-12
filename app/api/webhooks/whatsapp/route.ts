import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WhatsAppStorageService } from '@/lib/services/whatsapp-storage.service';

// Webhook verification (Meta requirement)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

async function getDealerByPhoneNumberId(phoneNumberId: string, from: string) {
  let dealer = await prisma.dealer.findFirst({
    where: { whatsappPhoneNumberId: phoneNumberId },
    select: { id: true, subdomain: true },
  });

  if (!dealer) {
    console.warn(`⚠️ Dealer not found by whatsappPhoneNumberId: ${phoneNumberId}, trying lookup via contact phone...`);
    const contact = await prisma.whatsAppContact.findFirst({
      where: { phoneNumber: from },
      select: { dealerId: true },
    });

    if (contact) {
      dealer = await prisma.dealer.findUnique({
        where: { id: contact.dealerId },
        select: { id: true, subdomain: true },
      });
    }
  }

  return dealer;
}

// ============================================================
// CHANGE #1: POST handler now returns 200 OK immediately
// WHY: Meta requires immediate acknowledgment to prevent retries
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📩 Incoming webhook:', JSON.stringify(body, null, 2));

    // ✅ CHANGE #2: Return 200 OK immediately before processing
    // WHY: This tells Meta "webhook received successfully, don't retry"
    // BEFORE: We awaited all processing before responding
    // AFTER: We respond first, then process asynchronously
    const response = NextResponse.json({ status: 'received' }, { status: 200 });

    // ✅ CHANGE #3: Process webhook asynchronously without awaiting
    // WHY: Processing happens in background after 200 OK is sent
    // The .catch() ensures errors don't crash the handler
    processWebhookAsync(body).catch((error) => {
      console.error('❌ [Webhook] Async processing error:', error);
      // We don't throw here because we already sent 200 OK
    });

    return response;
  } catch (error: any) {
    console.error('❌ Webhook parse error:', error);
    // ✅ CHANGE #4: Still return 200 even on error
    // WHY: Prevents Meta from retrying on parsing errors
    return NextResponse.json({ status: 'error' }, { status: 200 });
  }
}

// ============================================================
// CHANGE #5: New separate async processing function
// WHY: Separates acknowledgment logic from processing logic
// This runs AFTER the 200 OK response is sent to Meta
// ============================================================
async function processWebhookAsync(body: any) {
  try {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value) {
      console.log('[Webhook] No value in payload, skipping');
      return;
    }

    // Process incoming messages
    if (value.messages) {
      console.log(`📨 [Webhook] Processing ${value.messages.length} message(s)`);
      for (const message of value.messages) {
        await handleIncomingMessage(message, value.metadata);
      }
    }

    // Process status updates (delivered, read, etc.)
    if (value.statuses) {
      console.log(`📊 [Webhook] Processing ${value.statuses.length} status update(s)`);
      for (const status of value.statuses) {
        await handleStatusUpdate(status, value.metadata);
      }
    }

    console.log('✅ [Webhook] Async processing completed successfully');
  } catch (error: any) {
    console.error('❌ [Webhook] Async processing failed:', error);
    // Log to external monitoring service here if available
    // Example: Sentry.captureException(error);
  }
}

// ============================================================
// CHANGE #6: Fixed metadata field name
// WHY: Meta's API uses phone_number_id (with underscores), not phonenumberid
// BEFORE: metadata.phonenumberid (incorrect)
// AFTER: metadata.phone_number_id (correct)
// ============================================================
async function handleIncomingMessage(message: any, metadata: any) {
  try {
    // ✅ CHANGE #6: Corrected field name from phonenumberid to phone_number_id
    const phoneNumberId = metadata.phone_number_id; // Was: metadata.phonenumberid
    const from = message.from;
    const messageId = message.id;
    const timestamp = parseInt(message.timestamp) * 1000;

    // ✅ CHANGE #7: Added more detailed logging for debugging
    console.log(`📥 [Message] Processing message ${messageId} from ${from}`);

    // Get dealer with fallback lookup
    const dealer = await getDealerByPhoneNumberId(phoneNumberId, from);

    if (!dealer) {
      console.warn(`⚠️ No dealer found for phone number ID: ${phoneNumberId} and sender ${from}`);
      return;
    }

    console.log(`🏢 [Message] Dealer found: ${dealer.subdomain} (${dealer.id})`);

    // Find or create contact
    let contact = await prisma.whatsAppContact.findFirst({
      where: {
        dealerId: dealer.id,
        phoneNumber: from,
      },
    });

    if (!contact) {
      contact = await prisma.whatsAppContact.create({
        data: {
          dealerId: dealer.id,
          phoneNumber: from,
          name: message.profile?.name || from,
          optedIn: true,
        },
      });
      console.log(`📱 New contact created: ${from} for dealer ${dealer.subdomain}`);
    }

    // Extract content based on message type
    let content = '';
    let messageType: 'text' | 'image' | 'document' | 'template' = 'text';
    let mediaUrl = '';

    if (message.type === 'text') {
      content = message.text.body;
    } else if (message.type === 'image') {
      messageType = 'image';
      content = message.image.caption || '[Image]';
      mediaUrl = message.image.id;
    } else if (message.type === 'document') {
      messageType = 'document';
      content = message.document.filename || '[Document]';
      mediaUrl = message.document.id;
    }

    // ✅ CHANGE #8: Added logging before storage operations
    console.log(`💾 [Message] Saving to Redis: ${messageId}`);

    // Save to Redis for fast retrieval
    await WhatsAppStorageService.saveMessage({
      id: messageId,
      dealerId: dealer.id,
      contactId: contact.id,
      phoneNumber: from,
      direction: 'inbound',
      content,
      messageType,
      status: 'delivered',
      timestamp,
      mediaUrl: mediaUrl || undefined,
      webhookData: message,
    });

    // ✅ CHANGE #9: Added logging before database operations
    console.log(`💾 [Message] Updating conversation summary in PostgreSQL`);

    // Update conversation summary in PostgreSQL
    await prisma.whatsAppConversationSummary.upsert({
      where: {
        dealerId_contactId: {
          dealerId: dealer.id,
          contactId: contact.id,
        },
      },
      update: {
        lastMessageAt: new Date(timestamp),
        lastMessagePreview: content.substring(0, 100),
        unreadCount: { increment: 1 },
        totalMessages: { increment: 1 },
      },
      create: {
        dealerId: dealer.id,
        contactId: contact.id,
        lastMessageAt: new Date(timestamp),
        lastMessagePreview: content.substring(0, 100),
        unreadCount: 1,
        totalMessages: 1,
      },
    });

    // Create message record in PostgreSQL
    await prisma.whatsAppMessage.create({
      data: {
        dealerId: dealer.id,
        contactId: contact.id,
        phoneNumber: from,
        messageType,
        messageId,
        status: 'delivered',
        direction: 'inbound',
        content: '', // Content is in Redis, not duplicated here
      },
    });

    console.log(`✅ Incoming message processed successfully: ${messageId} from ${from}`);
  } catch (error: any) {
    console.error('❌ Error handling incoming message:', error);
    // ✅ CHANGE #10: More detailed error logging
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      messageId: message?.id,
      from: message?.from,
    });
  }
}

async function handleStatusUpdate(status: any, metadata: any) {
  try {
    const messageId = status.id;
    const newStatus = status.status;

    console.log(`📊 Status update: ${messageId} -> ${newStatus}`);

    await prisma.whatsAppMessage.updateMany({
      where: { messageId },
      data: {
        status: newStatus,
        ...(newStatus === 'delivered' && { deliveredAt: new Date() }),
        ...(newStatus === 'read' && { readAt: new Date() }),
      },
    });

    console.log(`✅ Status updated successfully: ${messageId} -> ${newStatus}`);
  } catch (error: any) {
    console.error('❌ Error handling status update:', error);
  }
}
