import mongoose, { Schema, Document } from 'mongoose';
import { PlatformType } from './platform-config.model';

export interface IConnectedPlatform {
  id: string;
  userId: string;
  companyId: string;
  platform: PlatformType;
  accountId: string;
  accountName: string;
  accountHandle?: string;
  profileImage?: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  permissions: string[];
  enabled: boolean;
  lastSyncAt?: Date;
  status: 'active' | 'expired' | 'revoked' | 'error';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IConnectedPlatformDocument extends Omit<IConnectedPlatform, 'id'>, Document {
  toJSON(): IConnectedPlatform;
}

const ConnectedPlatformSchema = new Schema<IConnectedPlatformDocument>(
  {
    userId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    platform: {
      type: String,
      enum: ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube', 'pinterest'],
      required: true,
    },
    accountId: { type: String, required: true },
    accountName: { type: String, required: true },
    accountHandle: { type: String },
    profileImage: { type: String },
    accessToken: { type: String, required: true },
    refreshToken: { type: String },
    tokenExpiresAt: { type: Date },
    permissions: [{ type: String }],
    enabled: { type: Boolean, default: true },
    lastSyncAt: { type: Date },
    status: {
      type: String,
      enum: ['active', 'expired', 'revoked', 'error'],
      default: 'active',
    },
    errorMessage: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.accessToken;
        delete ret.refreshToken;
        return ret;
      },
    },
  }
);

// Compound unique index - one account per platform per user
ConnectedPlatformSchema.index({ userId: 1, companyId: 1, platform: 1, accountId: 1 }, { unique: true });
ConnectedPlatformSchema.index({ companyId: 1, platform: 1, status: 1 });

export default mongoose.model<IConnectedPlatformDocument>('ConnectedPlatform', ConnectedPlatformSchema);