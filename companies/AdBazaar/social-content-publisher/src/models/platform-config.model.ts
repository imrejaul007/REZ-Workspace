import mongoose, { Schema, Document } from 'mongoose';

export type PlatformType = 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube' | 'pinterest';

export interface IPlatformConfig {
  platform: PlatformType;
  accountId: string;
  adaptedContent?: string;
  enabled: boolean;
}

export interface IPlatformConfigDocument extends IPlatformConfig, Document {}

const PlatformConfigSchema = new Schema<IPlatformConfigDocument>(
  {
    platform: {
      type: String,
      enum: ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube', 'pinterest'],
      required: true,
    },
    accountId: {
      type: String,
      required: true,
    },
    adaptedContent: {
      type: String,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

export default PlatformConfigSchema;