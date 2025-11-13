import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppStorageService } from '@/lib/services/whatsapp-storage.service';
import { DealerCacheService } from '@/lib/services/dealer-cache.service';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified successfully');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Webhook] Received:', JSON.stringify(body, null, 2));

    // WAIT for processing instead of fire-and-forget
    await processWebhookAsync(body);

    return NextResponse.json({ status: 'received' }, { status: 200 });
  } catch (error: any) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 200 });
  }
}


async function processWebhookAsync(body: any) {
  try {
    if (!body.entry || !body.entry[0]) {
      console.log('No entry in webhook payload');
      return;
    }
    
    const entry = body.entry[0];
    
    if (!entry.changes || !entry.changes[0]) {
      console.log('No changes in webhook payload');
      return;
    }
    
    const changes = entry.changes[0];
    const value = changes.value;

    if (!value) {
      console.log('No value in webhook payload');
      return;
    }

    if (value.messages) {
      console.log('Processing messages:', value.messages.length);
      for (const message of value.messages) {
        await handleIncomingMessage(message, value.metadata);
      }
    }

    if (value.statuses) {
      console.log('Processing status updates:', value.statuses.length);
      for (const status of value.statuses) {
        await handleStatusUpdate(status);
      }
    }

    console.log('Webhook processing completed');
  } catch (error: any) {
    console.error('Webhook processing failed:', error);
  }
}

async function handleIncomingMessage(message: any, metadata: any) {
  try {
    const phoneNumberId = metadata.phone_number_id;
    const from = message.from;
    const messageId = message.id;
    const timestamp = parseInt(message.timestamp) * 1000;

    console.log('Processing message', messageId, 'from', from);

    const dealer = await DealerCacheService.getDealerByPhoneId(phoneNumberId);

    if (!dealer) {
      console.error('No dealer cached for phoneNumberId:', phoneNumberId);
      console.error('Run sync: /api/cron/sync-dealers');
      return;
    }

    console.log('Dealer found:', dealer.subdomain);

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

    const contactId = 'contact_' + from;

    await WhatsAppStorageService.saveMessage({
      id: messageId,
      dealerId: dealer.id,
      contactId: contactId,
      phoneNumber: from,
      direction: 'inbound',
      content,
      messageType,
      status: 'delivered',
      timestamp,
      mediaUrl: mediaUrl || undefined,
      webhookData: message,
    });

    console.log('Message saved:', messageId);
  } catch (error: any) {
    console.error('Message handling error:', error);
  }
}

async function handleStatusUpdate(status: any) {
  try {
    console.log('Status update:', status.id, '->', status.status);
  } catch (error: any) {
    console.error('Status update error:', error);
  }
}