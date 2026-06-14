import mongoose, { Document, Schema } from 'mongoose';

export type ScheduleStatus = 'pending' | 'published' | 'failed' | 'cancelled';

export interface IScheduledPost extends Document {
  title: string;
  content: string;
  subreddit: string;
  url?: string;
  mediaUrls: string[];
  scheduledFor: Date;
  status: ScheduleStatus;
  postId?: mongoose.Types.ObjectId;
  redditPostId?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  nsfw: boolean;
  spoiler: boolean;
  flair?: string;
  accountId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledPostSchema = new Schema<IScheduledPost>(
  {
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
    subreddit: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    url: {
      type: String,
      default: null,
    },
    mediaUrls: {
      type: [String],
      default: [],
    },
    scheduledFor: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'published', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'RedditPost',
      default: null,
    },
    redditPostId: {
      type: String,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    retryCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
      min: 0,
      max: 10,
    },
    nsfw: {
      type: Boolean,
      default: false,
    },
    spoiler: {
      type: Boolean,
      default: false,
    },
    flair: {
      type: String,
      default: null,
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
ScheduledPostSchema.index({ scheduledFor: 1, status: 1 });
ScheduledPostSchema.index({ status: 1, scheduledFor: 1 });
ScheduledPostSchema.index({ accountId: 1, createdAt: -1 });
ScheduledPostSchema.index({ subreddit: 1, status: 1 });

// Virtual for checking if can retry
ScheduledPostSchema.virtual('canRetry').get(function () {
  return (
    this.status === 'failed' &&
    this.retryCount < this.maxRetries
  );
});

// Methods
ScheduledPostSchema.methods.markPublished = async function (
  redditPostId: string,
  postId: mongoose.Types.ObjectId
): Promise<void> {
  this.status = 'published';
  this.redditPostId = redditPostId;
  this.postId = postId;
  await this.save();
};

ScheduledPostSchema.methods.markFailed = async function (
  errorMessage: string
): Promise<void> {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  this.retryCount += 1;
  await this.save();
};

ScheduledPostSchema.methods.cancel = async function (): Promise<void> {
  this.status = 'cancelled';
  await this.save();
};

// Static methods
ScheduledPostSchema.statics.findDueForPublishing = async function (): Promise<IScheduledPost[]> {
  const now = new Date();
  return this.find({
    status: 'pending',
    scheduledFor: { $lte: now },
  }).sort({ scheduledFor: 1 });
};

ScheduledPostSchema.statics.findByAccount = async function (
  accountId: mongoose.Types.ObjectId,
  options: { limit?: number; skip?: number; status?: ScheduleStatus } = {}
): Promise<IScheduledPost[]> {
  const { limit = 25, skip = 0, status } = options;
  const query: any = { accountId };
  if (status) {
    query.status = status;
  }
  return this.find(query)
    .sort({ scheduledFor: -1 })
    .skip(skip)
    .limit(limit);
};

export const ScheduledPost = mongoose.model<IScheduledPost>(
  'ScheduledPost',
  ScheduledPostSchema
);

export default ScheduledPost;