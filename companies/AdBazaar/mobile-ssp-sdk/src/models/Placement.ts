import mongoose, { Schema, Document } from 'mongoose';
import type { Placement as IPlacement, PlacementTargeting, AdFormat } from '../types/index.js';

export interface PlacementDocument extends Omit<IPlacement, never>, Document {}

const PlacementTargetingSchema = new Schema<PlacementTargeting>(
  {
    countries: { type: [String], default: [] },
    excludedCountries: { type: [String], default: [] },
    devices: { type: [String], default: [] },
    osVersions: { type: [String], default: [] },
    demographics: {
      ageMin: { type: Number },
      ageMax: { type: Number },
      gender: { type: String, enum: ['male', 'female', 'other'] },
    },
  },
  { _id: false }
);

const PlacementSchema = new Schema<PlacementDocument>(
  {
    placementId: { type: String, required: true, unique: true, index: true },
    appId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    adFormat: {
      type: String,
      enum: ['banner', 'interstitial', 'native', 'rewarded', 'app-open'] as AdFormat[],
      required: true,
    },
    width: { type: Number },
    height: { type: Number },
    position: {
      type: String,
      enum: ['top', 'bottom', 'center', 'interstitial'],
      default: 'bottom',
    },
    refreshInterval: { type: Number, default: 30 },
    ecpm: { type: Number, default: 1.0 },
    status: {
      type: String,
      enum: ['active', 'paused', 'disabled'],
      default: 'active',
    },
    targeting: { type: PlacementTargetingSchema },
  },
  {
    timestamps: true,
  }
);

// Indexes
PlacementSchema.index({ appId: 1, adFormat: 1 });
PlacementSchema.index({ status: 1 });
PlacementSchema.index({ createdAt: -1 });

export const PlacementModel = mongoose.model<PlacementDocument>(
  'Placement',
  PlacementSchema
);