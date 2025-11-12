// app/api/dealers/[subdomain]/whatsapp/debug/route.ts
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
      select: {
        id: true,
        subdomain: true,
        whatsappPhoneNumberId: true,
      },
    });

    if (!dealer) {
      return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });
    }

    // Check conversations
    const conversations = await prisma.whatsAppConversationSummary.findMany({
      where: { dealerId: dealer.id },
      include: {
        contact: true,
      },
    });

    // Check messages in PostgreSQL
    const prismaMessages = await prisma.whatsAppMessage.findMany({
      where: { dealerId: dealer.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        contact: {
          select: {
            name: true,
            phoneNumber: true,
          },
        },
      },
    });

    // Check Redis - use getConversation instead of getMessages
    let redisMessages: any[] = [];
    try {
      for (const conv of conversations) {
        // ✅ FIXED: Use getConversation instead of getMessages
        const msgs = await WhatsAppStorageService.getConversation(
          dealer.id,
          conv.contactId,
          50
        );
        redisMessages.push(...msgs);
      }
    } catch (error) {
      console.error('Redis error:', error);
    }

    return NextResponse.json({
      dealer: {
        id: dealer.id,
        subdomain: dealer.subdomain,
        whatsappPhoneNumberId: dealer.whatsappPhoneNumberId,
      },
      summary: {
        conversations: conversations.length,
        prismaMessages: prismaMessages.length,
        redisMessages: redisMessages.length,
      },
      data: {
        conversations: conversations.map((conv) => ({
          contactId: conv.contactId,
          contactName: conv.contact.name,
          contactPhone: conv.contact.phoneNumber,
          lastMessageAt: conv.lastMessageAt,
          lastMessagePreview: conv.lastMessagePreview,
          unreadCount: conv.unreadCount,
          totalMessages: conv.totalMessages,
        })),
        prismaMessages: prismaMessages.map((msg) => ({
          id: msg.id,
          messageId: msg.messageId,
          contactName: msg.contact?.name,
          contactPhone: msg.phoneNumber,
          direction: msg.direction,
          messageType: msg.messageType,
          content: msg.content,
          status: msg.status,
          createdAt: msg.createdAt,
        })),
        redisMessages: redisMessages.map((msg) => ({
          id: msg.id,
          phoneNumber: msg.phoneNumber,
          direction: msg.direction,
          content: msg.content,
          messageType: msg.messageType,
          status: msg.status,
          timestamp: new Date(msg.timestamp).toISOString(),
        })),
      },
    });
  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
