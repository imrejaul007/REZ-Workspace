import mongoose, { Schema, Document } from 'mongoose';

// Followers breakdown by gender
export interface IFollowersByGender {
  male: number;
  female: number;
  unknown?: number;
}

// Followers breakdown by age
export interface IFollowersByAge {
  [key: string]: number;
}

// Followers breakdown by location (city)
export interface IFollowersByLocation {
  [city: string]: number;
}

// Followers data
export interface IFollowersData {
  total: number;
  change: number;
  changePercentage?: number;
  byGender: IFollowersByGender;
  byAge: IFollowersByAge;
  byLocation: IFollowersByLocation;
}

// Account Insights Document Interface
export interface IAccountInsights extends Document {
  accountId: string;
  date: Date;
  followers: IFollowersData;
  reach: number;
  impressions: number;
  profileViews: number;
  websiteClicks: number;
  emailContacts: number;
  engagement: number;
  engagementRate?: number;
  impressionsVsReach?: number;
  storiesViews?: number;
  saved?: number;
  shared?: number;
  carouselAlbumEngagement?: number;
  incomingMessages?: number;
  followerSource?: {
    sources: { [key: string]: number };
    total: number;
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
  reachDistribution?: {
    feed: number;
    explore: number;
    hashtags: number;
    exploreSections?: number;
    reels: number;
    profile: number;
    other: number;
  };
  topPosts?: {
    postId: string;
    caption?: string;
    mediaType: string;
    reach: number;
    engagement: number;
    impressions: number;
  }[];
  metadata?: {
    fetchedAt: Date;
    source: string;
    apiResponseId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose Schema for AccountInsights
const FollowersByGenderSchema = new Schema(
  {
    male: { type: Number, default: 0 },
    female: { type: Number, default: 0 },
    unknown: { type: Number, default: 0 },
  },
  { _id: false }
);

const FollowersByAgeSchema = new Schema(
  {
    '13-17': { type: Number, default: 0 },
    '18-24': { type: Number, default: 0 },
    '25-34': { type: Number, default: 0 },
    '35-44': { type: Number, default: 0 },
    '45-54': { type: Number, default: 0 },
    '55-64': { type: Number, default: 0 },
    '65+': { type: Number, default: 0 },
  },
  { _id: false }
);

const FollowersByLocationSchema = new Schema(
  {},
  {
    _id: false,
    strict: false,
  }
);

const FollowersDataSchema = new Schema(
  {
    total: { type: Number, required: true },
    change: { type: Number, default: 0 },
    changePercentage: { type: Number, default: 0 },
    byGender: { type: FollowersByGenderSchema, default: () => ({}) },
    byAge: { type: FollowersByAgeSchema, default: () => ({}) },
    byLocation: { type: FollowersByLocationSchema, default: () => ({}) },
  },
  { _id: false }
);

const AccountInsightsSchema = new Schema<IAccountInsights>(
  {
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
    followers: {
      type: FollowersDataSchema,
      required: true,
    },
    reach: {
      type: Number,
      default: 0,
    },
    impressions: {
      type: Number,
      default: 0,
    },
    profileViews: {
      type: Number,
      default: 0,
    },
    websiteClicks: {
      type: Number,
      default: 0,
    },
    emailContacts: {
      type: Number,
      default: 0,
    },
    engagement: {
      type: Number,
      default: 0,
    },
    engagementRate: {
      type: Number,
      default: 0,
    },
    impressionsVsReach: {
      type: Number,
      default: 0,
    },
    storiesViews: {
      type: Number,
      default: 0,
    },
    saved: {
      type: Number,
      default: 0,
    },
    shared: {
      type: Number,
      default: 0,
    },
    carouselAlbumEngagement: {
      type: Number,
      default: 0,
    },
    incomingMessages: {
      type: Number,
      default: 0,
    },
    followerSource: {
      sources: {
        type: Map,
        of: Number,
        default: () => new Map(),
      },
      total: { type: Number, default: 0 },
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
    reachDistribution: {
      feed: { type: Number, default: 0 },
      explore: { type: Number, default: 0 },
      hashtags: { type: Number, default: 0 },
      exploreSections: { type: Number, default: 0 },
      reels: { type: Number, default: 0 },
      profile: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    topPosts: [
      {
        postId: String,
        caption: String,
        mediaType: String,
        reach: Number,
        engagement: Number,
        impressions: Number,
      },
    ],
    metadata: {
      fetchedAt: { type: Date, default: Date.now },
      source: { type: String, default: 'instagram_api' },
      apiResponseId: String,
    },
  },
  {
    timestamps: true,
    collection: 'account_insights',
  }
);

// Compound index for efficient queries
AccountInsightsSchema.index({ accountId: 1, date: -1 });
AccountInsightsSchema.index({ 'followers.total': -1, date: -1 });

// Static method to get latest insights
AccountInsightsSchema.statics.findLatest = function (
  accountId: string
): Promise<IAccountInsights | null> {
  return this.findOne({ accountId }).sort({ date: -1 }).exec();
};

// Static method to get insights for date range
AccountInsightsSchema.statics.findByDateRange = function (
  accountId: string,
  startDate: Date,
  endDate: Date
): Promise<IAccountInsights[]> {
  return this.find({
    accountId,
    date: { $gte: startDate, $lte: endDate },
  })
    .sort({ date: -1 })
    .exec();
};

export const AccountInsights =
  mongoose.models.AccountInsights ||
  mongoose.model<IAccountInsights>('AccountInsights', AccountInsightsSchema);