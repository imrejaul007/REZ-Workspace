import mongoose, { Schema, Document, Model } from 'mongoose';
import { IChannel, ChannelType } from '../types/index.js';

export interface ChannelDocument extends Omit<IChannel, '_id'>, Document {}

const channelSchema = new Schema<ChannelDocument>(
  {
    channelId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 500,
      default: '',
    },
    type: {
      type: String,
      enum: ['public', 'private', 'project', 'direct'] as ChannelType[],
      required: true,
    },
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    projectId: {
      type: String,
      index: true,
    },
    members: {
      type: [String],
      default: [],
      index: true,
    },
    admins: {
      type: [String],
      default: [],
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
channelSchema.index({ companyId, type, isArchived: 1 });
channelSchema.index({ companyId, isArchived: 1, createdAt: -1 });
channelSchema.index({ members: 1, isArchived: 1 });
channelSchema.index({ projectId: 1, type: 1 });

// Virtual for member count
channelSchema.virtual('memberCount').get(function () {
  return this.members.length;
});

// Method to check if user is a member
channelSchema.methods.isMember = function (userId: string): boolean {
  return this.members.includes(userId);
};

// Method to check if user is an admin
channelSchema.methods.isAdmin = function (userId: string): boolean {
  return this.admins.includes(userId);
};

// Method to add member
channelSchema.methods.addMember = function (userId: string): void {
  if (!this.members.includes(userId)) {
    this.members.push(userId);
  }
};

// Method to remove member
channelSchema.methods.removeMember = function (userId: string): void {
  this.members = this.members.filter((id: string) => id !== userId);
  this.admins = this.admins.filter((id: string) => id !== userId);
  if (this.unreadCount instanceof Map) {
    this.unreadCount.delete(userId);
  }
};

// Method to increment unread
channelSchema.methods.incrementUnread = function (userId: string, amount = 1): void {
  if (this.unreadCount instanceof Map) {
    const current = this.unreadCount.get(userId) || 0;
    this.unreadCount.set(userId, current + amount);
  }
};

// Method to clear unread
channelSchema.methods.clearUnread = function (userId: string): void {
  if (this.unreadCount instanceof Map) {
    this.unreadCount.set(userId, 0);
  }
};

// Static method to find channels for a user
channelSchema.statics.findForUser = async function (
  userId: string,
  options: { includeArchived?: boolean; type?: ChannelType } = {}
): Promise<ChannelDocument[]> {
  const query: Record<string, unknown> = {
    members: userId,
  };

  if (!options.includeArchived) {
    query.isArchived = false;
  }

  if (options.type) {
    query.type = options.type;
  }

  return this.find(query).sort({ updatedAt: -1 });
};

// Static method to find channels for a project
channelSchema.statics.findForProject = async function (projectId: string): Promise<ChannelDocument[]> {
  return this.find({ projectId, isArchived: false }).sort({ createdAt: 1 });
};

// Static method to find channels by company
channelSchema.statics.findByCompany = async function (
  companyId: string,
  options: { includeArchived?: boolean; page?: number; limit?: number } = {}
): Promise<{ channels: ChannelDocument[]; total: number }> {
  const { includeArchived = false, page = 1, limit = 50 } = options;
  const query: Record<string, unknown> = { companyId };

  if (!includeArchived) {
    query.isArchived = false;
  }

  const [channels, total] = await Promise.all([
    this.find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    this.countDocuments(query),
  ]);

  return { channels, total };
};

// Ensure virtuals are included in JSON
channelSchema.set('toJSON', { virtuals: true });
channelSchema.set('toObject', { virtuals: true });

export const Channel: Model<ChannelDocument> = mongoose.model<ChannelDocument>('Channel', channelSchema);
