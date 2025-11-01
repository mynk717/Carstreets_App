// app/api/webhooks/whatsapp/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('📨 Incoming WhatsApp Webhook:', JSON.stringify(body, null, 2));

    // Handle different event types
    if (body.entry?.[0]?.changes?.[0]?.value?.messages) {
      await handleIncomingMessages(body);
    }

    if (body.entry?.[0]?.changes?.[0]?.value?.statuses) {
      await handleMessageStatus(body);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Webhook verification from Meta
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0';
  const challenge = request.nextUrl.searchParams.get('hub.challenge');
  const token = request.nextUrl.searchParams.get('hub.verify_token');

  console.log('🔐 Webhook verification attempt:', { token, challenge });

  if (token === verifyToken) {
    console.log('✅ Webhook verified successfully');
    return new Response(challenge, { status: 200 });
  }

  console.log('❌ Webhook verification failed');
  return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
}

/**
 * Handle incoming customer messages
 */
async function handleIncomingMessages(body: any) {
  const messages = body.entry?.[0]?.changes?.[0]?.value?.messages || [];
  const contacts = body.entry?.[0]?.changes?.[0]?.value?.contacts || [];

  const phoneNumberId = body.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
  const dealer = await prisma.dealer.findFirst({
    where: { whatsappPhoneNumberId: phoneNumberId }
  });
  if (!dealer) {
    console.warn('No dealer found for phone:', phoneNumberId);
    return NextResponse.json({ success: true }); // Always return 200 to Meta
  }
  const dealerId = dealer.id;

  for (const message of messages) {
    try {
      const {
        from,
        id: messageId,
        timestamp,
        type,
        text,
        interactive,
      } = message;

      // Get contact name if available
      const contact = contacts.find(c => c.wa_id === from);
      const contactName = contact?.profile?.name || from;

      console.log('📩 New WhatsApp Message:', {
        from,
        contactName,
        messageId,
        type,
        text: text?.body,
      });

      // Get message content based on type
      let messageContent = '';
      if (type === 'text') {
        messageContent = text?.body || '';
      } else if (type === 'interactive') {
        messageContent = interactive?.button_reply?.title || 'Interactive message';
      } else if (type === 'image' || type === 'document' || type === 'video') {
        messageContent = `[${type.toUpperCase()}] ${message[type]?.caption || 'File received'}`;
      }

      // Find or create contact
      let contactRecord = await prisma.whatsAppContact.findFirst({
        where: {
          dealerId,
          phoneNumber: from,
        },
      });

      if (!contactRecord) {
        contactRecord = await prisma.whatsAppContact.create({
          data: {
            dealerId,
            phoneNumber: from,
            name: contactName,
          },
        });
        console.log('✅ New contact created:', contactRecord.id);
      }

      // Save message to database
      await prisma.whatsAppMessage.create({
        data: {
          dealerId,
          contactId: contactRecord.id,
          phoneNumber: from,
          messageType: type,
          content: messageContent,
          messageId,
          status: 'received',
        },
      });

      console.log('✅ Message saved to database');

      // TODO: Add AI response logic here
      // For now, just log
    } catch (error) {
      console.error('❌ Error processing message:', error);
    }
  }
}

/**
 * Handle message delivery/read status
 */
async function handleMessageStatus(body: any) {
  const statuses = body.entry?.[0]?.changes?.[0]?.value?.statuses || [];

  for (const status of statuses) {
    try {
      const { id: messageId, status: deliveryStatus, timestamp } = status;

      console.log('📊 Message Status Update:', {
        messageId,
        status: deliveryStatus,
      });

      // Update message status in database
      await prisma.whatsAppMessage.updateMany({
        where: { messageId },
        data: {
          status: deliveryStatus,
          deliveredAt: deliveryStatus === 'delivered' ? new Date() : undefined,
          readAt: deliveryStatus === 'read' ? new Date() : undefined,
          updatedAt: new Date(),
        },
      });

      console.log('✅ Status updated in database');
    } catch (error) {
      console.error('❌ Error processing status:', error);
    }
  }
}
