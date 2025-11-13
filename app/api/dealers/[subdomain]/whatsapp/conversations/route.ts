import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { WhatsAppStorageService } from '@/lib/services/whatsapp-storage.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subdomain } = await params;

    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: { id: true, email: true },
    });

    if (!dealer || session.user.email !== dealer.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get conversation IDs from Redis
    const contactIds = await WhatsAppStorageService.getConversations(dealer.id);

    console.log('[Conversations] Found contactIds:', contactIds);

    // Build conversation summaries from Redis
    const conversations = await Promise.all(
      contactIds.map(async (contactId) => {
        const messages = await WhatsAppStorageService.getConversation(
          dealer.id,
          contactId,
          1 // Get last message only
        );

        const lastMessage = messages[0];
        const phoneNumber = contactId.replace('contact_', '');

        return {
          id: contactId,
          contactId,
          contact: {
            id: contactId,
            phoneNumber,
            name: phoneNumber, // Use phone as name for now
          },
          lastMessageAt: lastMessage ? new Date(lastMessage.timestamp) : new Date(),
          lastMessagePreview: lastMessage?.content || 'No messages',
          unreadCount: 0,
          archived: false,
        };
      })
    );

    // Sort by most recent
    conversations.sort((a, b) => 
      b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
    );

    console.log('[Conversations] Returning', conversations.length, 'conversations');

    return NextResponse.json({ conversations });
  } catch (error: any) {
    console.error('[Conversations] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
