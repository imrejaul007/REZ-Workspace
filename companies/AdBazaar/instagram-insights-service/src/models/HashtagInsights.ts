import mongoose, { Schema, Document } from 'mongoose';

// Hashtag Insights Document Interface
export interface IHashtagInsights extends Document {
  hashtagId: string;
  hashtag: string;
  accountId: string;
  date: Date;
  postsUsingHashtag: number;
  reachFromHashtag: number;
  impressionsFromHashtag: number;
  topPosts?: {
    postId: string;
    caption?: string;
    reach: number;
    likes: number;
    comments: number;
    postedAt: Date;
  }[];
  averageEngagement?: number;
  recentUsage?: {
    postId: string;
    timestamp: Date;
  }[];
  metadata?: {
    fetchedAt: Date;
    source: string;
    apiResponseId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose Schema for HashtagInsights
const TopPostSchema = new Schema(
  {
    postId: { type: String, required: true },
    caption: { type: String, default: null },
    reach: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    postedAt: { type: Date, default: null },
  },
  { _id: false }
);

const RecentUsageSchema = new Schema(
  {
    postId: { type: String, required: true },
    timestamp: { type: Date, default: null },
  },
  { _id: false }
);

const HashtagInsightsSchema = new Schema<IHashtagInsights>(
  {
    hashtagId: {
      type: String,
      required: true,
      index: true,
    },
    hashtag: {
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
    postsUsingHashtag: {
      type: Number,
      default: 0,
    },
    reachFromHashtag: {
      type: Number,
      default: 0,
    },
    impressionsFromHashtag: {
      type: Number,
      default: 0,
    },
    topPosts: {
      type: [TopPostSchema],
      default: [],
    },
    averageEngagement: {
      type: Number,
      default: 0,
    },
    recentUsage: {
      type: [RecentUsageSchema],
      default: [],
    },
    metadata: {
      fetchedAt: { type: Date, default: Date.now },
      source: { type: String, default: 'instagram_api' },
      apiResponseId: String,
    },
  },
  {
    timestamps: true,
    collection: 'hashtag_insights',
  }
);

// Compound indexes for efficient queries
HashtagInsightsSchema.index({ accountId: 1, date: -1 });
HashtagInsightsSchema.index({ accountId: 1, hashtag: 1 });
HashtagInsightsSchema.index({ reachFromHashtag: -1, date: -1 });

// Static method to find top hashtags by reach
HashtagInsightsSchema.statics.findTopByReach = function (
  accountId: string,
  limit: number = 20
): Promise<IHashtagInsights[]> {
  return this.find({ accountId })
    .sort({ reachFromHashtag: -1 })
    .limit(limit)
    .exec();
};

// Static method to get hashtag performance trend
HashtagInsightsSchema.statics.getPerformanceTrend = function (
  accountId: string,
  hashtag: string,
  days: number = 30
): Promise<IHashtagInsights[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.find({
    accountId,
    hashtag: hashtag.startsWith('#') ? hashtag : `#${hashtag}`,
    date: { $gte: startDate },
  })
    .sort({ date: 1 })
    .exec();
};

export const HashtagInsights =
  mongoose.models.HashtagInsights ||
  mongoose.model<IHashtagInsights>('HashtagInsights', HashtagInsightsSchema);