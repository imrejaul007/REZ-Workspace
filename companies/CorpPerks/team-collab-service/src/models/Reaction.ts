import mongoose, { Schema, Document, Model } from 'mongoose';
import { Reaction } from '../types/index.js';

export interface ReactionDocument extends Omit<Reaction, 'emoji' | 'userId' | 'userName'> & {
  targetType: 'message' | 'announcement';
  targetId: string;
  emoji: string;
  odId: string;
  userName: string;
}

const reactionSchema = new Schema<ReactionDocument>(
  {
    targetType: {
      type: String,
      enum: ['message', 'announcement'],
      required: true,
      index: true,
    },
    targetId: {
      type: String,
      required: true,
      index: true,
    },
    emoji: {
      type: String,
      required: true,
    },
    odId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
reactionSchema.index({ targetType: 1, targetId: 1, emoji: 1 });
reactionSchema.index({ targetType: 1, targetId: 1, odId: 1 });
reactionSchema.index({ odId: 1, createdAt: -1 });

// Static method to get reactions for a target
reactionSchema.statics.findByTarget = async function (
  targetType: 'message' | 'announcement',
  targetId: string
): Promise<ReactionDocument[]> {
  return this.find({ targetType, targetId }).sort({ createdAt: -1 });
};

// Static method to get reaction counts grouped by emoji
reactionSchema.statics.getReactionCounts = async function (
  targetType: 'message' | 'announcement',
  targetId: string
): Promise<Record<string, { count: number; users: Array<{ odId: string; userName: string }> }>> {
  const reactions = await this.aggregate([
    { $match: { targetType, targetId } },
    {
      $group: {
        _id: '$emoji',
        count: { $sum: 1 },
        users: { $push: { odId: '$userId', userName: '$userName' } },
      },
    },
  ]);

  const result: Record<string, { count: number; users: Array<{ odId: string; userName: string }> }> = {};
  reactions.forEach((r) => {
    result[r._id] = { count: r.count, users: r.users };
  });

  return result;
};

// Static method to toggle reaction
reactionSchema.statics.toggleReaction = async function (
  targetType: 'message' | 'announcement',
  targetId: string,
  emoji: string,
  odId: string,
  userName: string
): Promise<{ added: boolean; totalCount: number }> {
  const existing = await this.findOne({ targetType, targetId, emoji, odId });

  if (existing) {
    await existing.deleteOne();
    const count = await this.countDocuments({ targetType, targetId, emoji });
    return { added: false, totalCount: count };
  } else {
    await this.create({ targetType, targetId, emoji, odId, userName });
    const count = await this.countDocuments({ targetType, targetId, emoji });
    return { added: true, totalCount: count };
  }
};

export const ReactionModel: Model<ReactionDocument> = mongoose.model<ReactionDocument>(
  'Reaction',
  reactionSchema
);
