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

    // Get all conversation IDs from Redis directly
    const conversationIds = await WhatsAppStorageService.getConversations(dealer.id);
    
    console.log('[Debug] Found conversations:', conversationIds);

    // Get messages for each conversation
    let allRedisMessages: any[] = [];
    for (const contactId of conversationIds) {
      const messages = await WhatsAppStorageService.getConversation(
        dealer.id,
        contactId,
        50
      );
      allRedisMessages.push(...messages);
    }

    // Get Prisma data for comparison
    const prismaConversations = await prisma.whatsAppConversationSummary.findMany({
      where: { dealerId: dealer.id },
      include: { contact: true },
    });

    const prismaMessages = await prisma.whatsAppMessage.findMany({
      where: { dealerId: dealer.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      dealer: {
        id: dealer.id,
        subdomain: dealer.subdomain,
        whatsappPhoneNumberId: dealer.whatsappPhoneNumberId,
      },
      summary: {
        conversations: conversationIds.length,
        prismaMessages: prismaMessages.length,
        redisMessages: allRedisMessages.length,
      },
      data: {
        conversations: conversationIds,
        prismaMessages: prismaMessages,
        redisMessages: allRedisMessages,
      },
    });
  } catch (error: any) {
    console.error('[Debug] Error:', error);
    return NextResponse.json(
      { 
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
