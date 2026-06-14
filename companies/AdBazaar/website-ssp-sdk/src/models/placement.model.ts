import mongoose, { Schema, Document } from 'mongoose';
import { Placement } from '../types/index.js';

export interface IPlacement extends Omit<Placement, 'createdAt' | 'updatedAt'>, Document {}

const PlacementSchema = new Schema<IPlacement>({
  placementId: { type: String, required: true, unique: true, index: true },
  publisherId: { type: String, required: true, index: true },
  name: { type: String, required: true, maxlength: 100 },
  pageUrl: { type: String, required: true },
  adFormats: [{
    type: String,
    enum: ['banner', 'rectangle', 'native', 'video', 'interstitial'],
  }],
  size: {
    width: { type: Number, required: true, min: 1, max: 2000 },
    height: { type: Number, required: true, min: 1, max: 2000 },
  },
  position: {
    type: String,
    enum: ['header', 'sidebar', 'content', 'footer', 'interstitial'],
    required: true,
  },
  minCPM: { type: Number, default: 1.0, min: 0 },
  status: {
    type: String,
    enum: ['active', 'paused', 'archived'],
    default: 'active',
  },
}, {
  timestamps: true,
});

PlacementSchema.index({ publisherId: 1, status: 1 });
PlacementSchema.index({ pageUrl: 1 });

export const PlacementModel = mongoose.model<IPlacement>('Placement', PlacementSchema);