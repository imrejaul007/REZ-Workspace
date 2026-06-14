import mongoose, { Schema, Document } from 'mongoose';
import type { AdRequest as IAdRequest, AdRequestStatus, Platform, AdFormat } from '../types/index.js';

export interface AdRequestDocument extends Omit<IAdRequest, never>, Document {}

const AdRequestSchema = new Schema<AdRequestDocument>(
  {
    requestId: { type: String, required: true, unique: true, index: true },
    placementId: { type: String, required: true, index: true },
    appId: { type: String, required: true, index: true },
    publisherId: { type: String, required: true, index: true },
    platform: {
      type: String,
      enum: ['ios', 'android', 'react-native', 'flutter'] as Platform[],
      required: true,
    },
    adFormat: {
      type: String,
      enum: ['banner', 'interstitial', 'native', 'rewarded', 'app-open'] as AdFormat[],
      required: true,
    },
    deviceId: { type: String, required: true },
    ipAddress: { type: String, required: true },
    userAgent: { type: String, required: true },
    language: { type: String, default: 'en' },
    country: { type: String, default: 'US' },
    timestamp: { type: Date, default: Date.now, index: true },
    status: {
      type: String,
      enum: ['pending', 'filled', 'no-fill', 'expired'] as AdRequestStatus[],
      default: 'pending',
    },
    responseTime: { type: Number },
    filledAt: { type: Date },
    noFillReason: { type: String },
  },
  {
    timestamps: true,
  }
);

// Indexes
AdRequestSchema.index({ placementId: 1, timestamp: -1 });
AdRequestSchema.index({ publisherId: 1, timestamp: -1 });
AdRequestSchema.index({ appId: 1, timestamp: -1 });
AdRequestSchema.index({ status: 1, timestamp: -1 });

export const AdRequestModel = mongoose.model<AdRequestDocument>(
  'AdRequest',
  AdRequestSchema
);