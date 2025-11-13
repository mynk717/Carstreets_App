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
    const conversationKey = `whatsapp:${dealerId}:conv:${contactId}`;
  
    // Get all message IDs (newest first)
    const allMessageIds = await redis.zrange(conversationKey, 0, -1, {
      rev: true, // Reverse order (newest first)
    });
  
    if (!allMessageIds || allMessageIds.length === 0) {
      return [];
    }
  
    // Filter by timestamp if 'before' is provided, then limit
    let messageIds = allMessageIds;
    if (before) {
      // Filter messages before the given timestamp
      const filtered = [];
      for (const id of allMessageIds) {
        const msg = await redis.get(`whatsapp:${dealerId}:msg:${id}`);
        if (msg) {
          const parsed = JSON.parse(msg as string);
          if (parsed.timestamp < before) {
            filtered.push(id);
          }
        }
        if (filtered.length >= limit) break;
      }
      messageIds = filtered;
    } else {
      messageIds = allMessageIds.slice(0, limit);
    }
  
    // Fetch full messages in parallel
    const messages = await Promise.all(
      messageIds.map(async (id) => {
        const messageKey = `whatsapp:${dealerId}:msg:${id}`;
        const data = await redis.get(messageKey);
        
        if (!data) return null;
        
        // Check if data is already an object or needs parsing
        if (typeof data === 'string') {
          return JSON.parse(data) as WhatsAppMessage;
        }
        
        return data as WhatsAppMessage;
      })
    );    

    return messages.filter((m): m is WhatsAppMessage => m !== null);
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
