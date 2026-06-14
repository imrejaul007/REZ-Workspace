import mongoose, { Document, Schema } from 'mongoose';

export interface IPostAnalytics extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok';
  externalPostId: string;
  content: string;
  publishedAt: Date;
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
    ctr?: number;
    engagementRate: number;
  };
  trend?: {
    direction: 'up' | 'down' | 'stable';
    changePercent: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PostAnalyticsSchema = new Schema<IPostAnalytics>(
  {
    userId: { type: String, required: true, index: true },
    platform: {
      type: String,
      enum: ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok'],
      required: true,
      index: true
    },
    externalPostId: { type: String, required: true },
    content: { type: String },
    publishedAt: { type: Date, required: true },
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
      ctr: Number,
      engagementRate: { type: Number, default: 0 }
    },
    trend: {
      direction: { type: String, enum: ['up', 'down', 'stable'] },
      changePercent: Number
    }
  },
  { timestamps: true }
);

PostAnalyticsSchema.index({ userId: 1, platform: 1, publishedAt: -1 });
PostAnalyticsSchema.index({ externalPostId: 1 });

export const PostAnalytics = mongoose.model<IPostAnalytics>('PostAnalytics', PostAnalyticsSchema);