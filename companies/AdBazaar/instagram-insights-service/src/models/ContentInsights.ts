import mongoose, { Schema, Document } from 'mongoose';

// Media type enum
export type MediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REELS' | 'STORY' | 'IGTV';

// Content Insights Document Interface
export interface IContentInsights extends Document {
  contentId: string;
  accountId: string;
  date: Date;
  mediaType: MediaType;
  caption?: string;
  permalink?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  timestamp: Date;
  username?: string;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  reach: number;
  impressions: number;
  engagementRate: number;
  watchTime?: number;
  views?: number;
  interactions?: number;
  videoViews?: number;
  totalPlayTime?: number;
  averageWatchTime?: number;
  carouselMediaCount?: number;
  carouselMediaSkips?: number;
  carouselMediaViews?: number;
  reachDistribution?: {
    feed: number;
    explore: number;
    hashtags: number;
    exploreSections?: number;
    reels: number;
    profile: number;
    other: number;
  };
  impressionsDistribution?: {
    feed: number;
    explore: number;
    hashtags: number;
    exploreSections?: number;
    reels: number;
    profile: number;
    other: number;
  };
  audienceCountry?: { [country: string]: number };
  audienceCity?: { [city: string]: number };
  audienceGenderAge?: {
    [key: string]: { male: number; female: number };
  };
  engagementGrowth?: {
    likesGrowth: number;
    commentsGrowth: number;
    savesGrowth: number;
  };
  isHighlight?: boolean;
  storySlideCount?: number;
  storyExits?: number;
  storyReplies?: number;
  storyForwardTaps?: number;
  storyBackTaps?: number;
  storyAnswers?: number;
  metadata?: {
    fetchedAt: Date;
    source: string;
    apiResponseId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose Schema for ContentInsights
const ContentInsightsSchema = new Schema<IContentInsights>(
  {
    contentId: {
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
    mediaType: {
      type: String,
      required: true,
      enum: ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM', 'REELS', 'STORY', 'IGTV'],
      index: true,
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
    timestamp: {
      type: Date,
      default: null,
    },
    username: {
      type: String,
      default: null,
    },
    likes: {
      type: Number,
      default: 0,
    },
    comments: {
      type: Number,
      default: 0,
    },
    saves: {
      type: Number,
      default: 0,
    },
    shares: {
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
    views: {
      type: Number,
      default: 0,
    },
    interactions: {
      type: Number,
      default: 0,
    },
    videoViews: {
      type: Number,
      default: 0,
    },
    totalPlayTime: {
      type: Number,
      default: 0,
    },
    averageWatchTime: {
      type: Number,
      default: 0,
    },
    carouselMediaCount: {
      type: Number,
      default: 0,
    },
    carouselMediaSkips: {
      type: Number,
      default: 0,
    },
    carouselMediaViews: {
      type: Number,
      default: 0,
    },
    reachDistribution: {
      feed: { type: Number, default: 0 },
      explore: { type: Number, default: 0 },
      hashtags: { type: Number, default: 0 },
      exploreSections: { type: Number, default: 0 },
      reels: { type: Number, default: 0 },
      profile: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    impressionsDistribution: {
      feed: { type: Number, default: 0 },
      explore: { type: Number, default: 0 },
      hashtags: { type: Number, default: 0 },
      exploreSections: { type: Number, default: 0 },
      reels: { type: Number, default: 0 },
      profile: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
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
    engagementGrowth: {
      likesGrowth: { type: Number, default: 0 },
      commentsGrowth: { type: Number, default: 0 },
      savesGrowth: { type: Number, default: 0 },
    },
    isHighlight: {
      type: Boolean,
      default: false,
    },
    storySlideCount: {
      type: Number,
      default: 0,
    },
    storyExits: {
      type: Number,
      default: 0,
    },
    storyReplies: {
      type: Number,
      default: 0,
    },
    storyForwardTaps: {
      type: Number,
      default: 0,
    },
    storyBackTaps: {
      type: Number,
      default: 0,
    },
    storyAnswers: {
      type: Number,
      default: 0,
    },
    metadata: {
      fetchedAt: { type: Date, default: Date.now },
      source: { type: String, default: 'instagram_api' },
      apiResponseId: String,
    },
  },
  {
    timestamps: true,
    collection: 'content_insights',
  }
);

// Compound indexes for efficient queries
ContentInsightsSchema.index({ accountId: 1, date: -1 });
ContentInsightsSchema.index({ accountId: 1, mediaType: 1, date: -1 });
ContentInsightsSchema.index({ contentId: 1, date: -1 });
ContentInsightsSchema.index({ engagementRate: -1, date: -1 });
ContentInsightsSchema.index({ reach: -1, date: -1 });

// Static method to find top performing content
ContentInsightsSchema.statics.findTopPerforming = function (
  accountId: string,
  limit: number = 10,
  sortBy: 'engagementRate' | 'reach' | 'likes' = 'engagementRate'
): Promise<IContentInsights[]> {
  return this.find({ accountId })
    .sort({ [sortBy]: -1 })
    .limit(limit)
    .exec();
};

// Static method to find content by media type
ContentInsightsSchema.statics.findByMediaType = function (
  accountId: string,
  mediaType: MediaType,
  limit: number = 50
): Promise<IContentInsights[]> {
  return this.find({ accountId, mediaType })
    .sort({ date: -1 })
    .limit(limit)
    .exec();
};

// Static method to get content insights for date range
ContentInsightsSchema.statics.findByDateRange = function (
  accountId: string,
  startDate: Date,
  endDate: Date
): Promise<IContentInsights[]> {
  return this.find({
    accountId,
    date: { $gte: startDate, $lte: endDate },
  })
    .sort({ date: -1 })
    .exec();
};

export const ContentInsights =
  mongoose.models.ContentInsights ||
  mongoose.model<IContentInsights>('ContentInsights', ContentInsightsSchema);