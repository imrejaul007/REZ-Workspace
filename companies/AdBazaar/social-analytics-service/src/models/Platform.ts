import mongoose, { Document, Schema } from 'mongoose';

export interface IPlatform extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok';
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  accountId: string;
  accountName: string;
  accountType: 'personal' | 'business';
  permissions: string[];
  isActive: boolean;
  lastSync?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformSchema = new Schema<IPlatform>(
  {
    userId: { type: String, required: true, index: true },
    platform: {
      type: String,
      enum: ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok'],
      required: true
    },
    accessToken: { type: String, required: true },
    refreshToken: String,
    expiresAt: Date,
    accountId: { type: String, required: true },
    accountName: { type: String, required: true },
    accountType: {
      type: String,
      enum: ['personal', 'business'],
      default: 'personal'
    },
    permissions: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    lastSync: Date,
    metadata: { type: Map, of: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

PlatformSchema.index({ userId: 1, platform: 1 });

export const Platform = mongoose.model<IPlatform>('Platform', PlatformSchema);