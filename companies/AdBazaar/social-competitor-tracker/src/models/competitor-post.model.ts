import mongoose, { Schema, Document, Model } from 'mongoose';
import { z } from 'zod';

// Post type enum
export const PostTypeSchema = z.enum(['image', 'video', 'carousel', 'story', 'reel']);
export type PostType = z.infer<typeof PostTypeSchema>;

// Post metrics interface
export interface IPostMetrics {
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
}

// CompetitorPost - Individual posts from competitors
export interface ICompetitorPost extends Document {
  competitorId: mongoose.Types.ObjectId;
  platform: string;
  postId: string;
  url: string;
  content: string;
  mediaUrls: string[];
  postedAt: Date;
  metrics: IPostMetrics;
  topComment?: string;
  hashtags: string[];
  type: PostType;
  createdAt: Date;
}

const PostMetricsSchema = new Schema<IPostMetrics>(
  {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
  },
  { _id: false }
);

const CompetitorPostSchema = new Schema<ICompetitorPost>(
  {
    competitorId: { type: Schema.Types.ObjectId, ref: 'Competitor', required: true, index: true },
    platform: { type: String, required: true, index: true },
    postId: { type: String, required: true },
    url: { type: String, required: true },
    content: { type: String, default: '' },
    mediaUrls: { type: [String], default: [] },
    postedAt: { type: Date, required: true, index: true },
    metrics: { type: PostMetricsSchema, default: () => ({}) },
    topComment: { type: String },
    hashtags: { type: [String], default: [], index: true },
    type: {
      type: String,
      enum: ['image', 'video', 'carousel', 'story', 'reel'],
      default: 'image',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
CompetitorPostSchema.index({ competitorId: 1, platform: 1, postedAt: -1 });
CompetitorPostSchema.index({ competitorId: 1, 'metrics.engagementRate': -1 });
CompetitorPostSchema.index({ postId: 1, platform: 1 }, { unique: true });
CompetitorPostSchema.index({ hashtags: 1 });

// Static methods
CompetitorPostSchema.statics.findByCompetitor = function (
  competitorId: string,
  platform?: string,
  limit: number = 20
) {
  const query: Record<string, unknown> = { competitorId };
  if (platform) query.platform = platform;

  return this.find(query).sort({ postedAt: -1 }).limit(limit).exec();
};

CompetitorPostSchema.statics.findTopPerforming = function (
  competitorId: string,
  platform?: string,
  limit: number = 10
) {
  const query: Record<string, unknown> = { competitorId };
  if (platform) query.platform = platform;

  return this.find(query)
    .sort({ 'metrics.engagementRate': -1, 'metrics.likes': -1 })
    .limit(limit)
    .exec();
};

CompetitorPostSchema.statics.findByHashtag = function (hashtag: string, limit: number = 50) {
  return this.find({ hashtags: hashtag })
    .sort({ 'metrics.engagementRate': -1 })
    .limit(limit)
    .exec();
};

CompetitorPostSchema.statics.getAverageMetrics = async function (
  competitorId: string,
  platform?: string,
  days: number = 30
) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const query: Record<string, unknown> = {
    competitorId,
    postedAt: { $gte: startDate },
  };
  if (platform) query.platform = platform;

  const result = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: platform ? '$platform' : null,
        avgLikes: { $avg: '$metrics.likes' },
        avgComments: { $avg: '$metrics.comments' },
        avgShares: { $avg: '$metrics.shares' },
        avgEngagementRate: { $avg: '$metrics.engagementRate' },
        totalPosts: { $sum: 1 },
      },
    },
  ]);

  return result;
};

CompetitorPostSchema.statics.getContentTypeDistribution = async function (
  competitorId: string,
  platform?: string
) {
  const query: Record<string, unknown> = { competitorId };
  if (platform) query.platform = platform;

  return this.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        avgEngagement: { $avg: '$metrics.engagementRate' },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

export const CompetitorPost: Model<ICompetitorPost> = mongoose.model<ICompetitorPost>(
  'CompetitorPost',
  CompetitorPostSchema
);

// Validation function
export function validatePostInput(data: unknown) {
  const schema = z.object({
    competitorId: z.string(),
    platform: z.string(),
    postId: z.string(),
    url: z.string().url(),
    content: z.string().optional(),
    mediaUrls: z.array(z.string().url()).optional(),
    postedAt: z.string().datetime().or(z.date()),
    metrics: z
      .object({
        likes: z.number().optional(),
        comments: z.number().optional(),
        shares: z.number().optional(),
        engagementRate: z.number().optional(),
      })
      .optional(),
    hashtags: z.array(z.string()).optional(),
    type: PostTypeSchema.optional(),
  });

  return schema.safeParse(data);
}