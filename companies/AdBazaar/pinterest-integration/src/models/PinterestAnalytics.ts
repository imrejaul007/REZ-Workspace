import mongoose, { Document, Schema } from 'mongoose';
import { IPinterestAnalytics } from '../types';

export interface IPinterestAnalyticsDocument extends IPinterestAnalytics, Document {}

const TopPinSchema = new Schema(
  {
    pinId: { type: String, required: true },
    title: { type: String, required: true },
    impressions: { type: Number, required: true },
  },
  { _id: false }
);

const AudienceInsightsSchema = new Schema(
  {
    ageBreakdown: { type: Map, of: Number, default: {} },
    genderBreakdown: { type: Map, of: Number, default: {} },
    countryBreakdown: { type: Map, of: Number, default: {} },
    deviceBreakdown: { type: Map, of: Number, default: {} },
  },
  { _id: false }
);

const PinterestAnalyticsSchema = new Schema<IPinterestAnalyticsDocument>(
  {
    accountId: { type: String, required: true, index: true },
    date: { type: Date, required: true, index: true },
    impressions: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    repins: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    topPins: { type: [TopPinSchema], default: [] },
    audienceInsights: { type: AudienceInsightsSchema },
  },
  {
    timestamps: true,
    collection: 'pinterest_analytics',
  }
);

// Compound index for efficient date-based queries per account
PinterestAnalyticsSchema.index({ accountId: 1, date: -1 });

export const PinterestAnalytics = mongoose.model<IPinterestAnalyticsDocument>(
  'PinterestAnalytics',
  PinterestAnalyticsSchema
);