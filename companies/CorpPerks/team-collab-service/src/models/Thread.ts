import mongoose, { Schema, Document, Model } from 'mongoose';
import { IThread } from '../types/index.js';

export interface ThreadDocument extends Omit<IThread, '_id'>, Document {}

const threadSchema = new Schema<ThreadDocument>(
  {
    threadId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    parentMessageId: {
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
    replyCount: {
      type: Number,
      default: 0,
    },
    lastReplyAt: {
      type: Date,
    },
    participantIds: {
      type: [String],
      default: [],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
threadSchema.index({ channelId: 1, lastReplyAt: -1 });
threadSchema.index({ participantIds: 1, lastReplyAt: -1 });

// Method to add participant
threadSchema.methods.addParticipant = function (userId: string): void {
  if (!this.participantIds.includes(userId)) {
    this.participantIds.push(userId);
  }
};

// Method to increment reply count
threadSchema.methods.incrementReplyCount = function (): void {
  this.replyCount += 1;
  this.lastReplyAt = new Date();
};

// Static method to get threads by channel
threadSchema.statics.findByChannel = async function (
  channelId: string,
  options: { limit?: number; before?: Date } = {}
): Promise<ThreadDocument[]> {
  const { limit = 20, before } = options;
  const query: Record<string, unknown> = { channelId };

  if (before) {
    query.lastReplyAt = { $lt: before };
  }

  return this.find(query)
    .sort({ lastReplyAt: -1 })
    .limit(limit);
};

// Static method to get active threads for user
threadSchema.statics.findActiveForUser = async function (
  userId: string,
  options: { limit?: number } = {}
): Promise<ThreadDocument[]> {
  const { limit = 10 } = options;
  return this.find({
    participantIds: userId,
    lastReplyAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
  })
    .sort({ lastReplyAt: -1 })
    .limit(limit);
};

export const Thread: Model<ThreadDocument> = mongoose.model<ThreadDocument>('Thread', threadSchema);
