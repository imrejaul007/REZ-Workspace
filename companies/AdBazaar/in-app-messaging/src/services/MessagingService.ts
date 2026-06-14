import { Message, IMessage } from '../models/Message';
import { Conversation, IConversation } from '../models/Conversation';
import { Notification, INotification } from '../models/Notification';
import { createClient, RedisClientType } from 'redis';
import logger from '../utils/logger';
import { messagesSentTotal, conversationsActiveGauge, unreadMessagesGauge } from '../utils/metrics';

export class MessagingService {
  private redisClient: RedisClientType | null = null;
  private io: any = null;

  async initialize(): Promise<void> {
    try {
      this.redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
      await this.redisClient.connect();
      logger.info('Redis connected for messaging');
    } catch (error) {
      logger.warn('Redis not available, continuing without Redis');
    }
  }

  setSocketIO(io: any): void {
    this.io = io;
  }

  async createConversation(data: {
    participants: Array<{ userId: string; role?: 'owner' | 'member' | 'admin' }>;
    type: 'direct' | 'group' | 'support' | 'campaign';
    title?: string;
    metadata?: Record<string, unknown>;
  }): Promise<IConversation> {
    const participants = data.participants.map(p => ({
      userId: p.userId,
      role: p.role || 'member',
      joinedAt: new Date(),
      notifications: 'all' as const,
    }));

    const conversation = new Conversation({
      participants,
      type: data.type,
      title: data.title,
      metadata: data.metadata,
      isActive: true,
      isPinned: false,
    });

    await conversation.save();
    await this.updateActiveConversationsGauge();

    return conversation;
  }

  async getConversation(id: string): Promise<IConversation | null> {
    return Conversation.findById(id);
  }

