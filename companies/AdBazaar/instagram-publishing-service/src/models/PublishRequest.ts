import mongoose, { Schema, Document } from 'mongoose';

// Types
export type ContentType = 'feed_image' | 'feed_album' | 'feed_video' | 'reel' | 'story';
export type PublishStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';

export interface IStoryConfig {
  type: 'image' | 'video' | 'poll' | 'question' | 'link';
  pollQuestion?: string;
  pollOptions?: string[];
  question?: string;
  linkUrl?: string;
  stickerElements?: Record<string, unknown>[];
}

export interface ILocation {
  id: string;
  name: string;
}

export interface IProductTag {
  productId: string;
  x: number;
  y: number;
}

export interface IPublishRequest {
  id: string;
  accountId: string;
  contentType: ContentType;
  mediaUrl?: string;
  mediaUrls?: string[];
  caption?: string;
  hashtags?: string[];
  location?: ILocation;
  userTags?: string[];
  productTags?: IProductTag[];
  storyConfig?: IStoryConfig;
  scheduledTime?: Date;
  firstComment?: string;
  status: PublishStatus;
  publishedAt?: Date;
  publishedContentId?: string;
  errorMessage?: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Schema definition
const PublishRequestSchema = new Schema<IPublishRequest & Document>(
  {
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
    mediaUrl: {
      type: String,
    },
    mediaUrls: {
      type: [String],
    },
    caption: {
      type: String,
      maxlength: 2200,
    },
    hashtags: {
      type: [String],
    },
    location: {
      id: { type: String },
      name: { type: String },
    },
    userTags: {
      type: [String],
    },
    productTags: [
      {
        productId: { type: String, required: true },
        x: { type: Number, required: true },
        y: { type: Number, required: true },
      },
    ],
    storyConfig: {
      type: {
        type: String,
        enum: ['image', 'video', 'poll', 'question', 'link'],
      },
      pollQuestion: String,
      pollOptions: [String],
      question: String,
      linkUrl: String,
      stickerElements: [Schema.Types.Mixed],
    },
    scheduledTime: {
      type: Date,
      index: true,
    },
    firstComment: {
      type: String,
      maxlength: 300,
    },
    status: {
      type: String,
      required: true,
      enum: ['draft', 'scheduled', 'publishing', 'published', 'failed'],
      default: 'draft',
      index: true,
    },
    publishedAt: {
      type: Date,
    },
    publishedContentId: {
      type: String,
    },
    errorMessage: {
      type: String,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
PublishRequestSchema.index({ accountId: 1, status: 1 });
PublishRequestSchema.index({ scheduledTime: 1, status: 1 });
PublishRequestSchema.index({ createdAt: -1 });

// Virtual for generating the full caption with hashtags
PublishRequestSchema.virtual('fullCaption').get(function () {
  if (!this.caption && !this.hashtags?.length) return '';
  const hashtagString = this.hashtags?.map((tag) => `#${tag}`).join(' ') || '';
  return [this.caption, hashtagString].filter(Boolean).join('\n\n');
});

// Instance methods
PublishRequestSchema.methods.markAsPublishing = function (): void {
  this.status = 'publishing';
};

PublishRequestSchema.methods.markAsPublished = function (publishedContentId: string): void {
  this.status = 'published';
  this.publishedAt = new Date();
  this.publishedContentId = publishedContentId;
};

PublishRequestSchema.methods.markAsFailed = function (errorMessage: string): void {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  this.retryCount += 1;
};

// Static methods
PublishRequestSchema.statics.findByAccount = function (accountId: string, status?: PublishStatus) {
  const query: Record<string, unknown> = { accountId };
  if (status) query.status = status;
  return this.find(query).sort({ createdAt: -1 });
};

PublishRequestSchema.statics.findScheduled = function () {
  return this.find({
    status: 'scheduled',
    scheduledTime: { $lte: new Date() },
  }).sort({ scheduledTime: 1 });
};

// Export
export const PublishRequest = mongoose.model<IPublishRequest & Document>(
  'PublishRequest',
  PublishRequestSchema
);