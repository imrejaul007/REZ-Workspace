/**
 * User Progress Schema
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IUserProgress extends Document {
  userId: string;
  categoriesVisited: Record<string, number>;
  totalMerchantsVisited: number;
  totalSpend: number;
  badgesEarned: Array<{
    badgeId: string;
    earnedAt: Date;
  }>;
  badgeProgress: Record<string, number>;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserProgressSchema = new Schema<IUserProgress>({
  userId: { type: String, required: true, unique: true, index: true },
  categoriesVisited: { type: Map, of: Number, default: {} },
  totalMerchantsVisited: { type: Number, default: 0 },
  totalSpend: { type: Number, default: 0 },
  badgesEarned: [{
    badgeId: String,
    earnedAt: { type: Date, default: Date.now },
  }],
  badgeProgress: { type: Map, of: Number, default: {} },
  lastActivity: Date,
}, { timestamps: true });

export const UserProgress = mongoose.model<IUserProgress>('UserProgress', UserProgressSchema);
