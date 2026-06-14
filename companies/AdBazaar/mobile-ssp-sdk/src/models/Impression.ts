import mongoose, { Schema, Document } from 'mongoose';
import type { Impression as IImpression } from '../types/index.js';

export interface ImpressionDocument extends Omit<IImpression, never>, Document {}

const ImpressionSchema = new Schema<ImpressionDocument>(
  {
    impressionId: { type: String, required: true, unique: true, index: true },
    requestId: { type: String, required: true, index: true },
    adId: { type: String, required: true, index: true },
    placementId: { type: String, required: true, index: true },
    appId: { type: String, required: true, index: true },
    publisherId: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
    viewable: { type: Boolean, default: false },
    viewableTime: { type: Number },
  },
  {
    timestamps: true,
  }
);

// Indexes for analytics
ImpressionSchema.index({ publisherId: 1, timestamp: -1 });
ImpressionSchema.index({ placementId: 1, timestamp: -1 });
ImpressionSchema.index({ createdAt: -1 });

export const ImpressionModel = mongoose.model<ImpressionDocument>(
  'Impression',
  ImpressionSchema
);