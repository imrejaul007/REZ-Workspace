/**
 * REZ Go Sponsored Commerce
 *
 * Brand sponsorship features:
 * - Sponsored cashback
 * - Featured products
 * - Aisle placement
 * - Scan rewards
 */

import mongoose, { Document, Schema } from 'mongoose';

// Sponsored campaign document interface
export interface ISponsoredCampaign extends Document {
  campaignId: string;
  merchantId: string;
  storeId?: string;
  brandId: string;
  brandName: string;
  name: string;
  description?: string;
  type: 'cashback' | 'featured' | 'aisle' | 'scan_reward' | 'combo';
  status: 'draft' | 'active' | 'paused' | 'completed';
  budget: {
    total: number;
    spent: number;
    remaining: number;
  };
  targeting: {
    minCartValue?: number;
    categories?: string[];
    brands?: string[];
    userSegments?: string[];
    locations?: string[];
    timeRange?: {
      start: Date;
      end: Date;
    };
  };
  reward: {
    type: 'percentage' | 'fixed' | 'coin';
    value: number;
    minPurchase?: number;
    maxReward?: number;
  };
  productIds?: string[];
  categoryIds?: string[];
  metrics: {
    impressions: number;
    scans: number;
    redemptions: number;
    revenue: number;
    ctr: number;
    roas: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SponsoredCampaignSchema = new Schema<ISponsoredCampaign>(
  {
    campaignId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    merchantId: { type: String, required: true, index: true },
    storeId: { type: String, index: true },
    brandId: { type: String, required: true, index: true },
    brandName: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    type: {
      type: String,
      enum: ['cashback', 'featured', 'aisle', 'scan_reward', 'combo'],
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed'],
      default: 'draft',
    },
    budget: {
      total: { type: Number, required: true },
      spent: { type: Number, default: 0 },
      remaining: { type: Number, default: 0 },
    },
    targeting: {
      minCartValue: { type: Number },
      categories: [{ type: String }],
      brands: [{ type: String }],
      userSegments: [{ type: String }],
      locations: [{ type: String }],
      timeRange: {
        start: { type: Date },
        end: { type: Date },
      },
    },
    reward: {
      type: {
        type: String,
        enum: ['percentage', 'fixed', 'coin'],
        required: true,
      },
      value: { type: Number, required: true },
      minPurchase: { type: Number },
      maxReward: { type: Number },
    },
    productIds: [{ type: String, index: true }],
    categoryIds: [{ type: String }],
    metrics: {
      impressions: { type: Number, default: 0 },
      scans: { type: Number, default: 0 },
      redemptions: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 },
      roas: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Indexes
SponsoredCampaignSchema.index({ status: 1, 'targeting.timeRange.start': 1 });
SponsoredCampaignSchema.index({ brandId: 1, status: 1 });
SponsoredCampaignSchema.index({ storeId: 1, status: 1 });

export const SponsoredCampaign = mongoose.model<ISponsoredCampaign>(
  'SponsoredCampaign',
  SponsoredCampaignSchema
);

// Featured product document
export interface IFeaturedProduct extends Document {
  productId: string;
  storeId: string;
  campaignId: string;
  brandId: string;
  brandName: string;
  position: number;
  badge?: string;
  cashback?: number;
  validUntil?: Date;
  createdAt: Date;
}

const FeaturedProductSchema = new Schema<IFeaturedProduct>(
  {
    productId: { type: String, required: true, index: true },
    storeId: { type: String, required: true, index: true },
    campaignId: { type: String, required: true },
    brandId: { type: String, required: true },
    brandName: { type: String, required: true },
    position: { type: Number, default: 0 },
    badge: { type: String },
    cashback: { type: Number },
    validUntil: { type: Date },
  },
  { timestamps: true }
);

FeaturedProductSchema.index({ storeId: 1, position: 1 });

export const FeaturedProduct = mongoose.model<IFeaturedProduct>(
  'FeaturedProduct',
  FeaturedProductSchema
);
