import mongoose, { Schema, Document, Model } from 'mongoose';
import { IMessage, MessageType } from '../types/index.js';

export interface MessageDocument extends Omit<IMessage, '_id'>, Document {}

const attachmentSchema = new Schema({
  id: { type: String, required: true },
  filename: { type: String, required: true },
  url: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedBy: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: false });

const reactionSchema = new Schema({
  emoji: { type: String, required: true },
  odId: { type: String, required: true },
  userName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const messageSchema = new Schema<MessageDocument>(
  {
    messageId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    channelId: {
      type: String,
      required: true,
      index: true,
    },
    threadId: {
      type: String,
      index: true,
    },
    senderId: {
      type: String,
      required: true,
      index: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderAvatar: {
      type: String,
    },
    content: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    messageType: {
      type: String,
      enum: ['text', 'file', 'image', 'system', 'poll'] as MessageType[],
      default: 'text',
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    reactions: {
      type: [reactionSchema],
      default: [],
    },
    mentions: {
      type: [String],
      default: [],
      index: true,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    replyCount: {
      type: Number,
      default: 0,
    },
    lastReplyAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
messageSchema.index({ channelId: 1, createdAt: -1 });
messageSchema.index({ channelId: 1, threadId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ mentions: 1, createdAt: -1 });
messageSchema.index({ channelId: 1, isDeleted: 1, createdAt: -1 });

// Method to add reaction
messageSchema.methods.addReaction = function (emoji: string, userId: string, userName: string): void {
  const existingIndex = this.reactions.findIndex((r: { emoji: string; userId: string }) => r.emoji === emoji && r.userId === userId);
  if (existingIndex === -1) {
    this.reactions.push({ emoji, odId: userId, userName, createdAt: new Date() });
  }
};

// Method to remove reaction
messageSchema.methods.removeReaction = function (emoji: string, odId: string): void {
  this.reactions = this.reactions.filter((r: { emoji: string; userId: string }) => !(r.emoji === emoji && r.userId === odId));
};

// Method to check if user reacted
messageSchema.methods.hasReacted = function (emoji: string, odId: string): boolean {
  return this.reactions.some((r: { emoji: string; odId: string }) => r.emoji === emoji && r.userId === odId);
};

// Method to increment reply count
messageSchema.methods.incrementReplyCount = function (): void {
  this.replyCount += 1;
  this.lastReplyAt = new Date();
};

// Static method to get messages for channel with pagination
messageSchema.statics.findByChannel = async function (
  channelId: string,
  options: { before?: Date; after?: Date; limit?: number; threadId?: string } = {}
): Promise<MessageDocument[]> {
  const { before, after, limit = 50, threadId } = options;
  const query: Record<string, unknown> = {
    channelId,
    isDeleted: false,
  };

  if (threadId !== undefined) {
    query.threadId = threadId;
  } else {
    query.threadId = { $exists: false };
  }

  if (before) {
    query.createdAt = { $lt: before };
  } else if (after) {
    query.createdAt = { $gt: after };
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get thread replies
messageSchema.statics.findThreadReplies = async function (
  parentMessageId: string,
  options: { before?: Date; limit?: number } = {}
): Promise<MessageDocument[]> {
  const { before, limit = 50 } = options;
  const query: Record<string, unknown> = {
    threadId: parentMessageId,
    isDeleted: false,
  };

  if (before) {
    query.createdAt = { $lt: before };
  }

  return this.find(query)
    .sort({ createdAt: 1 })
    .limit(limit);
};

// Static method to search messages
messageSchema.statics.searchMessages = async function (
  channelId: string,
  searchTerm: string,
  options: { limit?: number; skip?: number } = {}
): Promise<MessageDocument[]> {
  const { limit = 50, skip = 0 } = options;
  return this.find({
    channelId,
    isDeleted: false,
    content: { $regex: searchTerm, $options: 'i' },
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get message stats for a channel
messageSchema.statics.getChannelStats = async function (channelId: string): Promise<{
  totalMessages: number;
  messagesByType: Record<MessageType, number>;
  topSenders: Array<{ senderId: string; count: number }>;
}> {
  const stats = await this.aggregate([
    { $match: { channelId, isDeleted: false } },
    {
      $group: {
        _id: '$senderId',
        count: { $sum: 1 },
        types: { $push: '$messageType' },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  const totalMessages = stats.reduce((sum, s) => sum + s.count, 0);
  const messagesByType: Record<MessageType, number> = {
    text: 0,
    file: 0,
    image: 0,
    system: 0,
    poll: 0,
  };

  stats.forEach((s) => {
    s.types.forEach((type: MessageType) => {
      messagesByType[type] = (messagesByType[type] || 0) + 1;
    });
  });

  const topSenders = stats.map((s) => ({ senderId: s._id, count: s.count }));

  return { totalMessages, messagesByType, topSenders };
};

export const Message: Model<MessageDocument> = mongoose.model<MessageDocument>('Message', messageSchema);
