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

    // Get contact details
    const contact = await prisma.whatsAppContact.findUnique({
        where: { id: contactId },
        select: {
          id: true,
          dealerId: true,  // ← ADD THIS LINE
          phoneNumber: true,
          name: true,
          optedIn: true,
        },
      });
  
    if (!contact || contact.dealerId !== dealer.id) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Get messages from Redis
    const messages = await WhatsAppStorageService.getConversation(
      dealer.id,
      contactId,
      50
    );

    // Mark as read
    await WhatsAppStorageService.markAsRead(dealer.id, contactId);
    
    // Reset unread count in summary
    await prisma.whatsAppConversationSummary.update({
      where: {
        dealerId_contactId: {
          dealerId: dealer.id,
          contactId,
        },
      },
      data: {
        unreadCount: 0,
      },
    });

    return NextResponse.json({ contact, messages });
  } catch (error: any) {
    console.error('❌ Get conversation messages error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