  async getUserConversations(userId: string, options: {
    type?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ conversations: IConversation[]; total: number }> {
    const { type, page = 1, limit = 50 } = options;
    const query: Record<string, unknown> = {
      'participants.userId': userId,
      isActive: true,
    };

    if (type) {
      query.type = type;
    }

    const [conversations, total] = await Promise.all([
      Conversation.find(query)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Conversation.countDocuments(query),
    ]);

    return { conversations, total };
  }

  async sendMessage(data: {
    conversationId: string;
    senderId: string;
    senderType?: 'user' | 'advertiser' | 'system' | 'bot';
    content: string;
    messageType?: 'text' | 'image' | 'file' | 'system' | 'action';
    metadata?: Record<string, unknown>;
    attachments?: Array<{ type: 'image' | 'file'; url: string; name: string; size: number }>;
  }): Promise<IMessage> {
    const conversation = await Conversation.findById(data.conversationId);
    if (!conversation) throw new Error('Conversation not found');

    const message = new Message({
      conversationId: conversation._id,
      senderId: data.senderId,
      senderType: data.senderType || 'user',
      content: data.content,
      messageType: data.messageType || 'text',
      metadata: data.metadata,
      attachments: data.attachments,
      status: 'sent',
      readBy: [{ userId: data.senderId, readAt: new Date() }],
    });

    await message.save();

    conversation.lastMessage = {
      messageId: message._id,
      content: data.content.substring(0, 100),
      senderId: data.senderId,
      timestamp: new Date(),
    };
    await conversation.save();

    for (const participant of conversation.participants) {
      if (participant.userId !== data.senderId) {
        await this.createNotification({
          userId: participant.userId,
          type: 'message',
          title: 'New message',
          body: data.content.substring(0, 100),
          data: {
            conversationId: conversation._id,
            messageId: message._id,
          },
        });
      }
    }

    if (this.io) {
      this.io.to(`user:${data.senderId}`).emit('new-message', {
        conversationId: data.conversationId,
        message,
      });
    }

    messagesSentTotal.labels(data.messageType || 'text', 'sent').inc();
    logger.info(`Message sent in conversation ${data.conversationId}`);

    return message;
  }

  async getMessage(id: string): Promise<IMessage | null> {
    return Message.findById(id);
  }

  async getConversationMessages(conversationId: string, options: {
    page?: number;
    limit?: number;
    before?: string;
  } = {}): Promise<{ messages: IMessage[]; total: number }> {
    const { page = 1, limit = 50, before } = options;
    const query: Record<string, unknown> = { conversationId };

    if (before) {
      query._id = { $lt: before };
    }

    const [messages, total] = await Promise.all([
      Message.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Message.countDocuments(query),
    ]);

    return { messages: messages.reverse(), total };
  }

  async markMessagesAsRead(conversationId: string, userId: string, messageIds?: string[]): Promise<void> {
    const query: Record<string, unknown> = {
      conversationId,
      'readBy.userId': { $ne: userId },
    };

    if (messageIds?.length) {
      query._id = { $in: messageIds };
    }

    await Message.updateMany(
      query,
      {
        $push: {
          readBy: { userId, readAt: new Date() },
        },
        $set: { status: 'read' },
      }
    );

    await Conversation.updateOne(
      { _id: conversationId, 'participants.userId': userId },
      { $set: { 'participants.$.lastReadAt': new Date() } }
    );

    await this.updateUnreadCount(userId);
  }

  async createNotification(data: {
    userId: string;
    type: 'message' | 'mention' | 'system' | 'campaign' | 'alert';
    title: string;
    body: string;
    data?: Record<string, unknown>;
    actionUrl?: string;
    expiresAt?: Date;
  }): Promise<INotification> {
    const notification = new Notification({
      ...data,
      read: false,
    });

    await notification.save();

    if (this.io) {
      this.io.to(`user:${data.userId}`).emit('notification', notification);
    }

    return notification;
  }

  async getUserNotifications(userId: string, options: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  } = {}): Promise<{ notifications: INotification[]; total: number; unreadCount: number }> {
    const { page = 1, limit = 50, unreadOnly = false } = options;
    const query: Record<string, unknown> = { userId };

    if (unreadOnly) {
      query.read = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId, read: false }),
    ]);

    return { notifications, total, unreadCount };
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<INotification | null> {
    return Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { $set: { read: true, readAt: new Date() } },
      { new: true }
    );
  }

  async markAllNotificationsAsRead(userId: string): Promise<number> {
    const result = await Notification.updateMany(
      { userId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );
    return result.modifiedCount;
  }

  async broadcastMessage(data: {
    senderId: string;
    senderType?: 'system' | 'bot';
    content: string;
    targetUsers?: string[];
    targetRoles?: string[];
    metadata?: Record<string, unknown>;
  }): Promise<number> {
    const query: Record<string, unknown> = { isActive: true };

    if (data.targetUsers?.length) {
      query['participants.userId'] = { $in: data.targetUsers };
    }

    if (data.targetRoles?.length) {
      query['participants.role'] = { $in: data.targetRoles };
    }

    const conversations = await Conversation.find(query);
    let count = 0;

    for (const conversation of conversations) {
      try {
        await this.sendMessage({
          conversationId: (conversation._id as unknown) as string,
          senderId: data.senderId,
          senderType: data.senderType || 'system',
          content: data.content,
          messageType: 'system',
          metadata: data.metadata,
        });
        count++;
      } catch (error) {
        logger.error(`Failed to send broadcast to conversation ${conversation._id}`, { error });
      }
    }

    return count;
  }

  async updateParticipantSettings(
    conversationId: string,
    userId: string,
    settings: {
      notifications?: 'all' | 'mentions' | 'none';
      isPinned?: boolean;
    }
  ): Promise<IConversation | null> {
    const updateData: Record<string, unknown> = {};

    if (settings.notifications) {
      updateData['participants.$.notifications'] = settings.notifications;
    }

    if (settings.isPinned !== undefined) {
      updateData.isPinned = settings.isPinned;
    }

    return Conversation.findOneAndUpdate(
      { _id: conversationId, 'participants.userId': userId },
      { $set: updateData },
      { new: true }
    );
  }

  async deleteConversation(id: string): Promise<boolean> {
    const result = await Conversation.findByIdAndUpdate(id, { isActive: false });
    if (result) {
      await this.updateActiveConversationsGauge();
      return true;
    }
    return false;
  }

  private async updateActiveConversationsGauge(): Promise<void> {
    const count = await Conversation.countDocuments({ isActive: true });
    conversationsActiveGauge.set(count);
  }

  private async updateUnreadCount(userId: string): Promise<void> {
    const count = await Message.countDocuments({
      'readBy.userId': { $ne: userId },
      conversationId: {
        $in: (await Conversation.find({ 'participants.userId': userId, isActive: true })).map(c => c._id),
      },
    });
    unreadMessagesGauge.set(count);
  }

  async cleanup(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}

export const messagingService = new MessagingService();