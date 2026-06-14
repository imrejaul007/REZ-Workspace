import mongoose, { Schema, Document } from 'mongoose';

export interface IFollowerSnapshot {
  accountId: string;
  date: Date;
  followers: number;
  following: number;
  posts: number;
  change: number;
  changePercentage: number;
  sources: {
    hashtag: number;
    explore: number;
    profile: number;
    suggested: number;
    other: number;
  };
}

export interface IFollowerSnapshotDoc extends IFollowerSnapshot, Document {}

const SourceBreakdownSchema = new Schema(
  {
    hashtag: { type: Number, default: 0 },
    explore: { type: Number, default: 0 },
    profile: { type: Number, default: 0 },
    suggested: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
  },
  { _id: false }
);

const FollowerSnapshotSchema = new Schema<IFollowerSnapshotDoc>(
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
      type: Number,
      required: true,
    },
    following: {
      type: Number,
      default: 0,
    },
    posts: {
      type: Number,
      default: 0,
    },
    change: {
      type: Number,
      default: 0,
    },
    changePercentage: {
      type: Number,
      default: 0,
    },
    sources: {
      type: SourceBreakdownSchema,
      default: () => ({
        hashtag: 0,
        explore: 0,
        profile: 0,
        suggested: 0,
        other: 0,
      }),
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
FollowerSnapshotSchema.index({ accountId: 1, date: -1 });
FollowerSnapshotSchema.index({ accountId: 1, createdAt: -1 });

export const FollowerSnapshot = mongoose.model<IFollowerSnapshotDoc>(
  'FollowerSnapshot',
  FollowerSnapshotSchema
);
