import mongoose, { Schema, Document } from 'mongoose';

// Types
export type AccountStatus = 'active' | 'inactive' | 'expired' | 'error';

export interface IInstagramAccount {
  id: string;
  instagramId: string;
  instagramUsername: string;
  accountId: string;
  businessAccountId: string;
  accessToken: string;
  accessTokenExpiresAt?: Date;
  permissions: string[];
  pageId?: string;
  pageName?: string;
  profilePictureUrl?: string;
  followersCount?: number;
  status: AccountStatus;
  lastSyncAt?: Date;
  lastPublishAt?: Date;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Schema definition
const InstagramAccountSchema = new Schema<IInstagramAccount & Document>(
  {
    instagramId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    instagramUsername: {
      type: String,
      required: true,
    },
    accountId: {
      type: String,
      required: true,
      index: true,
    },
    businessAccountId: {
      type: String,
      required: true,
      index: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    accessTokenExpiresAt: {
      type: Date,
    },
    permissions: {
      type: [String],
      default: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_insights'],
    },
    pageId: {
      type: String,
    },
    pageName: {
      type: String,
    },
    profilePictureUrl: {
      type: String,
    },
    followersCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'inactive', 'expired', 'error'],
      default: 'active',
      index: true,
    },
    lastSyncAt: {
      type: Date,
    },
    lastPublishAt: {
      type: Date,
    },
    errorMessage: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
InstagramAccountSchema.index({ accountId: 1, status: 1 });
InstagramAccountSchema.index({ instagramUsername: 1 });

// Instance methods
InstagramAccountSchema.methods.isTokenValid = function (): boolean {
  if (!this.accessTokenExpiresAt) return true;
  return new Date() < this.accessTokenExpiresAt;
};

InstagramAccountSchema.methods.markAsExpired = function (): void {
  this.status = 'expired';
};

InstagramAccountSchema.methods.markAsError = function (errorMessage: string): void {
  this.status = 'error';
  this.errorMessage = errorMessage;
};

InstagramAccountSchema.methods.recordPublish = function (): void {
  this.lastPublishAt = new Date();
};

InstagramAccountSchema.methods.recordSync = function (): void {
  this.lastSyncAt = new Date();
};

// Static methods
InstagramAccountSchema.statics.findByAccount = function (accountId: string) {
  return this.findOne({ accountId });
};

InstagramAccountSchema.statics.findByBusinessAccountId = function (businessAccountId: string) {
  return this.findOne({ businessAccountId });
};

InstagramAccountSchema.statics.findActive = function () {
  return this.find({ status: 'active' });
};

InstagramAccountSchema.statics.findExpiringTokens = function (daysThreshold: number = 7) {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
  return this.find({
    status: 'active',
    accessTokenExpiresAt: { $lte: thresholdDate, $ne: null },
  });
};

// Export
export const InstagramAccount = mongoose.model<IInstagramAccount & Document>(
  'InstagramAccount',
  InstagramAccountSchema
);