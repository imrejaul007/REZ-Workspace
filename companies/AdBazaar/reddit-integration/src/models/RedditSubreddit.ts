import mongoose, { Document, Schema } from 'mongoose';

export interface ISubredditRules {
  title: string;
  description: string;
  violationReason?: string;
}

export interface IRedditSubreddit extends Document {
  subredditName: string;
  displayName: string;
  members: number;
  online: number;
  category?: string;
  rules: ISubredditRules[];
  description?: string;
  icon?: string;
  banner?: string;
  nsfw: boolean;
  quarantined: boolean;
  lang: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubredditRulesSchema = new Schema<ISubredditRules>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    violationReason: { type: String, default: null },
  },
  { _id: false }
);

const RedditSubredditSchema = new Schema<IRedditSubreddit>(
  {
    subredditName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    members: {
      type: Number,
      default: 0,
      min: 0,
    },
    online: {
      type: Number,
      default: 0,
      min: 0,
    },
    category: {
      type: String,
      default: null,
    },
    rules: {
      type: [SubredditRulesSchema],
      default: [],
    },
    description: {
      type: String,
      default: null,
      maxlength: 500,
    },
    icon: {
      type: String,
      default: null,
    },
    banner: {
      type: String,
      default: null,
    },
    nsfw: {
      type: Boolean,
      default: false,
    },
    quarantined: {
      type: Boolean,
      default: false,
    },
    lang: {
      type: String,
      default: 'en',
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
RedditSubredditSchema.index({ members: -1 });
RedditSubredditSchema.index({ online: -1 });
RedditSubredditSchema.index({ nsfw: 1, quarantined: 1 });
RedditSubredditSchema.index({ category: 1 });

// Virtual for formatted name
RedditSubredditSchema.virtual('fullName').get(function () {
  return `r/${this.subredditName}`;
});

// Static methods
RedditSubredditSchema.statics.findOrCreate = async function (
  data: Partial<IRedditSubreddit>
): Promise<IRedditSubreddit> {
  let subreddit = await this.findOne({ subredditName: data.subredditName });
  if (!subreddit) {
    subreddit = await this.create(data);
  }
  return subreddit;
};

RedditSubredditSchema.statics.findTracked = async function (
  options: { limit?: number; skip?: number } = {}
): Promise<IRedditSubreddit[]> {
  const { limit = 50, skip = 0 } = options;
  return this.find()
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit);
};

RedditSubredditSchema.statics.searchByName = async function (
  query: string,
  options: { limit?: number } = {}
): Promise<IRedditSubreddit[]> {
  const { limit = 10 } = options;
  return this.find({
    subredditName: { $regex: query, $options: 'i' },
  })
    .sort({ members: -1 })
    .limit(limit);
};

export const RedditSubreddit = mongoose.model<IRedditSubreddit>(
  'RedditSubreddit',
  RedditSubredditSchema
);

export default RedditSubreddit;