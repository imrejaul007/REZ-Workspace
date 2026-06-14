import mongoose, { Document, Schema } from 'mongoose';

export type Platform = 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok';

export interface IAnalytics extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  platform: Platform;
  postId?: string;
  date: Date;
  metrics: {
    impressions: number;
    reach: number;
    clicks: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    videoViews?: number;
    watchTime?: number;
    engagementRate: number;
  };
  demographics?: {
    ageGroups: Record<string, number>;
    gender: Record<string, number>;
    locations: Record<string, number>;
  };
  topPosts?: {
    postId: string;
    engagement: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const AnalyticsSchema = new Schema<IAnalytics>(
  {
    userId: { type: String, required: true, index: true },
    platform: {
      type: String,
      enum: ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok'],
      required: true,
      index: true
    },
    postId: { type: String, index: true },
    date: { type: Date, required: true, index: true },
    metrics: {
      impressions: { type: Number, default: 0 },
      reach: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      saves: { type: Number, default: 0 },
      videoViews: Number,
      watchTime: Number,
      engagementRate: { type: Number, default: 0 }
    },
    demographics: {
      ageGroups: { type: Map, of: Number },
      gender: { type: Map, of: Number },
      locations: { type: Map, of: Number }
    },
    topPosts: [
      {
        postId: String,
        engagement: Number
      }
    ]
  },
  { timestamps: true }
);

AnalyticsSchema.index({ userId: 1, platform: 1, date: -1 });
AnalyticsSchema.index({ userId: 1, date: -1 });

export const Analytics = mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);