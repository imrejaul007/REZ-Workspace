import mongoose, { Schema, Document } from 'mongoose';

// Reels Insights Document Interface
export interface IReelsInsights extends Document {
  reelsId: string;
  accountId: string;
  date: Date;
  timestamp: Date;
  caption?: string;
  permalink?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  plays: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  impressions: number;
  engagementRate: number;
  watchTime: number;
  averageWatchTime: number;
  viewCount: number;
  ogReelsCount?: number;
  ogReelsPlays?: number;
  likesGrowth?: number;
  commentsGrowth?: number;
  reachGrowth?: number;
  savedGrowth?: number;
  sharedGrowth?: number;
  audienceCountry?: { [country: string]: number };
  audienceCity?: { [city: string]: number };
  audienceGenderAge?: {
    [key: string]: { male: number; female: number };
  };
  reachDistribution?: {
    feed: number;
    explore: number;
    hashtags: number;
    reels: number;
    profile: number;
    other: number;
  };
  impressionsDistribution?: {
    feed: number;
    explore: number;
    hashtags: number;
    reels: number;
    profile: number;
    other: number;
  };
  metadata?: {
    fetchedAt: Date;
    source: string;
    apiResponseId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose Schema for ReelsInsights
const ReelsInsightsSchema = new Schema<IReelsInsights>(
  {
    reelsId: {
      type: String,
      required: true,
      index: true,
    },
    accountId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: null,
    },
    caption: {
      type: String,
      default: null,
    },
    permalink: {
      type: String,
      default: null,
    },
    mediaUrl: {
      type: String,
      default: null,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    plays: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    comments: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
    saves: {
      type: Number,
      default: 0,
    },
    reach: {
      type: Number,
      default: 0,
    },
    impressions: {
      type: Number,
      default: 0,
    },
    engagementRate: {
      type: Number,
      default: 0,
    },
    watchTime: {
      type: Number,
      default: 0,
    },
    averageWatchTime: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    ogReelsCount: {
      type: Number,
      default: 0,
    },
    ogReelsPlays: {
      type: Number,
      default: 0,
    },
    likesGrowth: {
      type: Number,
      default: 0,
    },
    commentsGrowth: {
      type: Number,
      default: 0,
    },
    reachGrowth: {
      type: Number,
      default: 0,
    },
    savedGrowth: {
      type: Number,
      default: 0,
    },
    sharedGrowth: {
      type: Number,
      default: 0,
    },
    audienceCountry: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
    audienceCity: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
    audienceGenderAge: {
      type: Map,
      of: new Schema(
        {
          male: { type: Number, default: 0 },
          female: { type: Number, default: 0 },
        },
        { _id: false }
      ),
      default: () => new Map(),
    },
    reachDistribution: {
      feed: { type: Number, default: 0 },
      explore: { type: Number, default: 0 },
      hashtags: { type: Number, default: 0 },
      reels: { type: Number, default: 0 },
      profile: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    impressionsDistribution: {
      feed: { type: Number, default: 0 },
      explore: { type: Number, default: 0 },
      hashtags: { type: Number, default: 0 },
      reels: { type: Number, default: 0 },
      profile: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    metadata: {
      fetchedAt: { type: Date, default: Date.now },
      source: { type: String, default: 'instagram_api' },
      apiResponseId: String,
    },
  },
  {
    timestamps: true,
    collection: 'reels_insights',
  }
);

// Compound indexes for efficient queries
ReelsInsightsSchema.index({ accountId: 1, date: -1 });
ReelsInsightsSchema.index({ accountId: 1, plays: -1 });
ReelsInsightsSchema.index({ accountId: 1, engagementRate: -1 });
ReelsInsightsSchema.index({ reach: -1, date: -1 });
ReelsInsightsSchema.index({ likes: -1, date: -1 });

// Static method to find top performing reels
ReelsInsightsSchema.statics.findTopPerforming = function (
  accountId: string,
  limit: number = 10,
  sortBy: 'plays' | 'engagementRate' | 'reach' = 'plays'
): Promise<IReelsInsights[]> {
  return this.find({ accountId })
    .sort({ [sortBy]: -1 })
    .limit(limit)
    .exec();
};

// Static method to get reels performance summary
ReelsInsightsSchema.statics.getPerformanceSummary = function (
  accountId: string,
  startDate: Date,
  endDate: Date
): Promise<any> {
  return this.aggregate([
    {
      $match: {
        accountId,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        totalReels: { $sum: 1 },
        totalPlays: { $sum: '$plays' },
        totalViews: { $sum: '$views' },
        totalLikes: { $sum: '$likes' },
        totalComments: { $sum: '$comments' },
        totalShares: { $sum: '$shares' },
        totalSaves: { $sum: '$saves' },
        totalReach: { $sum: '$reach' },
        totalImpressions: { $sum: '$impressions' },
        totalWatchTime: { $sum: '$watchTime' },
        avgEngagementRate: { $avg: '$engagementRate' },
        avgWatchTime: { $avg: '$averageWatchTime' },
      },
    },
  ]).exec();
};

// Static method to get reels by date range
ReelsInsightsSchema.statics.findByDateRange = function (
  accountId: string,
  startDate: Date,
  endDate: Date
): Promise<IReelsInsights[]> {
  return this.find({
    accountId,
    date: { $gte: startDate, $lte: endDate },
  })
    .sort({ date: -1 })
    .exec();
};

export const ReelsInsights =
  mongoose.models.ReelsInsights ||
  mongoose.model<IReelsInsights>('ReelsInsights', ReelsInsightsSchema);