import { Message, MessageDocument } from '../models/Message.js';
import { Thread, ThreadDocument } from '../models/Thread.js';
import { channelService } from './channelService.js';
import {
  generateMessageId,
  CreateMessageDTO,
  UpdateMessageDTO,
  MessageReactionDTO,
} from '../types/index.js';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

export class MessageService {
  /**
   * Send a message to a channel
   */
  async sendMessage(data: CreateMessageDTO): Promise<MessageDocument> {
    // Verify user is member of channel
    const isMember = await channelService.isMember(data.channelId, data.senderId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this channel');
    }

    const messageId = generateMessageId();

    const message = new Message({
      messageId,
      channelId: data.channelId,
      threadId: data.threadId,
      senderId: data.senderId,
      senderName: data.senderName,
      senderAvatar: data.senderAvatar,
      content: data.content,
      messageType: data.messageType || 'text',
      attachments: data.attachments || [],
      mentions: data.mentions || [],
      isEdited: false,
      isDeleted: false,
      replyCount: 0,
    });

    // If this is a thread reply, update parent message and thread
    if (data.threadId) {
      const parentMessage = await this.getMessage(data.threadId);
      parentMessage.incrementReplyCount();
      await parentMessage.save();

      // Update or create thread
      await this.updateThread(data.threadId, data.channelId, data.senderId);
    }

    await message.save();

    // Clear unread for sender (they can see their own messages)
    await channelService.clearUnread(data.channelId, data.senderId);

    // Increment unread for other members
    const channel = await channelService.getChannel(data.channelId);
    const otherMembers = channel.members.filter((m: string) => m !== data.senderId);
    for (const memberId of otherMembers) {
      await channelService.incrementUnread(data.channelId, memberId);
    }

    return message;
  }

  /**
   * Get a message by ID
   */
  async getMessage(messageId: string): Promise<MessageDocument> {
    const message = await Message.findOne({ messageId, isDeleted: false });

    if (!message) {
      throw new NotFoundError('Message', messageId);
    }

    return message;
  }

  /**
   * Get messages for a channel with pagination
   */
  async getChannelMessages(
    channelId: string,
    userId: string,
    options: {
      before?: Date;
      after?: Date;
      limit?: number;
    } = {}
  ): Promise<{ messages: MessageDocument[]; hasMore: boolean }> {
    // Verify user is member of channel
    const isMember = await channelService.isMember(channelId, userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this channel');
    }

    const { before, after, limit = 50 } = options;
    const messages = await Message.findByChannel(channelId, { before, after, limit: limit + 1 });

    const hasMore = messages.length > limit;
    if (hasMore) {
      messages.pop();
    }

    // Clear unread for user
    await channelService.clearUnread(channelId, userId);

    return { messages: messages.reverse(), hasMore };
  }

  /**
   * Get thread replies
   */
  async getThreadReplies(
    parentMessageId: string,
    userId: string,
    options: { before?: Date; limit?: number } = {}
  ): Promise<{ messages: MessageDocument[]; hasMore: boolean }> {
    const parentMessage = await this.getMessage(parentMessageId);
    const channelId = parentMessage.channelId;

    // Verify user is member of channel
    const isMember = await channelService.isMember(channelId, userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this channel');
    }

    const { before, limit = 50 } = options;
    const messages = await Message.findThreadReplies(parentMessageId, { before, limit: limit + 1 });

    const hasMore = messages.length > limit;
    if (hasMore) {
      messages.pop();
    }

    return { messages, hasMore };
  }

  /**
   * Edit a message
   */
  async editMessage(
    messageId: string,
    userId: string,
    data: UpdateMessageDTO
  ): Promise<MessageDocument> {
    const message = await this.getMessage(messageId);

    if (message.senderId !== userId) {
      throw new ForbiddenError('You can only edit your own messages');
    }

    message.content = data.content;
    message.isEdited = true;
    await message.save();

    return message;
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.getMessage(messageId);

    // Allow deletion by sender or channel admin
    const isChannelAdmin = await channelService.isAdmin(message.channelId, userId);
    if (message.senderId !== userId && !isChannelAdmin) {
      throw new ForbiddenError('You can only delete your own messages');
    }

    message.isDeleted = true;
    message.content = '[deleted]';
    message.attachments = [];
    await message.save();
  }

