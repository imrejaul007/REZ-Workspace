import mongoose, { Document, Schema } from 'mongoose';
import { IPinterestAccount } from '../types';

export interface IPinterestAccountDocument extends IPinterestAccount, Document {}

const PinterestAccountSchema = new Schema<IPinterestAccountDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    pinterestUserId: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true },
    displayName: { type: String, required: true },
    profileImage: { type: String },
    websiteUrl: { type: String },
    followerCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    connectedAt: { type: Date, default: Date.now },
    accessToken: { type: String },
    refreshToken: { type: String },
  },
  {
    timestamps: true,
    collection: 'pinterest_accounts',
  }
);

// Indexes for efficient queries
PinterestAccountSchema.index({ pinterestUserId: 1 });
PinterestAccountSchema.index({ username: 1 });

// Virtual for checking if account is connected
PinterestAccountSchema.virtual('isConnected').get(function () {
  return !!this.accessToken;
});

export const PinterestAccount = mongoose.model<IPinterestAccountDocument>(
  'PinterestAccount',
  PinterestAccountSchema
);