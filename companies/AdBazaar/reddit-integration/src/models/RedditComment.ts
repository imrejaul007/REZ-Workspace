import mongoose, { Document, Schema } from 'mongoose';

export interface ICommentMetrics {
  score: number;
  upvotes: number;
  downvotes: number;
  awards: number;
}

export interface IRedditComment extends Document {
  redditCommentId: string;
  postId: string;
  parentId?: string;
  content: string;
  postedAt: Date;
  metrics: ICommentMetrics;
  removed: boolean;
  edited: boolean;
  depth: number;
  replyCount: number;
  accountId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CommentMetricsSchema = new Schema<ICommentMetrics>(
  {
    score: { type: Number, default: 0 },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    awards: { type: Number, default: 0 },
  },
  { _id: false }
);

const RedditCommentSchema = new Schema<IRedditComment>(
  {
    redditCommentId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    postId: {
      type: String,
      required: true,
      index: true,
    },
    parentId: {
      type: String,
      default: null,
    },
    content: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    postedAt: {
      type: Date,
      default: null,
    },
    metrics: {
      type: CommentMetricsSchema,
      default: () => ({}),
    },
    removed: {
      type: Boolean,
      default: false,
    },
    edited: {
      type: Boolean,
      default: false,
    },
    depth: {
      type: Number,
      default: 0,
      min: 0,
      max: 8,
    },
    replyCount: {
      type: Number,
      default: 0,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'RedditAccount',
      required: true,
      index: true,
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

// Indexes
RedditCommentSchema.index({ postId: 1, postedAt: -1 });
RedditCommentSchema.index({ parentId: 1, createdAt: -1 });
RedditCommentSchema.index({ accountId: 1, createdAt: -1 });
RedditCommentSchema.index({ redditCommentId: 1 }, { sparse: true });

// Virtual for checking if comment is published
RedditCommentSchema.virtual('isPublished').get(function () {
  return this.postedAt !== null;
});

// Static methods
RedditCommentSchema.statics.findByPost = async function (
  postId: string,
  options: { limit?: number; skip?: number; sortBy?: 'top' | 'new' | 'controversial' } = {}
): Promise<IRedditComment[]> {
  const { limit = 25, skip = 0, sortBy = 'new' } = options;

  let sort: any = { postedAt: -1 };
  if (sortBy === 'top') {
    sort = { 'metrics.score': -1 };
  } else if (sortBy === 'controversial') {
    sort = { 'metrics.upvotes': 1, 'metrics.downvotes': -1 };
  }

  return this.find({ postId, postedAt: { $ne: null } })
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

RedditCommentSchema.statics.findByParent = async function (
  parentId: string,
  options: { limit?: number; skip?: number } = {}
): Promise<IRedditComment[]> {
  const { limit = 25, skip = 0 } = options;
  return this.find({ parentId, postedAt: { $ne: null } })
    .sort({ postedAt: -1 })
    .skip(skip)
    .limit(limit);
};

export const RedditComment = mongoose.model<IRedditComment>(
  'RedditComment',
  RedditCommentSchema
);

export default RedditComment;