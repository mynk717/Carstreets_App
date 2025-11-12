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


// Incoming message handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📩 Incoming webhook:', JSON.stringify(body, null, 2));

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value) {
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    if (value.messages) {
      for (const message of value.messages) {
        await handleIncomingMessage(message, value.metadata);
      }
    }

    if (value.statuses) {
      for (const status of value.statuses) {
        await handleStatusUpdate(status, value.metadata);
      }
    }

    return NextResponse.json({ status: 'received' }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ status: 'error', error: error.message }, { status: 200 });
  }
}

async function handleIncomingMessage(message: any, metadata: any) {
  try {
    const phoneNumberId = metadata.phone_number_id;
    const from = message.from;
    const messageId = message.id;
    const timestamp = parseInt(message.timestamp) * 1000;

    // Get dealer with fallback lookup
    const dealer = await getDealerByPhoneNumberId(phoneNumberId, from);

    if (!dealer) {
      console.warn(`⚠️ No dealer found for phone number ID: ${phoneNumberId} and sender ${from}`);
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

    // Extract content
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

    await prisma.whatsAppMessage.create({
      data: {
        dealerId: dealer.id,
        contactId: contact.id,
        phoneNumber: from,
        messageType,
        messageId,
        status: 'delivered',
        direction: 'inbound',
        content: '',
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
  } catch (error: any) {
    console.error('❌ Error handling status update:', error);
  }
}
