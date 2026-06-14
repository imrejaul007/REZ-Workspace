import mongoose, { Schema, Document } from 'mongoose';
import type { IMarketplaceCampaign, CampaignStatus, DeliveryMetrics } from '../types.js';

export interface MarketplaceCampaignDocument extends Omit<IMarketplaceCampaign, 'createdAt' | 'updatedAt'>, Document {}

const deliveryMetricsSchema = new Schema<DeliveryMetrics>(
  {
    impressions: { type: Number, default: 0 },
    uniqueUsersReached: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    attributedRevenue: { type: Number, default: 0 },
    roi: { type: Number, default: 0 },
  },
  { _id: false }
);

const marketplaceCampaignSchema = new Schema<MarketplaceCampaignDocument>(
  {
    campaignId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    advertiserId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed', 'archived'],
      default: 'draft',
      index: true,
    },
    segments: {
      type: [
        {
          segmentId: { type: String, required: true },
          bidAmount: { type: Number },
          budget: { type: Number, required: true, min: 0 },
          spent: { type: Number, default: 0, min: 0 },
        },
      ],
      default: [],
    },
    totalBudget: {
      type: Number,
      required: true,
      min: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    deliveryMetrics: {
      type: deliveryMetricsSchema,
      default: () => ({}),
    },
    targeting: {
      locations: { type: [String], default: [] },
      demographics: {
        ageRanges: { type: [String], default: [] },
        genders: { type: [String], default: [] },
      },
      devices: { type: [String], default: [] },
    },
  },
  {
    timestamps: true,
    collection: 'marketplace_campaigns',
  }
);

// Indexes
marketplaceCampaignSchema.index({ advertiserId: 1, status: 1 });
marketplaceCampaignSchema.index({ startDate: 1, endDate: 1 });
marketplaceCampaignSchema.index({ status: 1, startDate: 1 });

export const MarketplaceCampaign = mongoose.model<MarketplaceCampaignDocument>(
  'MarketplaceCampaign',
  marketplaceCampaignSchema
);
