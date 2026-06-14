import mongoose, { Document, Schema } from 'mongoose';

export interface IPostMetrics {
  score: number;
  upvotes: number;
  downvotes: number;
  comments: number;
  awards: number;
  views?: number;
  shareCount?: number;
}

export interface IRedditPost extends Document {
  redditPostId: string;
  subreddit: string;
  title: string;
  content: string;
  url?: string;
  mediaUrls: string[];
  postedAt: Date;
  metrics: IPostMetrics;
  flair?: string;
  archived: boolean;
  removed: boolean;
  nsfw: boolean;
  spoiler: boolean;
  locked: boolean;
  edited: boolean;
  originalPostId?: string;
  accountId: mongoose.Types.ObjectId;
  scheduledFor?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PostMetricsSchema = new Schema<IPostMetrics>(
  {
    score: { type: Number, default: 0 },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    awards: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const RedditPostSchema = new Schema<IRedditPost>(
  {
    redditPostId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    subreddit: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 300,
    },
    content: {
      type: String,
      default: '',
      maxlength: 40000,
    },
    url: {
      type: String,
      default: null,
    },
    mediaUrls: {
      type: [String],
      default: [],
    },
    postedAt: {
      type: Date,
      default: null,
    },
    metrics: {
      type: PostMetricsSchema,
      default: () => ({}),
    },
    flair: {
      type: String,
      default: null,
    },
    archived: {
      type: Boolean,
      default: false,
    },
    removed: {
      type: Boolean,
      default: false,
    },
    nsfw: {
      type: Boolean,
      default: false,
    },
    spoiler: {
      type: Boolean,
      default: false,
    },
    locked: {
      type: Boolean,
      default: false,
    },
    edited: {
      type: Boolean,
      default: false,
    },
    originalPostId: {
      type: String,
      default: null,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'RedditAccount',
      required: true,
      index: true,
    },
    scheduledFor: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for efficient queries
RedditPostSchema.index({ subreddit: 1, postedAt: -1 });
RedditPostSchema.index({ accountId: 1, createdAt: -1 });
RedditPostSchema.index({ scheduledFor: 1, postedAt: 1 }, { sparse: true });
RedditPostSchema.index({ 'metrics.score': -1 });
RedditPostSchema.index({ redditPostId: 1 }, { sparse: true });

// Virtual for checking if post is scheduled
RedditPostSchema.virtual('isScheduled').get(function () {
  return this.scheduledFor !== null && this.postedAt === null;
});

// Virtual for checking if post is published
RedditPostSchema.virtual('isPublished').get(function () {
  return this.postedAt !== null;
});

// Static methods
RedditPostSchema.statics.findBySubreddit = async function (
  subreddit: string,
  options: { limit?: number; skip?: number } = {}
): Promise<IRedditPost[]> {
  const { limit = 25, skip = 0 } = options;
  return this.find({ subreddit, postedAt: { $ne: null } })
    .sort({ postedAt: -1 })
    .skip(skip)
    .limit(limit);
};

RedditPostSchema.statics.findPendingScheduled = async function (): Promise<IRedditPost[]> {
  return this.find({
    scheduledFor: { $lte: new Date() },
    postedAt: null,
    redditPostId: null,
  }).sort({ scheduledFor: 1 });
};

export const RedditPost = mongoose.model<IRedditPost>('RedditPost', RedditPostSchema);

export default RedditPost;