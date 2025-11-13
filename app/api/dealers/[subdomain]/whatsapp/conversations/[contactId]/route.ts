import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { WhatsAppStorageService } from '@/lib/services/whatsapp-storage.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string; contactId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subdomain, contactId } = await params;

    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: { id: true, email: true },
    });

    if (!dealer || session.user.email !== dealer.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get messages from Redis
    const messages = await WhatsAppStorageService.getConversation(
      dealer.id,
      contactId,
      100 // Get up to 100 messages
    );

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Extract contact info from messages
    const phoneNumber = contactId.replace('contact_', '');
    const contact = {
      id: contactId,
      phoneNumber,
      name: phoneNumber,
      optedIn: true,
    };

    // Mark as read
    await WhatsAppStorageService.markAsRead(dealer.id, contactId);

    console.log('[Conversation] Returning', messages.length, 'messages for', contactId);

    return NextResponse.json({ contact, messages });
  } catch (error: any) {
    console.error('[Conversation] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
