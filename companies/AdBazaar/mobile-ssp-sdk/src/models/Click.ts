import mongoose, { Schema, Document } from 'mongoose';
import type { Click as IClick } from '../types/index.js';

export interface ClickDocument extends Omit<IClick, never>, Document {}

const ClickSchema = new Schema<ClickDocument>(
  {
    clickId: { type: String, required: true, unique: true, index: true },
    impressionId: { type: String, required: true, index: true },
    requestId: { type: String, required: true, index: true },
    adId: { type: String, required: true, index: true },
    placementId: { type: String, required: true, index: true },
    appId: { type: String, required: true, index: true },
    publisherId: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
    deviceType: { type: String, default: 'mobile' },
  },
  {
    timestamps: true,
  }
);

// Indexes
ClickSchema.index({ publisherId: 1, timestamp: -1 });
ClickSchema.index({ placementId: 1, timestamp: -1 });
ClickSchema.index({ adId: 1, timestamp: -1 });
ClickSchema.index({ createdAt: -1 });

export const ClickModel = mongoose.model<ClickDocument>(
  'Click',
  ClickSchema
);