import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export interface WhatsAppMessage {
  id: string;
  dealerId: string;
  contactId: string;
  phoneNumber: string;
  direction: 'inbound' | 'outbound';
  content: string;
  messageType: 'text' | 'template' | 'image' | 'document';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: number;
  templateName?: string;
  mediaUrl?: string;
  error?: string;
  webhookData?: any;
}

const MESSAGE_TTL = 90 * 24 * 60 * 60; // 90 days

export class WhatsAppStorageService {
  /**
   * Save a message to Redis with auto-expiry
   */
  static async saveMessage(message: WhatsAppMessage): Promise<void> {
    const messageKey = `whatsapp:${message.dealerId}:msg:${message.id}`;
    const conversationKey = `whatsapp:${message.dealerId}:conv:${message.contactId}`;

    // Store full message with TTL
    await redis.setex(messageKey, MESSAGE_TTL, JSON.stringify(message));

    // Add to conversation sorted set (score = timestamp for ordering)
    await redis.zadd(conversationKey, {
      score: message.timestamp,
      member: message.id,
    });

    // Set TTL on conversation index
    await redis.expire(conversationKey, MESSAGE_TTL);

    console.log(`✅ Message saved: ${message.id} (${message.direction})`);
  }

  /**
   * Get conversation messages (paginated)
   */
  static async getConversation(
    dealerId: string,
    contactId: string,
    limit = 50,
    before?: number
  ): Promise<WhatsAppMessage[]> {
    try {
      const conversationKey = `whatsapp:${dealerId}:conv:${contactId}`;
    
      // Get all message IDs in chronological order (oldest to newest)
      const allMessageIds = await redis.zrange(conversationKey, 0, -1);
    
      if (!allMessageIds || allMessageIds.length === 0) {
        return [];
      }
    
      // Get last N messages (most recent)
      let messageIds = before
        ? allMessageIds
            .filter((id: any) => {
              // If your message ID contains timestamp, extract it
              // Otherwise, you'd need to fetch the message
              return true; // Simplified - implement proper filtering if needed
            })
            .slice(-limit) // ✅ FIX: Last N messages
        : allMessageIds.slice(-limit); // ✅ FIX: Last N messages
    
      if (messageIds.length === 0) {
        return [];
      }
    
      // Batch fetch using pipeline
      const pipeline = redis.pipeline();
      messageIds.forEach((id: any) => {
        const messageKey = `whatsapp:${dealerId}:msg:${id}`;
        pipeline.get(messageKey);
      });

      const results = await pipeline.exec();

      if (!results) {
        return [];
      }

      // ✅ FIX: Parse pipeline results - format is [error, data]
      const messages = results
        .map((result: any) => {
          const [error, data] = result; // ← FIXED: Correct destructuring
          
          if (error) {
            console.error('[Storage] Pipeline error:', error);
            return null;
          }
          
          if (!data) return null;
          
          try {
            if (typeof data === 'string') {
              return JSON.parse(data) as WhatsAppMessage;
            }
            return data as WhatsAppMessage;
          } catch (e) {
            console.error('[Storage] Parse error:', e);
            return null;
          }
        })
        .filter((m): m is WhatsAppMessage => m !== null);

      return messages;
    } catch (error) {
      console.error('[Storage] getConversation error:', error);
      return [];
    }
  }

  /**
   * Get all conversations for a dealer
   */
  static async getConversations(dealerId: string): Promise<string[]> {
    const pattern = `whatsapp:${dealerId}:conv:*`;
    const keys = await redis.keys(pattern);
    
    // Extract contact IDs from keys
    return keys.map(key => key.split(':')[3]);
  }

  /**
   * Delete a conversation
   */
  static async deleteConversation(dealerId: string, contactId: string): Promise<void> {
    const conversationKey = `whatsapp:${dealerId}:conv:${contactId}`;
    
    // Get all message IDs
    const messageIds = await redis.zrange(conversationKey, 0, -1);
    
    // Delete all messages
    const deletePromises = messageIds.map(id => 
      redis.del(`whatsapp:${dealerId}:msg:${id}`)
    );
    
    await Promise.all(deletePromises);
    
    // Delete conversation index
    await redis.del(conversationKey);
    
    console.log(`🗑️ Deleted conversation: ${contactId}`);
  }

  /**
   * Mark messages as read
   */
  static async markAsRead(dealerId: string, contactId: string): Promise<void> {
    const messages = await this.getConversation(dealerId, contactId, 100);
    
    const updatePromises = messages
      .filter(m => m.direction === 'inbound' && m.status !== 'read')
      .map(m => {
        const updatedMessage = { ...m, status: 'read' as const };
        return this.saveMessage(updatedMessage);
      });
    
    await Promise.all(updatePromises);
  }
}
