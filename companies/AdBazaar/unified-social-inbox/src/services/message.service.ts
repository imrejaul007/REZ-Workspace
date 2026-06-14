import { Message, Conversation } from '../models';
import { MessageDocument, ConversationDocument } from '../models';
import { Platform, PaginatedResult, MessageMetadata } from '../types';
import { createModuleLogger } from 'utils/logger.js';
import { PlatformConnectorService } from './platform-connector.service';

const logger = createModuleLogger('MessageService');

export class MessageService {
  constructor(private platformConnector: PlatformConnectorService) {}

  /**
   * Create a new message
   */
  async createMessage(data: {
    conversationId: string;
    platform: Platform;
    platformMessageId: string;
    sender: {
      type: 'user' | 'agent';
      platformUserId?: string;
      agentId?: string;
    };
    content: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video' | 'audio';
    timestamp?: Date;
    metadata?: MessageMetadata;
  }): Promise<MessageDocument> {
    try {
      const message = new Message({
        ...data,
        timestamp: data.timestamp || new Date(),
        read: data.sender.type === 'agent',
      });

      await message.save();

      // Update conversation's last message
      await Conversation.findByIdAndUpdate(data.conversationId, {
        $set: {
          lastMessage: {
            content: data.content,
            sender: data.sender.type,
            timestamp: data.timestamp || new Date(),
          },
        },
        ...(data.sender.type === 'user' ? { $inc: { unreadCount: 1 } } : {}),
      });

      logger.info('Message created', { id: message._id, conversationId: data.conversationId });
      return message;
    } catch (error) {
      logger.error('Failed to create message', { error, data });
      throw error;
    }
  }

  /**
   * Get messages for a conversation thread
   */
  async getThreadMessages(
    conversationId: string,
    pagination: { page: number; limit: number }
  ): Promise<PaginatedResult<MessageDocument>> {
    try {
      const skip = (pagination.page - 1) * pagination.limit;

      const [messages, total] = await Promise.all([
        Message.find({ conversationId })
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(pagination.limit)
          .lean(),
        Message.countDocuments({ conversationId }),
      ]);

      // Mark messages as read
      await Message.updateMany(
        { conversationId, read: false, 'sender.type': 'user' },
        { $set: { read: true } }
      );

      return {
        data: messages as MessageDocument[],
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      };
    } catch (error) {
      logger.error('Failed to get thread messages', { error, conversationId });
      throw error;
    }
  }

  /**
   * Get message by ID
   */
  async getMessageById(messageId: string): Promise<MessageDocument | null> {
    return Message.findById(messageId);
  }

  /**
   * Get message by platform message ID
   */
  async getMessageByPlatformId(
    platform: Platform,
    platformMessageId: string
  ): Promise<MessageDocument | null> {
    return Message.findOne({ platform, platformMessageId });
  }

  /**
   * Send message to platform
   */
  async sendMessage(data: {
    platform: Platform;
    platformConversationId: string;
    content: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video' | 'audio';
    recipientId: string;
    agentId?: string;
  }): Promise<MessageDocument> {
    try {
      // Find the conversation
      const conversation = await Conversation.findOne({
        platform: data.platform,
        platformConversationId: data.platformConversationId,
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Send via platform connector
      const platformMessageId = await this.platformConnector.sendMessage(data);

      // Create message record
      const message = await this.createMessage({
        conversationId: conversation._id.toString(),
        platform: data.platform,
        platformMessageId,
        sender: {
          type: 'agent',
          agentId: data.agentId,
        },
        content: data.content,
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType,
        metadata: {
          quickReply: data.mediaUrl ? undefined : undefined,
        },
      });

      logger.info('Message sent', {
        id: message._id,
        platform: data.platform,
        platformConversationId: data.platformConversationId
      });

      return message;
    } catch (error) {
      logger.error('Failed to send message', { error, data });
      throw error;
    }
  }

  /**
   * Reply to thread
   */
  async replyToThread(
    conversationId: string,
    data: {
      content: string;
      mediaUrl?: string;
      mediaType?: 'image' | 'video' | 'audio';
      agentId?: string;
    }
  ): Promise<MessageDocument> {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      return this.sendMessage({
        platform: conversation.platform,
        platformConversationId: conversation.platformConversationId,
        content: data.content,
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType,
        recipientId: conversation.user.platformUserId,
        agentId: data.agentId,
      });
    } catch (error) {
      logger.error('Failed to reply to thread', { error, conversationId });
      throw error;
    }
  }

  /**
   * Forward message to another conversation
   */
  async forwardMessage(
    messageId: string,
    targetConversationId: string
  ): Promise<MessageDocument> {
    try {
      const [message, targetConversation] = await Promise.all([
        Message.findById(messageId),
        Conversation.findById(targetConversationId),
      ]);

      if (!message || !targetConversation) {
        throw new Error('Message or target conversation not found');
      }

      // Remove @mentions and clean content
      const cleanedContent = message.content.replace(/@\w+/g, '').trim();

      return this.sendMessage({
        platform: targetConversation.platform,
        platformConversationId: targetConversation.platformConversationId,
        content: `Forwarded: ${cleanedContent}`,
        mediaUrl: message.mediaUrl,
        mediaType: message.mediaType,
        recipientId: targetConversation.user.platformUserId,
      });
    } catch (error) {
      logger.error('Failed to forward message', { error, messageId, targetConversationId });
      throw error;
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<MessageDocument | null> {
    try {
      const message = await Message.findByIdAndUpdate(
        messageId,
        { $set: { read: true } },
        { new: true }
      );

      if (message) {
        // Update conversation unread count
        await Conversation.findByIdAndUpdate(message.conversationId, {
          $set: { unreadCount: 0 },
        });
      }

      return message;
    } catch (error) {
      logger.error('Failed to mark message as read', { error, messageId });
      throw error;
    }
  }

  /**
   * Mark conversation messages as read
   */
  async markThreadAsRead(conversationId: string): Promise<void> {
    try {
      await Message.updateMany(
        { conversationId, read: false, 'sender.type': 'user' },
        { $set: { read: true } }
      );

      await Conversation.findByIdAndUpdate(conversationId, {
        $set: { unreadCount: 0 },
      });

      logger.info('Thread marked as read', { conversationId });
    } catch (error) {
      logger.error('Failed to mark thread as read', { error, conversationId });
    }
  }

  /**
   * Get unread count for conversation
   */
  async getUnreadCount(conversationId: string): Promise<number> {
    return Message.countDocuments({
      conversationId,
      read: false,
      'sender.type': 'user',
    });
  }

  /**
   * Search messages
   */
  async searchMessages(
    accountId: string,
    query: string
  ): Promise<MessageDocument[]> {
    try {
      const conversations = await Conversation.find({ accountId });
      const conversationIds = conversations.map(c => c._id.toString());

      return Message.find({
        conversationId: { $in: conversationIds },
        content: { $regex: query, $options: 'i' },
      })
        .sort({ timestamp: -1 })
        .limit(100)
        .lean() as unknown as MessageDocument[];
    } catch (error) {
      logger.error('Failed to search messages', { error, accountId, query });
      throw error;
    }
  }
}