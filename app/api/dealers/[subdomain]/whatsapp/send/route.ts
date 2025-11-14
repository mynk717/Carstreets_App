import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { WhatsAppStorageService } from '@/lib/services/whatsapp-storage.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subdomain } = await params;
    const { to, message } = await request.json();

    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: {
        id: true,
        email: true,
        whatsappPhoneNumberId: true,
        metaAccessToken: true,
      },
    });

    if (!dealer || session.user.email !== dealer.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!dealer.whatsappPhoneNumberId || !dealer.metaAccessToken) {
      return NextResponse.json({ error: 'WhatsApp not connected' }, { status: 400 });
    }

    // Send via WhatsApp API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${dealer.whatsappPhoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${dealer.metaAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: { body: message },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('[Send] Meta API error:', data);
      return NextResponse.json({ error: data.error?.message || 'Failed to send' }, { status: 400 });
    }

    // Save to Redis
    await WhatsAppStorageService.saveMessage({
      id: data.messages[0].id,
      dealerId: dealer.id,
      contactId: `contact_${to}`,
      phoneNumber: to,
      direction: 'outbound',
      content: message,
      messageType: 'text',
      status: 'sent',
      timestamp: Date.now(),
      webhookData: data,
    });

    return NextResponse.json({ success: true, messageId: data.messages[0].id });
  } catch (error: any) {
    console.error('[Send] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
