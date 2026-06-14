import mongoose, { Schema, Document } from 'mongoose';
import {
  CampaignType,
  CampaignStatus,
  AudienceType,
  ProductBid,
  Targeting,
  Budget,
  Metrics,
} from '../types/index.js';

export interface IProductBid {
  productId: string;
  bidAmount: number;
  dailyBudget: number;
}

export interface ITargeting {
  category?: string[];
  keywords?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  audienceType?: AudienceType;
}

export interface IBudget {
  total: number;
  spent: number;
}

export interface IMetrics {
  impressions: number;
  clicks: number;
  orders: number;
  revenue: number;
  acos: number;
}

export interface IRetailMediaCampaign extends Document {
  campaignId: string;
  merchantId: string;
  name: string;
  type: CampaignType;
  products?: IProductBid[];
  targeting: ITargeting;
  budget: IBudget;
  metrics: IMetrics;
  status: CampaignStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ProductBidSchema = new Schema<IProductBid>(
  {
    productId: { type: String, required: true },
    bidAmount: { type: Number, required: true, min: 0 },
    dailyBudget: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const TargetingSchema = new Schema<ITargeting>(
  {
    category: { type: [String], default: [] },
    keywords: { type: [String], default: [] },
    priceRange: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
    },
    audienceType: {
      type: String,
      enum: ['shoppers', 'repeat_buyers', 'cart_abandoners'],
    },
  },
  { _id: false }
);

const BudgetSchema = new Schema<IBudget>(
  {
    total: { type: Number, required: true, min: 0 },
    spent: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const MetricsSchema = new Schema<IMetrics>(
  {
    impressions: { type: Number, default: 0, min: 0 },
    clicks: { type: Number, default: 0, min: 0 },
    orders: { type: Number, default: 0, min: 0 },
    revenue: { type: Number, default: 0, min: 0 },
    acos: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const RetailMediaCampaignSchema = new Schema<IRetailMediaCampaign>(
  {
    campaignId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    merchantId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 200,
    },
    type: {
      type: String,
      required: true,
      enum: ['sponsored_products', 'display', 'video', 'search'],
    },
    products: {
      type: [ProductBidSchema],
      default: [],
    },
    targeting: {
      type: TargetingSchema,
      required: true,
    },
    budget: {
      type: BudgetSchema,
      required: true,
    },
    metrics: {
      type: MetricsSchema,
      default: () => ({
        impressions: 0,
        clicks: 0,
        orders: 0,
        revenue: 0,
        acos: 0,
      }),
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed'],
      default: 'active',
 index: true,
    },
  },
  {
    timestamps: true,
    collection: 'retail_media_campaigns',
  }
);

// Indexes for efficient queries
RetailMediaCampaignSchema.index({ merchantId: 1, status: 1 });
RetailMediaCampaignSchema.index({ merchantId: 1, type: 1 });
RetailMediaCampaignSchema.index({ createdAt: -1 });
RetailMediaCampaignSchema.index({ 'targeting.category': 1 });
RetailMediaCampaignSchema.index({ 'targeting.keywords': 1 });

// Virtual for calculating ACOS
RetailMediaCampaignSchema.virtual('acos').get(function () {
  if (this.metrics.revenue > 0) {
    return (this.budget.spent / this.metrics.revenue) * 100;
  }
  return 0;
});

// Pre-save hook to generate campaignId if not provided
RetailMediaCampaignSchema.pre('save', function (next) {
  if (!this.campaignId) {
    this.campaignId = `RMN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

export const RetailMediaCampaign = mongoose.model<IRetailMediaCampaign>(
  'RetailMediaCampaign',
  RetailMediaCampaignSchema
);
