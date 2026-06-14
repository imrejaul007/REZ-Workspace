import mongoose, { Schema, Document } from 'mongoose';

export type AdType = 'SNAP_AD' | 'STORY_AD' | 'COLLECTION_AD' | 'FILTER';
export type AdStatus = 'ACTIVE' | 'PAUSED' | 'DELETED';
export type MediaType = 'image' | 'video';

export interface ICreative {
  headline: string;
  body: string;
  callToAction: string;
  mediaUrl: string;
  mediaType: MediaType;
}

export interface IAdStats {
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
}

export interface ISnapchatAd {
  id: string;
  campaignId: string;
  snapchatAdId: string;
  name: string;
  type: AdType;
  status: AdStatus;
  creative: ICreative;
  stats: IAdStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISnapchatAdDocument extends ISnapchatAd, Document {
  _id: mongoose.Types.ObjectId;
}

const CreativeSchema = new Schema<ICreative>(
  {
    headline: { type: String, required: true },
    body: { type: String, required: true },
    callToAction: { type: String, default: 'Learn More' },
    mediaUrl: { type: String, required: true },
    mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
  },
  { _id: false }
);

const AdStatsSchema = new Schema<IAdStats>(
  {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    spend: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
  },
  { _id: false }
);

const SnapchatAdSchema = new Schema<ISnapchatAdDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    campaignId: { type: String, required: true, index: true },
    snapchatAdId: { type: String, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['SNAP_AD', 'STORY_AD', 'COLLECTION_AD', 'FILTER'],
      default: 'SNAP_AD',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'DELETED'],
      default: 'PAUSED',
    },
    creative: { type: CreativeSchema, required: true },
    stats: { type: AdStatsSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    collection: 'snapchat_ads',
  }
);

SnapchatAdSchema.index({ campaignId: 1, status: 1 });
SnapchatAdSchema.index({ snapchatAdId: 1 });

export const SnapchatAd = mongoose.model<ISnapchatAdDocument>(
  'SnapchatAd',
  SnapchatAdSchema
);
