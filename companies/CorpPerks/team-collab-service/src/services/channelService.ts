import { Channel, ChannelDocument } from '../models/Channel.js';
import { generateChannelId, CreateChannelDTO, UpdateChannelDTO } from '../types/index.js';
import { AppError, NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';

export class ChannelService {
  /**
   * Create a new channel
   */
  async createChannel(data: CreateChannelDTO): Promise<ChannelDocument> {
    const channelId = generateChannelId();

    const channel = new Channel({
      channelId,
      name: data.name.startsWith('#') ? data.name : `#${data.name}`,
      description: data.description || '',
      type: data.type,
      companyId: data.companyId,
      projectId: data.projectId,
      members: data.members || [data.createdBy],
      admins: [data.createdBy],
      isArchived: false,
      createdBy: data.createdBy,
    });

    await channel.save();
    return channel;
  }

  /**
   * Get channel by ID
   */
  async getChannel(channelId: string): Promise<ChannelDocument> {
    const channel = await Channel.findOne({ channelId });

    if (!channel) {
      throw new NotFoundError('Channel', channelId);
    }

    return channel;
  }

  /**
   * Get channel by MongoDB _id
   */
  async getChannelById(id: string): Promise<ChannelDocument> {
    const channel = await Channel.findById(id);

    if (!channel) {
      throw new NotFoundError('Channel', id);
    }

    return channel;
  }

  /**
   * List channels for a company
   */
  async listChannels(
    companyId: string,
    options: {
      includeArchived?: boolean;
      type?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ channels: ChannelDocument[]; total: number; page: number; limit: number }> {
    const { includeArchived = false, type, page = 1, limit = 50 } = options;

    const query: Record<string, unknown> = { companyId };

    if (!includeArchived) {
      query.isArchived = false;
    }

    if (type) {
      query.type = type;
    }

    const [channels, total] = await Promise.all([
      Channel.find(query)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Channel.countDocuments(query),
    ]);

    return { channels, total, page, limit };
  }

  /**
   * List channels for a user
   */
  async getChannelsForUser(
    userId: string,
    companyId: string,
    options: { includeArchived?: boolean } = {}
  ): Promise<ChannelDocument[]> {
    const { includeArchived = false } = options;

    const query: Record<string, unknown> = {
      members: userId,
      companyId,
    };

    if (!includeArchived) {
      query.isArchived = false;
    }

    return Channel.find(query).sort({ updatedAt: -1 });
  }

  /**
   * Update a channel
   */
  async updateChannel(
    channelId: string,
    userId: string,
    data: UpdateChannelDTO
  ): Promise<ChannelDocument> {
    const channel = await this.getChannel(channelId);

    // Check if user is admin
    if (!channel.admins.includes(userId)) {
      throw new ForbiddenError('Only channel admins can update the channel');
    }

    if (data.name !== undefined) {
      channel.name = data.name.startsWith('#') ? data.name : `#${data.name}`;
    }
    if (data.description !== undefined) {
      channel.description = data.description;
    }
    if (data.isArchived !== undefined) {
      channel.isArchived = data.isArchived;
    }

    await channel.save();
    return channel;
  }

  /**
   * Archive a channel
   */
  async archiveChannel(channelId: string, userId: string): Promise<ChannelDocument> {
    const channel = await this.getChannel(channelId);

    if (!channel.admins.includes(userId)) {
      throw new ForbiddenError('Only channel admins can archive the channel');
    }

    channel.isArchived = true;
    await channel.save();

    return channel;
  }

  /**
   * Delete a channel (hard delete)
   */
  async deleteChannel(channelId: string, userId: string): Promise<void> {
    const channel = await this.getChannel(channelId);

    if (!channel.admins.includes(userId)) {
      throw new ForbiddenError('Only channel admins can delete the channel');
    }

    await Channel.deleteOne({ channelId });
  }

  /**
   * Add members to a channel
   */
  async addMembers(
    channelId: string,
    userId: string,
    memberIds: string[]
  ): Promise<ChannelDocument> {
    const channel = await this.getChannel(channelId);

    if (!channel.admins.includes(userId)) {
      throw new ForbiddenError('Only channel admins can add members');
    }

    memberIds.forEach((memberId) => {
      channel.addMember(memberId);
    });

    await channel.save();
    return channel;
  }

  /**
   * Remove a member from a channel
   */
  async removeMember(
    channelId: string,
    adminId: string,
    memberId: string
  ): Promise<ChannelDocument> {
    const channel = await this.getChannel(channelId);

    if (!channel.admins.includes(adminId)) {
      throw new ForbiddenError('Only channel admins can remove members');
    }

    if (adminId === memberId) {
      throw new ForbiddenError('Admins cannot remove themselves');
    }

    channel.removeMember(memberId);
    await channel.save();

    return channel;
  }

  /**
   * Leave a channel
   */
  async leaveChannel(channelId: string, userId: string): Promise<ChannelDocument> {
    const channel = await this.getChannel(channelId);

    if (!channel.members.includes(userId)) {
      throw new ForbiddenError('You are not a member of this channel');
    }

    if (channel.admins.includes(userId) && channel.admins.length === 1) {
      throw new ForbiddenError('Cannot leave channel - you are the only admin');
    }

    channel.removeMember(userId);
    await channel.save();

    return channel;
  }

  /**
   * Add admin to a channel
   */
  async addAdmin(channelId: string, currentAdminId: string, newAdminId: string): Promise<ChannelDocument> {
    const channel = await this.getChannel(channelId);

    if (!channel.admins.includes(currentAdminId)) {
      throw new ForbiddenError('Only channel admins can add new admins');
    }

    if (!channel.members.includes(newAdminId)) {
      channel.addMember(newAdminId);
    }

    if (!channel.admins.includes(newAdminId)) {
      channel.admins.push(newAdminId);
    }

    await channel.save();
    return channel;
  }

  /**
   * Remove admin from a channel
   */
  async removeAdmin(
    channelId: string,
    currentAdminId: string,
    targetAdminId: string
  ): Promise<ChannelDocument> {
    const channel = await this.getChannel(channelId);

    if (!channel.admins.includes(currentAdminId)) {
      throw new ForbiddenError('Only channel admins can remove admins');
    }

    if (currentAdminId === targetAdminId) {
      throw new ForbiddenError('Cannot remove yourself as admin');
    }

    if (channel.admins.length === 1) {
      throw new ForbiddenError('Cannot remove the only admin');
    }

    channel.admins = channel.admins.filter((id: string) => id !== targetAdminId);
    await channel.save();

    return channel;
  }

  /**
   * Increment unread count for a channel
   */
  async incrementUnread(channelId: string, userId: string, amount = 1): Promise<void> {
    const channel = await this.getChannel(channelId);
    channel.incrementUnread(userId, amount);
    await channel.save();
  }

  /**
   * Clear unread count for a user in a channel
   */
  async clearUnread(channelId: string, userId: string): Promise<void> {
    const channel = await this.getChannel(channelId);
    channel.clearUnread(userId);
    await channel.save();
  }

  /**
   * Get channels for a project
   */
  async getChannelsForProject(projectId: string): Promise<ChannelDocument[]> {
    return Channel.findForProject(projectId);
  }

  /**
   * Check if user is member of channel
   */
  async isMember(channelId: string, userId: string): Promise<boolean> {
    const channel = await this.getChannel(channelId);
    return channel.isMember(userId);
  }

  /**
   * Check if user is admin of channel
   */
  async isAdmin(channelId: string, userId: string): Promise<boolean> {
    const channel = await this.getChannel(channelId);
    return channel.isAdmin(userId);
  }

  /**
   * Get unread counts for user across all channels
   */
  async getUnreadCounts(userId: string): Promise<Record<string, number>> {
    const channels = await Channel.findForUser(userId);
    const unreadCounts: Record<string, number> = {};

    channels.forEach((channel) => {
      if (channel.unreadCount instanceof Map) {
        const count = channel.unreadCount.get(userId) || 0;
        if (count > 0) {
          unreadCounts[channel.channelId] = count;
        }
      }
    });

    return unreadCounts;
  }
}

export const channelService = new ChannelService();