  /**
   * Add reaction to a message
   */
  async addReaction(
    messageId: string,
    userId: string,
    reaction: MessageReactionDTO
  ): Promise<MessageDocument> {
    const message = await this.getMessage(messageId);

    // Check if already reacted
    if (message.hasReacted(reaction.emoji, userId)) {
      // Toggle off (remove)
      message.removeReaction(reaction.emoji, userId);
    } else {
      message.addReaction(reaction.emoji, reaction.userId, reaction.userName);
    }

    await message.save();
    return message;
  }

  /**
   * Start a thread (convert message to thread)
   */
  async startThread(
    messageId: string,
    userId: string,
    userName: string,
    content: string
  ): Promise<MessageDocument> {
    const parentMessage = await this.getMessage(messageId);

    // Send the first reply
    const reply = await this.sendMessage({
      channelId: parentMessage.channelId,
      threadId: parentMessage.messageId,
      senderId: userId,
      senderName: userName,
      content,
      messageType: 'text',
    });

    return reply;
  }

  /**
   * Search messages in a channel
   */
  async searchMessages(
    channelId: string,
    userId: string,
    searchTerm: string,
    options: { limit?: number; skip?: number } = {}
  ): Promise<MessageDocument[]> {
    // Verify user is member of channel
    const isMember = await channelService.isMember(channelId, userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this channel');
    }

    return Message.searchMessages(channelId, searchTerm, options);
  }

  /**
   * Get unread messages count
   */
  async getUnreadCount(channelId: string, userId: string): Promise<number> {
    const channel = await channelService.getChannel(channelId);
    if (channel.unreadCount instanceof Map) {
      return channel.unreadCount.get(userId) || 0;
    }
    return 0;
  }

  /**
   * Get message stats for a channel
   */
  async getChannelStats(channelId: string): Promise<{
    totalMessages: number;
    messagesByType: Record<string, number>;
    topSenders: Array<{ senderId: string; count: number }>;
  }> {
    return Message.getChannelStats(channelId);
  }

  /**
   * Get threads for a channel
   */
  async getChannelThreads(
    channelId: string,
    userId: string,
    options: { limit?: number; before?: Date } = {}
  ): Promise<ThreadDocument[]> {
    // Verify user is member of channel
    const isMember = await channelService.isMember(channelId, userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this channel');
    }

    return Thread.findByChannel(channelId, options);
  }

  /**
   * Update thread after a reply
   */
  private async updateThread(
    parentMessageId: string,
    channelId: string,
    userId: string
  ): Promise<ThreadDocument> {
    let thread = await Thread.findOne({ parentMessageId });

    if (!thread) {
      thread = new Thread({
        threadId: `THREAD-${uuidv4().substring(0, 8).toUpperCase()}`,
        parentMessageId,
        channelId,
        replyCount: 0,
        lastReplyAt: new Date(),
        participantIds: [userId],
      });
    } else {
      thread.incrementReplyCount();
      thread.addParticipant(userId);
    }

    await thread.save();
    return thread;
  }

  /**
   * Post a system message to a channel
   */
  async postSystemMessage(
    channelId: string,
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<MessageDocument> {
    const messageId = generateMessageId();

    const message = new Message({
      messageId,
      channelId,
      senderId: 'system',
      senderName: 'System',
      content,
      messageType: 'system',
      isEdited: false,
      isDeleted: false,
      replyCount: 0,
    });

    await message.save();
    return message;
  }

  /**
   * Get messages by sender
   */
  async getMessagesBySender(
    senderId: string,
    options: { limit?: number; before?: Date } = {}
  ): Promise<MessageDocument[]> {
    const { limit = 50, before } = options;
    const query: Record<string, unknown> = { senderId, isDeleted: false };

    if (before) {
      query.createdAt = { $lt: before };
    }

    return Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

export const messageService = new MessageService();
