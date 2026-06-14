/**
 * Explorer Profile Model
 */
import mongoose, { Schema, Document } from 'mongoose';

export interface IExplorerProfileDocument extends Document {
  userId: string;
  score: number;
  tier: 'Curious' | 'Explorer' | 'Adventurer' | 'Conqueror';
  stats: {
    trialsCompleted: number;
    reviewsWritten: number;
    campaignsJoined: number;
    referrals: number;
    currentStreak: number;
    longestStreak: number;
    lastActivityAt?: Date;
  };
  badges: Array<{
    id: string;
    name: string;
    icon: string;
    earnedAt: Date;
  }>;
  leaderboardRank?: number;
  leaderboardPercentile?: number;
}

const ExplorerProfileSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    score: { type: Number, default: 0 },
    tier: {
      type: String,
      enum: ['Curious', 'Explorer', 'Adventurer', 'Conqueror'],
      default: 'Curious',
    },
    stats: {
      trialsCompleted: { type: Number, default: 0 },
      reviewsWritten: { type: Number, default: 0 },
      campaignsJoined: { type: Number, default: 0 },
      referrals: { type: Number, default: 0 },
      currentStreak: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      lastActivityAt: { type: Date },
    },
    badges: [
      {
        id: { type: String },
        name: { type: String },
        icon: { type: String },
        earnedAt: { type: Date, default: Date.now },
      },
    ],
    leaderboardRank: { type: Number },
    leaderboardPercentile: { type: Number },
  },
  { timestamps: true }
);

ExplorerProfileSchema.index({ score: -1 });

export const ExplorerProfileModel = mongoose.model<IExplorerProfileDocument>('ExplorerProfile', ExplorerProfileSchema);
