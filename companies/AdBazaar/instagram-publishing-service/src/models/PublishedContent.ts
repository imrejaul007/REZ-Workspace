import mongoose, { Schema, Document } from 'mongoose';

// Types
export type PublishedStatus = 'published' | 'scheduled' | 'failed';

export interface IMetrics {
  likes: number;
  comments: number;
  saves: number;
  reach: number;
  impressions?: number;
  profileVisits?: number;
  follows?: number;
}

export interface IPublishedContent {
  id: string;
  instagramMediaId: string;
  instagramPermalink: string;
  accountId: string;
  contentType: string;
  caption?: string;
  mediaUrl?: string;
  mediaUrls?: string[];
  thumbnailUrl?: string;
  status: PublishedStatus;
  publishedAt?: Date;
  scheduledAt?: Date;
  metrics?: IMetrics;
  mediaType?: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'STORY';
  username?: string;
  commentsCount?: number;
  likeCount?: number;
  timestamp?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Schema definition
const PublishedContentSchema = new Schema<IPublishedContent & Document>(
  {
    instagramMediaId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    instagramPermalink: {
      type: String,
    },
    accountId: {
      type: String,
      required: true,
      index: true,
    },
    contentType: {
      type: String,
      required: true,
      enum: ['feed_image', 'feed_album', 'feed_video', 'reel', 'story'],
    },
    caption: {
      type: String,
    },
    mediaUrl: {
      type: String,
    },
    mediaUrls: {
      type: [String],
    },
    thumbnailUrl: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      enum: ['published', 'scheduled', 'failed'],
      default: 'published',
      index: true,
    },
    publishedAt: {
      type: Date,
      index: true,
    },
    scheduledAt: {
      type: Date,
    },
    metrics: {
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      saves: { type: Number, default: 0 },
      reach: { type: Number, default: 0 },
      impressions: { type: Number, default: 0 },
      profileVisits: { type: Number, default: 0 },
      follows: { type: Number, default: 0 },
    },
    mediaType: {
      type: String,
      enum: ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM', 'STORY'],
    },
    username: {
      type: String,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    timestamp: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
PublishedContentSchema.index({ accountId: 1, publishedAt: -1 });
PublishedContentSchema.index({ accountId: 1, contentType: 1 });
PublishedContentSchema.index({ publishedAt: -1 });

// Instance methods
PublishedContentSchema.methods.updateMetrics = function (newMetrics: Partial<IMetrics>): void {
  if (this.metrics) {
    this.metrics = { ...this.metrics, ...newMetrics };
  } else {
    this.metrics = newMetrics as IMetrics;
  }
};

PublishedContentSchema.methods.markAsFailed = function (): void {
  this.status = 'failed';
};

// Static methods
PublishedContentSchema.statics.findByAccount = function (accountId: string) {
  return this.find({ accountId }).sort({ publishedAt: -1 });
};

PublishedContentSchema.statics.findByMediaId = function (instagramMediaId: string) {
  return this.findOne({ instagramMediaId });
};

PublishedContentSchema.statics.getAccountStats = async function (accountId: string) {
  const stats = await this.aggregate([
    { $match: { accountId, status: 'published' } },
    {
      $group: {
        _id: null,
        totalPosts: { $sum: 1 },
        totalLikes: { $sum: '$metrics.likes' },
        totalComments: { $sum: '$metrics.comments' },
        totalSaves: { $sum: '$metrics.saves' },
        totalReach: { $sum: '$metrics.reach' },
        avgLikes: { $avg: '$metrics.likes' },
        avgComments: { $avg: '$metrics.comments' },
      },
    },
  ]);
  return stats[0] || {
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    totalSaves: 0,
    totalReach: 0,
    avgLikes: 0,
    avgComments: 0,
  };
};

// Export
export const PublishedContent = mongoose.model<IPublishedContent& Document>(
  'PublishedContent',
  PublishedContentSchema
);