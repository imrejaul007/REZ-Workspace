import mongoose, { Schema, Document } from 'mongoose';
import { ImpressionEvent } from '../types/index.js';

export interface IImpression extends Omit<ImpressionEvent, 'createdAt' | 'updatedAt'>, Document {}

const ImpressionMetadataSchema = new Schema({
  country: { type: String },
  device: { type: String, enum: ['desktop', 'mobile', 'tablet'] },
  browser: { type: String },
  os: { type: String },
  referrer: { type: String },
}, { _id: false });

const ImpressionSchema = new Schema<IImpression>({
  eventId: { type: String, required: true, unique: true, index: true },
  placementId: { type: String, required: true, index: true },
  publisherId: { type: String, required: true, index: true },
  adId: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },
  metadata: { type: ImpressionMetadataSchema },
}, {
  timestamps: true,
});

ImpressionSchema.index({ publisherId: 1, timestamp: -1 });
ImpressionSchema.index({ placementId: 1, timestamp: -1 });
ImpressionSchema.index({ publisherId: 1, placementId: 1, timestamp: -1 });

export const ImpressionModel = mongoose.model<IImpression>('Impression', ImpressionSchema);