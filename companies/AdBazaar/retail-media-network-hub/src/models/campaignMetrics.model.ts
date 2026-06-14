import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaignMetrics extends Document {
  campaignId: string;
  date: Date;
  impressions: number;
  clicks: number;
  orders: number;
  revenue: number;
  spend: number;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignMetricsSchema = new Schema<ICampaignMetrics>(
  {
    campaignId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    impressions: {
      type: Number,
      default: 0,
      min: 0,
    },
    clicks: {
      type: Number,
      default: 0,
      min: 0,
    },
    orders: {
      type: Number,
      default: 0,
      min: 0,
    },
    revenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    spend: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: 'campaign_metrics',
  }
);

// Compound index for efficient time-series queries
CampaignMetricsSchema.index({ campaignId: 1, date: -1 });
CampaignMetricsSchema.index({ date: -1 });

export const CampaignMetrics = mongoose.model<ICampaignMetrics>(
  'CampaignMetrics',
  CampaignMetricsSchema
);
