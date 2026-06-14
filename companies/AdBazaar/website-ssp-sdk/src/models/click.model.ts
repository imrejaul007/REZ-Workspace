import mongoose, { Schema, Document } from 'mongoose';
import { ClickEvent } from '../types/index.js';

export interface IClick extends Omit<ClickEvent, 'createdAt' | 'updatedAt'>, Document {}

const ClickMetadataSchema = new Schema({
  country: { type: String },
  device: { type: String, enum: ['desktop', 'mobile', 'tablet'] },
}, { _id: false });

const ClickSchema = new Schema<IClick>({
  eventId: { type: String, required: true, unique: true, index: true },
  impressionId: { type: String, required: true, index: true },
  placementId: { type: String, required: true, index: true },
  publisherId: { type: String, required: true, index: true },
  adId: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },
  metadata: { type: ClickMetadataSchema },
}, {
  timestamps: true,
});

ClickSchema.index({ publisherId: 1, timestamp: -1 });
ClickSchema.index({ placementId: 1, timestamp: -1 });

export const ClickModel = mongoose.model<IClick>('Click', ClickSchema);