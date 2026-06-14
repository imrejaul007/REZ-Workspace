import mongoose, { Schema, Document } from 'mongoose';

export interface IUnfollowEvent {
  accountId: string;
  unfollowerId: string;
  unfollowerUsername?: string;
  unfollowedAt: Date;
  wasFollowing: boolean;
  daysAsFollower: number;
}

export interface IUnfollowEventDoc extends IUnfollowEvent, Document {}

const UnfollowEventSchema = new Schema<IUnfollowEventDoc>(
  {
    accountId: {
      type: String,
      required: true,
      index: true,
    },
    unfollowerId: {
      type: String,
      required: true,
    },
    unfollowerUsername: {
      type: String,
    },
    unfollowedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    wasFollowing: {
      type: Boolean,
      default: false,
    },
    daysAsFollower: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
UnfollowEventSchema.index({ accountId: 1, unfollowedAt: -1 });
UnfollowEventSchema.index({ accountId: 1, unfollowerId: 1 });

export const UnfollowEvent = mongoose.model<IUnfollowEventDoc>(
  'UnfollowEvent',
  UnfollowEventSchema
);
