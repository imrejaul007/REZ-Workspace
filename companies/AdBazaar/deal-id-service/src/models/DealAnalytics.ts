import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

// Zod validation schema
export const DealAnalyticsSchema = z.object({
  dealId: z.string().min(1),
  date: z.string().min(1),
  impressions: z.object({
    total: z.number().int().min(0).default(0),
    measurable: z.number().int().min(0).default(0),
    viewable: z.number().int().min(0).default(0),
    viewabilityRate: z.number().min(0).max(100).default(0),
  }),
  clicks: z.object({
    total: z.number().int().min(0).default(0),
    viewThrough: z.number().int().min(0).default(0),
    clickThroughRate: z.number().min(0).max(100).default(0),
  }),
  spend: z.object({
    total: z.number().min(0).default(0),
    daily: z.number().min(0).default(0),
    remaining: z.number().min(0).default(0),
    currency: z.string().default('USD'),
  }),
  pacing: z.object({
    daily: z.number().min(0).default(0),
    weekly: z.number().min(0).default(0),
    monthly: z.number().min(0).default(0),
    target: z.number().min(0).default(0),
    actual: z.number().min(0).default(0),
    variance: z.number().default(0),
    percentComplete: z.number().min(0).max(100).default(0),
  }),
  performance: z.object({
    cpm: z.number().min(0).default(0),
    cpc: z.number().min(0).default(0),
    cpa: z.number().min(0).default(0),
    roas: z.number().min(0).default(0),
    conversionRate: z.number().min(0).max(100).default(0),
  }),
  inventory: z.object({
    total: z.number().int().min(0).default(0),
    filled: z.number().int().min(0).default(0),
    fillRate: z.number().min(0).max(100).default(0),
    bidRequests: z.number().int().min(0).default(0),
    bids: z.number().int().min(0).default(0),
    bidRate: z.number().min(0).max(100).default(0),
  }),
  targeting: z.record(z.object({
    impressions: z.number().int().min(0),
    clicks: z.number().int().min(0),
    spend: z.number().min(0),
  })).optional(),
  errors: z.object({
    noFill: z.number().int().min(0).default(0),
    timeout: z.number().int().min(0).default(0),
    invalid: z.number().int().min(0).default(0),
    rateLimit: z.number().int().min(0).default(0),
  }),
  metadata: z.record(z.any()).optional(),
});

export type IDealAnalytics = z.infer<typeof DealAnalyticsSchema>;

export interface IDealAnalyticsDocument extends IDealAnalytics, Document {
  createdAt: Date;
  updatedAt: Date;
}

const dealAnalyticsMongooseSchema = new Schema<IDealAnalyticsDocument>(
  {
    dealId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    impressions: {
      total: { type: Number, default: 0, min: 0 },
      measurable: { type: Number, default: 0, min: 0 },
      viewable: { type: Number, default: 0, min: 0 },
      viewabilityRate: { type: Number, default: 0, min: 0, max: 100 },
    },
    clicks: {
      total: { type: Number, default: 0, min: 0 },
      viewThrough: { type: Number, default: 0, min: 0 },
      clickThroughRate: { type: Number, default: 0, min: 0, max: 100 },
    },
    spend: {
      total: { type: Number, default: 0, min: 0 },
      daily: { type: Number, default: 0, min: 0 },
      remaining: { type: Number, default: 0, min: 0 },
      currency: { type: String, default: 'USD' },
    },
    pacing: {
      daily: { type: Number, default: 0, min: 0 },
      weekly: { type: Number, default: 0, min: 0 },
      monthly: { type: Number, default: 0, min: 0 },
      target: { type: Number, default: 0, min: 0 },
      actual: { type: Number, default: 0, min: 0 },
      variance: { type: Number, default: 0 },
      percentComplete: { type: Number, default: 0, min: 0, max: 100 },
    },
    performance: {
      cpm: { type: Number, default: 0, min: 0 },
      cpc: { type: Number, default: 0, min: 0 },
      cpa: { type: Number, default: 0, min: 0 },
      roas: { type: Number, default: 0, min: 0 },
      conversionRate: { type: Number, default: 0, min: 0, max: 100 },
    },
    inventory: {
      total: { type: Number, default: 0, min: 0 },
      filled: { type: Number, default: 0, min: 0 },
      fillRate: { type: Number, default: 0, min: 0, max: 100 },
      bidRequests: { type: Number, default: 0, min: 0 },
      bids: { type: Number, default: 0, min: 0 },
      bidRate: { type: Number, default: 0, min: 0, max: 100 },
    },
    targeting: {
      type: Map,
      of: {
        impressions: Number,
        clicks: Number,
        spend: Number,
      },
    },
    errors: {
      noFill: { type: Number, default: 0, min: 0 },
      timeout: { type: Number, default: 0, min: 0 },
      invalid: { type: Number, default: 0, min: 0 },
      rateLimit: { type: Number, default: 0, min: 0 },
    },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
dealAnalyticsMongooseSchema.index({ dealId: 1, date: 1 });
dealAnalyticsMongooseSchema.index({ dealId: 1, 'performance.cpm': 1 });
dealAnalyticsMongooseSchema.index({ dealId: 1, 'spend.total': 1 });

// Virtual for viewability calculation
dealAnalyticsMongooseSchema.virtual('calculatedViewabilityRate').get(function (this: IDealAnalyticsDocument) {
  if (this.impressions.measurable === 0) return 0;
  return (this.impressions.viewable / this.impressions.measurable) * 100;
});

// Virtual for CTR calculation
dealAnalyticsMongooseSchema.virtual('calculatedCTR').get(function (this: IDealAnalyticsDocument) {
  if (this.impressions.total === 0) return 0;
  return (this.clicks.total / this.impressions.total) * 100;
});

// Virtual for CPM calculation
dealAnalyticsMongooseSchema.virtual('calculatedCPM').get(function (this: IDealAnalyticsDocument) {
  if (this.impressions.total === 0) return 0;
  return (this.spend.total / this.impressions.total) * 1000;
});

export const DealAnalytics = mongoose.model<IDealAnalyticsDocument>('DealAnalytics', dealAnalyticsMongooseSchema);