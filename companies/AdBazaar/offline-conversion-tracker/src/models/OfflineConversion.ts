import mongoose, { Document, Schema } from 'mongoose';

export interface IOfflineConversion extends Document {
  campaignId: string;
  userId?: string;
  type: 'purchase' | 'visit' | 'call' | 'form' | 'install' | 'other';
  value?: number;
  currency?: string;
  date: Date;
  source?: string;
  medium?: string;
  device?: string;
  location?: {
    country?: string;
    state?: string;
    city?: string;
    zip?: string;
  };
  metadata?: Record<string, any>;
  matchedOnlineId?: string;
  matchConfidence?: number;
  importId?: string;
  status: 'pending' | 'matched' | 'confirmed' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const OfflineConversionSchema = new Schema<IOfflineConversion>(
  {
    campaignId: { type: String, required: true, index: true },
    userId: { type: String, index: true },
    type: {
      type: String,
      enum: ['purchase', 'visit', 'call', 'form', 'install', 'other'],
      required: true
    },
    value: { type: Number },
    currency: { type: String, default: 'INR' },
    date: { type: Date, required: true, index: true },
    source: { type: String },
    medium: { type: String },
    device: { type: String },
    location: {
      country: String,
      state: String,
      city: String,
      zip: String
    },
    metadata: { type: Schema.Types.Mixed },
    matchedOnlineId: { type: String, index: true },
    matchConfidence: { type: Number, min: 0, max: 100 },
    importId: { type: String, index: true },
    status: {
      type: String,
      enum: ['pending', 'matched', 'confirmed', 'rejected'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

OfflineConversionSchema.index({ campaignId: 1, date: -1 });
OfflineConversionSchema.index({ userId: 1, date: -1 });
OfflineConversionSchema.index({ type: 1, date: -1 });

export const OfflineConversion = mongoose.model<IOfflineConversion>(
  'OfflineConversion',
  OfflineConversionSchema
);