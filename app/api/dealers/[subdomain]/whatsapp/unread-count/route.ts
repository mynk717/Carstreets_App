import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WhatsAppStorageService } from '@/lib/services/whatsapp-storage.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params;

    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: { id: true },
    });

    if (!dealer) {
      return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });
    }

    // Get all conversations
    const contactIds = await WhatsAppStorageService.getConversations(dealer.id);

    // Count unread messages across all conversations
    let totalUnread = 0;
    for (const contactId of contactIds) {
      const messages = await WhatsAppStorageService.getConversation(dealer.id, contactId, 100);
      const unread = messages.filter(
        m => m.direction === 'inbound' && m.status !== 'read'
      ).length;
      totalUnread += unread;
    }

    return NextResponse.json({ count: totalUnread });
  } catch (error: any) {
    console.error('[Unread Count] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
