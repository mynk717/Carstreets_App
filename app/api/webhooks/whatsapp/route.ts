// app/api/webhooks/whatsapp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { WhatsAppStorageService } from '@/lib/services/whatsapp-storage.service';

// ✅ Use the existing new_PRISMA_DATABASE_URL from your Vercel env vars
const whatsappPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.new_PRISMA_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
});

// Webhook verification (GET)
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

// Incoming webhook handler (POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📩 [Webhook] Received:', JSON.stringify(body, null, 2));

    // ✅ Return 200 OK immediately
    const response = NextResponse.json({ status: 'received' }, { status: 200 });

    // Process asynchronously
    processWebhookAsync(body).catch((error) => {
      console.error('❌ [Webhook] Async processing error:', error);
    });

    return response;
  } catch (error: any) {
    console.error('❌ [Webhook] Parse error:', error);
    return NextResponse.json({ status: 'error' }, { status: 200 });
  }
}

async function processWebhookAsync(body: any) {
  try {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value) {
      console.log('[Webhook] No value in payload, skipping');
      return;
    }

    if (value.messages) {
      console.log(`📨 [Webhook] Processing ${value.messages.length} message(s)`);
      for (const message of value.messages) {
        await handleIncomingMessage(message, value.metadata);
      }
    }

    if (value.statuses) {
      console.log(`📊 [Webhook] Processing ${value.statuses.length} status update(s)`);
      for (const status of value.statuses) {
        await handleStatusUpdate(status, value.metadata);
      }
    }

    console.log('✅ [Webhook] Processing completed');
  } catch (error: any) {
    console.error('❌ [Webhook] Processing failed:', error);
  }
}

async function handleIncomingMessage(message: any, metadata: any) {
  try {
    const phoneNumberId = metadata.phone_number_id;
    const from = message.from;
    const messageId = message.id;
    const timestamp = parseInt(message.timestamp) * 1000;

    console.log(`📥 [Message] Processing ${messageId} from ${from} (phoneNumberId: ${phoneNumberId})`);

    // ✅ Use whatsappPrisma instead of prisma
    const dealer = await whatsappPrisma.dealer.findFirst({
      where: { whatsappPhoneNumberId: phoneNumberId },
      select: { id: true, subdomain: true },
    });

    if (!dealer) {
      console.error(`❌ [Message] No dealer found for phoneNumberId: ${phoneNumberId}`);
      return;
    }

    console.log(`✅ [Message] Dealer found: ${dealer.subdomain} (${dealer.id})`);

    let contact = await whatsappPrisma.whatsAppContact.findFirst({
      where: {
        dealerId: dealer.id,
        phoneNumber: from,
      },
    });

    if (!contact) {
      contact = await whatsappPrisma.whatsAppContact.create({
        data: {
          dealerId: dealer.id,
          phoneNumber: from,
          name: message.profile?.name || from,
          optedIn: true,
        },
      });
      console.log(`✅ [Message] New contact created: ${from}`);
    }

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

    console.log(`💾 [Message] Saving to Redis: ${messageId}`);

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

    console.log(`💾 [Message] Updating conversation summary`);

    await whatsappPrisma.whatsAppConversationSummary.upsert({
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

    await whatsappPrisma.whatsAppMessage.create({
      data: {
        dealerId: dealer.id,
        contactId: contact.id,
        phoneNumber: from,
        messageType,
        messageId,
        status: 'delivered',
        direction: 'inbound',
        content: content,
      },
    });

    console.log(`✅ [Message] Saved successfully: ${messageId}`);
  } catch (error: any) {
    console.error('❌ [Message] Error:', error);
    console.error('❌ [Message] Stack:', error.stack);
  }
}

async function handleStatusUpdate(status: any, metadata: any) {
  try {
    const messageId = status.id;
    const newStatus = status.status;

    console.log(`📊 [Status] Updating ${messageId} -> ${newStatus}`);

    await whatsappPrisma.whatsAppMessage.updateMany({
      where: { messageId },
      data: {
        status: newStatus,
        ...(newStatus === 'delivered' && { deliveredAt: new Date() }),
        ...(newStatus === 'read' && { readAt: new Date() }),
      },
    });

    console.log(`✅ [Status] Updated successfully`);
  } catch (error: any) {
    console.error('❌ [Status] Error:', error);
  }
}
