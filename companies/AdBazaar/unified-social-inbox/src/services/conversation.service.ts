import { v4 as uuidv4 } from 'uuid';
import { Conversation, Message, InboxSettings } from '../models';
import { ConversationDocument, MessageDocument, InboxSettingsDocument } from '../models';
import {
  Platform, ConversationStatus, Priority, Sentiment,
  ConversationFilters, PaginatedResult, InboxStats
} from '../types';
import { createModuleLogger } from 'utils/logger.js';
import {
  CreateConversationSchema,
  UpdateConversationSchema,
  AssignConversationSchema,
  UpdateTagsSchema,
  UpdateStatusSchema,
  SnoozeSchema
} from '../utils/validators';

const logger = createModuleLogger('ConversationService');

export class ConversationService {
  /**
   * Create a new conversation
   */
  async createConversation(data: {
    platform: Platform;
    platformConversationId: string;
    user: {
      platformUserId: string;
      username: string;
      displayName: string;
      profileImage?: string;
      followerCount?: number;
    };
    accountId: string;
  }): Promise<ConversationDocument> {
    try {
      // Check if conversation already exists
      const existing = await Conversation.findOne({
        platformConversationId: data.platformConversationId,
        platform: data.platform
      });

      if (existing) {
        logger.info('Conversation already exists', {
          platformConversationId: data.platformConversationId
        });
        return existing;
      }

      const conversation = new Conversation({
        ...data,
        unreadCount: 0,
        status: 'active',
        tags: [],
        priority: 'medium',
      });

      await conversation.save();
      logger.info('Conversation created', { id: conversation._id });
      return conversation;
    } catch (error) {
      logger.error('Failed to create conversation', { error, data });
      throw error;
    }
  }

  /**
   * Get all conversations with filters and pagination
   */
  async getConversations(
    accountId: string,
    filters: ConversationFilters,
    pagination: { page: number; limit: number; sortBy: string; sortOrder: 'asc' | 'desc' }
  ): Promise<PaginatedResult<ConversationDocument>> {
    try {
      const query: Record<string, unknown> = { accountId };

      if (filters.platform) query.platform = filters.platform;
      if (filters.status) query.status = filters.status;
      if (filters.priority) query.priority = filters.priority;
      if (filters.assignee) query.assignee = filters.assignee;
      if (filters.sentiment) query.sentiment = filters.sentiment;
      if (filters.tags && filters.tags.length > 0) {
        query.tags = { $in: filters.tags };
      }
      if (filters.search) {
        query.$or = [
          { 'user.username': { $regex: filters.search, $options: 'i' } },
          { 'user.displayName': { $regex: filters.search, $options: 'i' } },
          { 'lastMessage.content': { $regex: filters.search, $options: 'i' } },
        ];
      }
      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) (query.createdAt as Record<string, Date>).$gte = new Date(filters.dateFrom);
        if (filters.dateTo) (query.createdAt as Record<string, Date>).$lte = new Date(filters.dateTo);
      }

      // Handle snoozed conversations - show if snooze has expired
      const now = new Date();
      query.$or = [
        { status: { $ne: 'snoozed' } },
        { snoozedUntil: { $lte: now } },
      ];

      const sortDirection = pagination.sortOrder === 'asc' ? 1 : -1;
      const sortOptions: Record<string, 1 | -1> = {};

      // Priority sorting - high priority first
      if (pagination.sortBy === 'priority') {
        sortOptions.priority = -1 as const;
        sortOptions.updatedAt = sortDirection;
      } else {
        sortOptions[pagination.sortBy] = sortDirection;
      }

      const skip = (pagination.page - 1) * pagination.limit;

      const [conversations, total] = await Promise.all([
        Conversation.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(pagination.limit)
          .lean(),
        Conversation.countDocuments(query),
      ]);

