import mongoose, { Document, Schema } from 'mongoose';

export interface IRedditAccount extends Document {
  redditUserId: string;
  username: string;
  karma: number;
  linked: boolean;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RedditAccountSchema = new Schema<IRedditAccount>(
  {
    redditUserId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    karma: {
      type: Number,
      default: 0,
    },
    linked: {
      type: Boolean,
      default: false,
    },
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
    tokenExpiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.accessToken;
        delete ret.refreshToken;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
RedditAccountSchema.index({ username: 1 });
RedditAccountSchema.index({ linked: 1, createdAt: -1 });

// Methods
RedditAccountSchema.methods.isTokenExpired = function (): boolean {
  return new Date() >= this.tokenExpiresAt;
};

RedditAccountSchema.methods.needsRefresh = function (): boolean {
  const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
  return new Date() >= new Date(this.tokenExpiresAt.getTime() - bufferTime);
};

export const RedditAccount = mongoose.model<IRedditAccount>(
  'RedditAccount',
  RedditAccountSchema
);

export default RedditAccount;