/**
 * Message Service
 */

import { v4 as uuidv4 } from 'uuid';
import { MessageModel } from '../models/Message';
import {
  Conversation,
  CreateConversationInput,
  SendMessageInput,
  BulkMessageInput,
} from '../types';

// In-memory conversation store
const conversations = new Map<string, Conversation>();

export class MessageService {
  /**
   * Create a new conversation
   */
  async createConversation(input: CreateConversationInput): Promise<Conversation> {
    // Check for existing active conversation
    const existing = Array.from(conversations.values()).find(
      (c) =>
        c.hotelId === input.hotelId &&
        c.guestId === input.guestId &&
        c.status === 'active'
    );

    if (existing) {
      return existing;
    }

    const conversation: Conversation = {
      id: uuidv4(),
      hotelId: input.hotelId,
      guestId: input.guestId,
      guestName: input.guestName,
      guestPhone: input.guestPhone,
      guestEmail: input.guestEmail,
      bookingId: input.bookingId,
      source: input.source || 'support',
      status: 'active',
      unreadCount: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    conversations.set(conversation.id, conversation);

    // Create initial message if provided
    if (input.initialMessage) {
      const message = new MessageModel({
        id: uuidv4(),
        conversationId: conversation.id,
        senderId: input.guestId,
        senderType: 'guest',
        senderName: input.guestName,
        recipientId: input.hotelId,
        recipientType: 'hotel',
        content: input.initialMessage,
        type: 'text',
      });
      await message.save();

      conversation.lastMessage = {
        content: input.initialMessage.substring(0, 100),
        senderType: 'guest',
        createdAt: new Date(),
      };
    }

    return conversation;
  }

  /**
   * Get conversations
   */
  async getConversations(
    hotelId: string,
    status: string = 'active',
    page: number = 1,
    limit: number = 20
  ): Promise<{
    conversations: Conversation[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    let convList = Array.from(conversations.values());

    if (hotelId) {
      convList = convList.filter((c) => c.hotelId === hotelId);
    }
    if (status) {
      convList = convList.filter((c) => c.status === status);
    }

    // Sort by updatedAt
    convList.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    const total = convList.length;
    const start = (page - 1) * limit;
    const paginated = convList.slice(start, start + limit);

    return {
      conversations: paginated,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
    return conversations.get(conversationId) || null;
  }

  /**
   * Send a message
   */
  async sendMessage(input: SendMessageInput): Promise<any> {
    let conversationId = input.conversationId;

    // Create conversation if not provided
    if (!conversationId && input.metadata?.hotelId && input.metadata?.guestId) {
      const conv = await this.createConversation({
        hotelId: input.metadata.hotelId as string,
        guestId: input.metadata.guestId as string,
        guestName: (input.metadata.guestName as string) || 'Guest',
        source: 'support',
      });
      conversationId = conv.id;
    }

    if (!conversationId) {
      throw new Error('Conversation ID or hotelId/guestId required');
    }

    const conversation = conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const senderId = input.metadata?.senderId as string || 'system';
    const senderType = (input.metadata?.senderType as any) || 'system';
    const senderName = input.metadata?.senderName as string;

    const message = new MessageModel({
      id: uuidv4(),
      conversationId,
      senderId,
      senderType,
      senderName,
      recipientId: input.recipientId,
      recipientType: input.recipientType,
      subject: input.subject,
      content: input.content,
      type: input.type || 'text',
      templateId: input.templateId,
      metadata: input.metadata,
      priority: input.priority || 'normal',
      status: 'sent',
    });

    await message.save();

    // Update conversation
    conversation.lastMessage = {
      content: input.content.substring(0, 100),
      senderType,
      createdAt: new Date(),
    };
    conversation.updatedAt = new Date();
    conversations.set(conversationId, conversation);

    return message.toObject();
  }

  /**
   * Get conversation messages
   */
  async getConversationMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    messages: any[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      MessageModel.find({ conversationId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MessageModel.countDocuments({ conversationId }),
    ]);

    return {
      messages: messages.reverse(),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(messageIds: string[], userId: string): Promise<void> {
    await MessageModel.updateMany(
      { id: { $in: messageIds } },
      {
        $set: { isRead: true },
        $push: { readBy: { userId, readAt: new Date() } },
      }
    );
  }

  /**
   * Send bulk message
   */
  async sendBulkMessage(input: BulkMessageInput): Promise<{
    sent: number;
    failed: number;
    scheduled: number;
  }> {
    const results = { sent: 0, failed: 0, scheduled: 0 };

    for (const guestId of input.guestIds) {
      try {
        // Find conversation
        const conversation = Array.from(conversations.values()).find(
          (c) => c.hotelId === input.hotelId && c.guestId === guestId
        );

        if (conversation) {
          const message = new MessageModel({
            id: uuidv4(),
            conversationId: conversation.id,
            senderId: input.hotelId,
            senderType: 'hotel',
            recipientId: guestId,
            recipientType: 'guest',
            subject: input.subject,
            content: input.content,
            type: 'text',
            metadata: { bulkType: input.type || 'announcement', broadcast: true },
          });
          await message.save();
          results.sent++;
        } else {
          results.failed++;
        }
      } catch (error) {
        results.failed++;
      }
    }

    return results;
  }
}

export const messageService = new MessageService();
