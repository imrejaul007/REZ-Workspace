import mongoose, { Document, Schema } from 'mongoose';
import { Platform, RiskLevel } from '../utils/validators';

// Flag types for suspicious activity
export type FlagType =
  | 'suspicious_growth'
  | 'bot_engagement'
  | 'purchased_followers'
  | 'unusual_posting_pattern'
  | 'low_engagement_rate'
  | 'fake_followers_ratio'
  | 'engagement_inconsistency'
  | 'content_quality_issues';

export interface IInfluencerProfile extends Document {
  platform: Platform;
  username: string;
  followers: number;
  following: number;
  posts: number;
  authenticityScore: number; // 0-100
  riskLevel: RiskLevel;
  flags: FlagType[];
  lastChecked: Date;
  engagementRate: number;
  followerQualityScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const InfluencerProfileSchema = new Schema<IInfluencerProfile>(
  {
    platform: {
      type: String,
      enum: ['instagram', 'youtube', 'twitter', 'tiktok', 'facebook', 'linkedin'],
      required: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },
    followers: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    following: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    posts: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    authenticityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 50,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
      default: 'medium',
      index: true,
    },
    flags: {
      type: [String],
      enum: [
        'suspicious_growth',
        'bot_engagement',
        'purchased_followers',
        'unusual_posting_pattern',
        'low_engagement_rate',
        'fake_followers_ratio',
        'engagement_inconsistency',
        'content_quality_issues',
      ],
      default: [],
    },
    lastChecked: {
      type: Date,
      default: Date.now,
    },
    engagementRate: {
      type: Number,
      default: 0,
    },
    followerQualityScore: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient lookups
InfluencerProfileSchema.index({ platform: 1, username: 1 }, { unique: true });
InfluencerProfileSchema.index({ authenticityScore: 1, riskLevel: 1 });

// Instance method to check if profile needs refresh
InfluencerProfileSchema.methods.needsRefresh = function (): boolean {
  const hoursSinceCheck = (Date.now() - this.lastChecked.getTime()) / (1000 * 60 * 60);
  return hoursSinceCheck > 24; // Refresh if older than 24 hours
};

// Instance method to get risk color
InfluencerProfileSchema.methods.getRiskColor = function (): string {
  const colors: Record<RiskLevel, string> = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#7c3aed',
  };
  return colors[this.riskLevel];
};

export const InfluencerProfile = mongoose.model<IInfluencerProfile>('InfluencerProfile', InfluencerProfileSchema);