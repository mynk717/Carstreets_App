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

// Incoming message handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📩 Incoming webhook:', JSON.stringify(body, null, 2));

    // Meta webhook structure
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value) {
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    // Handle incoming messages
    if (value.messages) {
      for (const message of value.messages) {
        await handleIncomingMessage(message, value.metadata);
      }
    }

    // Handle status updates (delivered, read)
    if (value.statuses) {
      for (const status of value.statuses) {
        await handleStatusUpdate(status, value.metadata);
      }
    }

    // Always return 200 to prevent retries
    return NextResponse.json({ status: 'received' }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    // Still return 200 to prevent Meta retries
    return NextResponse.json({ status: 'error', error: error.message }, { status: 200 });
  }
}

async function handleIncomingMessage(message: any, metadata: any) {
  try {
    const phoneNumberId = metadata.phone_number_id;
    const from = message.from; // Customer's WhatsApp number
    const messageId = message.id;
    const timestamp = parseInt(message.timestamp) * 1000;

    // Find dealer by WhatsApp phone number ID
    const dealer = await prisma.dealer.findFirst({
      where: { whatsappPhoneNumberId: phoneNumberId },
      select: { id: true, subdomain: true },
    });

    if (!dealer) {
      console.warn(`⚠️ No dealer found for phone number ID: ${phoneNumberId}`);
      return;
    }

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
      console.log(`📱 New contact created: ${from}`);
    }

    // Extract message content
    let content = '';
    let messageType: 'text' | 'image' | 'document' | 'template' = 'text';
    let mediaUrl = '';

    if (message.type === 'text') {
      content = message.text.body;
    } else if (message.type === 'image') {
      messageType = 'image';
      content = message.image.caption || '[Image]';
      mediaUrl = message.image.id; // Store media ID for retrieval
    } else if (message.type === 'document') {
      messageType = 'document';
      content = message.document.filename || '[Document]';
      mediaUrl = message.document.id;
    }

    // Save to Redis
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

    // Track in existing message model for analytics (no full content)
    await prisma.whatsAppMessage.create({
      data: {
        dealerId: dealer.id,
        contactId: contact.id,
        phoneNumber: from,
        messageType,
        messageId,
        status: 'delivered',
        direction: 'inbound',
        content: '', // Don't duplicate storage
      },
    });

    console.log(`✅ Incoming message processed: ${messageId} from ${from}`);
  } catch (error: any) {
    console.error('❌ Error handling incoming message:', error);
  }
}

async function handleStatusUpdate(status: any, metadata: any) {
  try {
    const messageId = status.id;
    const newStatus = status.status; // sent, delivered, read, failed

    console.log(`📊 Status update: ${messageId} -> ${newStatus}`);

    // Update in PostgreSQL for analytics
    await prisma.whatsAppMessage.updateMany({
      where: { messageId },
      data: {
        status: newStatus,
        ...(newStatus === 'delivered' && { deliveredAt: new Date() }),
        ...(newStatus === 'read' && { readAt: new Date() }),
      },  
    });

    // Redis updates handled via separate queries (no need to update full messages)
  } catch (error: any) {
    console.error('❌ Error handling status update:', error);
  }
}