      return {
        data: conversations as ConversationDocument[],
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      };
    } catch (error) {
      logger.error('Failed to get conversations', { error, accountId, filters });
      throw error;
    }
  }

  /**
   * Get conversations by platform
   */
  async getConversationsByPlatform(
    accountId: string,
    platform: Platform,
    pagination: { page: number; limit: number; sortBy: string; sortOrder: 'asc' | 'desc' }
  ): Promise<PaginatedResult<ConversationDocument>> {
    return this.getConversations(accountId, { platform }, pagination);
  }

  /**
   * Get single conversation by ID
   */
  async getConversationById(conversationId: string): Promise<ConversationDocument | null> {
    return Conversation.findById(conversationId);
  }

  /**
   * Get conversation by platform conversation ID
   */
  async getConversationByPlatformId(
    platform: Platform,
    platformConversationId: string
  ): Promise<ConversationDocument | null> {
    return Conversation.findOne({ platform, platformConversationId });
  }

  /**
   * Update conversation
   */
  async updateConversation(
    conversationId: string,
    updates: Partial<{
      status: ConversationStatus;
      priority: Priority;
      sentiment: Sentiment;
      tags: string[];
      assignee: string;
      snoozedUntil: Date;
    }>
  ): Promise<ConversationDocument | null> {
    try {
      const conversation = await Conversation.findByIdAndUpdate(
        conversationId,
        { $set: updates },
        { new: true }
      );

      if (conversation) {
        logger.info('Conversation updated', { id: conversationId, updates });
      }
      return conversation;
    } catch (error) {
      logger.error('Failed to update conversation', { error, conversationId });
      throw error;
    }
  }

  /**
   * Assign conversation to an agent
   */
  async assignConversation(
    conversationId: string,
    assignee: string
  ): Promise<ConversationDocument | null> {
    return this.updateConversation(conversationId, { assignee });
  }

  /**
   * Update conversation tags
   */
  async updateTags(
    conversationId: string,
    tags: string[]
  ): Promise<ConversationDocument | null> {
    return this.updateConversation(conversationId, { tags });
  }

  /**
   * Update conversation status
   */
  async updateStatus(
    conversationId: string,
    status: ConversationStatus
  ): Promise<ConversationDocument | null> {
    const updates: Partial<{ status: ConversationStatus; snoozedUntil: null }> = { status };

    // Clear snoozedUntil if reopening
    if (status === 'active') {
      updates.snoozedUntil = null;
    }

    return this.updateConversation(conversationId, updates);
  }

  /**
   * Snooze conversation
   */
  async snoozeConversation(
    conversationId: string,
    durationMinutes: number
  ): Promise<ConversationDocument | null> {
    const snoozedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
    return this.updateConversation(conversationId, {
      status: 'snoozed',
      snoozedUntil,
    });
  }

  /**
   * Unsnooze conversation
   */
  async unsnoozeConversation(conversationId: string): Promise<ConversationDocument | null> {
    return this.updateConversation(conversationId, {
      status: 'active',
      snoozedUntil: null,
    });
  }

  /**
   * Update last message in conversation
   */
  async updateLastMessage(
    conversationId: string,
    message: { content: string; sender: 'user' | 'agent'; timestamp: Date }
  ): Promise<void> {
    try {
      await Conversation.findByIdAndUpdate(conversationId, {
        $set: { lastMessage: message },
        $inc: message.sender === 'user' ? { unreadCount: 1 } : {},
      });
    } catch (error) {
      logger.error('Failed to update last message', { error, conversationId });
    }
  }

  /**
   * Mark conversation as read
   */
  async markAsRead(conversationId: string): Promise<void> {
    try {
      await Conversation.findByIdAndUpdate(conversationId, { $set: { unreadCount: 0 } });
    } catch (error) {
      logger.error('Failed to mark conversation as read', { error, conversationId });
    }
  }

  /**
   * Get inbox statistics
   */
  async getInboxStats(accountId: string): Promise<InboxStats> {
    try {
      const matchStage = { accountId };

      const [
        totalCount,
        statusCounts,
        priorityCounts,
        platformCounts,
        sentimentCounts,
      ] = await Promise.all([
        Conversation.countDocuments(matchStage),
        Conversation.aggregate([
          { $match: matchStage },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        Conversation.aggregate([
          { $match: { ...matchStage, status: 'active' } },
          { $group: { _id: '$priority', count: { $sum: 1 } } },
        ]),
        Conversation.aggregate([
          { $match: matchStage },
          { $group: { _id: '$platform', count: { $sum: 1 } } },
        ]),
        Conversation.aggregate([
          { $match: { ...matchStage, sentiment: { $exists: true } } },
          { $group: { _id: '$sentiment', count: { $sum: 1 } } },
        ]),
      ]);

      const unreadCount = await Conversation.countDocuments({
        ...matchStage,
        unreadCount: { $gt: 0 },
      });

      // Calculate averages from message data
      const messageStats = await Message.aggregate([
        {
          $lookup: {
            from: 'conversations',
            localField: 'conversationId',
            foreignField: '_id',
            as: 'conversation',
          },
        },
        { $unwind: '$conversation' },
        { $match: { 'conversation.accountId': accountId } },
        {
          $group: {
            _id: null,
            avgResponseTime: { $avg: '$metadata.responseTime' },
          },
        },
      ]);

      // Build response
      const stats: InboxStats = {
        total: totalCount,
        active: 0,
        closed: 0,
        snoozed: 0,
        unread: unreadCount,
        byPlatform: { instagram: 0, facebook: 0, twitter: 0, linkedin: 0, whatsapp: 0 },
        byPriority: { low: 0, medium: 0, high: 0 },
        avgResponseTime: messageStats[0]?.avgResponseTime || 0,
        avgResolutionTime: 0,
        sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
      };

      // Populate status counts
      for (const item of statusCounts) {
        if (item._id === 'active') stats.active = item.count;
        else if (item._id === 'closed') stats.closed = item.count;
        else if (item._id === 'snoozed') stats.snoozed = item.count;
      }

      // Populate priority counts
      for (const item of priorityCounts) {
        stats.byPriority[item._id as Priority] = item.count;
      }

      // Populate platform counts
      for (const item of platformCounts) {
        stats.byPlatform[item._id as Platform] = item.count;
      }

      // Populate sentiment counts
      for (const item of sentimentCounts) {
        stats.sentimentBreakdown[item._id as Sentiment] = item.count;
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get inbox stats', { error, accountId });
      throw error;
    }
  }

  /**
   * Search conversations
   */
  async searchConversations(
    accountId: string,
    query: string
  ): Promise<ConversationDocument[]> {
    try {
      return Conversation.find({
        accountId,
        $or: [
          { 'user.username': { $regex: query, $options: 'i' } },
          { 'user.displayName': { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } },
        ],
      }).limit(50);
    } catch (error) {
      logger.error('Failed to search conversations', { error, accountId, query });
      throw error;
    }
  }

  /**
   * Export conversations
   */
  async exportConversations(
    accountId: string,
    filters: ConversationFilters
  ): Promise<ConversationDocument[]> {
    const result = await this.getConversations(
      accountId,
      filters,
      { page: 1, limit: 10000, sortBy: 'createdAt', sortOrder: 'asc' }
    );
    return result.data;
  }
}