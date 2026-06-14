import mongoose, { Document, Schema } from 'mongoose';

export interface IBrandCampaign extends Document {
  campaignId: string;
  name: string;
  advertiserId: string;
  brandId: string;
  brandName: string;
  keywords: string[];
  matchTypes: ('broad' | 'phrase' | 'exact')[];
  budget: {
    daily: number;
    lifetime: number;
    spent: number;
  };
  status: 'draft' | 'active' | 'paused' | 'archived';
  targeting: {
    categories: string[];
    products: string[];
    audiences: string[];
    ageGroups: string[];
    gender: string[];
  };
  bidStrategy: {
    type: 'manual' | 'auto' | 'enhanced';
    defaultBid: number;
    maxBid: number;
  };
  schedule: {
    startDate: Date;
    endDate?: Date;
  };
  creativeAssets: {
    headlines: string[];
    descriptions: string[];
    logoUrl?: string;
    bannerUrls: string[];
  };
  performance: {
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
    roas: number;
  };
  settings: {
    allowVideoAds: boolean;
    allowDisplayAds: boolean;
    allowSearchAds: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const BrandCampaignSchema = new Schema<IBrandCampaign>(
  {
    campaignId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    advertiserId: { type: String, required: true, index: true },
    brandId: { type: String, required: true, index: true },
    brandName: { type: String, required: true },
    keywords: { type: [String], default: [] },
    matchTypes: {
      type: [String],
      enum: ['broad', 'phrase', 'exact'],
      default: ['broad']
    },
    budget: {
      daily: { type: Number, default: 0 },
      lifetime: { type: Number, default: 0 },
      spent: { type: Number, default: 0 }
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'archived'],
      default: 'draft'
    },
    targeting: {
      categories: { type: [String], default: [] },
      products: { type: [String], default: [] },
      audiences: { type: [String], default: [] },
      ageGroups: { type: [String], default: [] },
      gender: { type: [String], default: [] }
    },
    bidStrategy: {
      type: {
        type: String,
        enum: ['manual', 'auto', 'enhanced'],
        default: 'manual'
      },
      defaultBid: { type: Number, default: 0.5 },
      maxBid: { type: Number, default: 10 }
    },
    schedule: {
      startDate: { type: Date, required: true },
      endDate: { type: Date }
    },
    creativeAssets: {
      headlines: { type: [String], default: [] },
      descriptions: { type: [String], default: [] },
      logoUrl: { type: String },
      bannerUrls: { type: [String], default: [] }
    },
    performance: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      spend: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      roas: { type: Number, default: 0 }
    },
    settings: {
      allowVideoAds: { type: Boolean, default: true },
      allowDisplayAds: { type: Boolean, default: true },
      allowSearchAds: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

BrandCampaignSchema.index({ advertiserId: 1, status: 1 });
BrandCampaignSchema.index({ brandId: 1, status: 1 });

export const BrandCampaign = mongoose.model<IBrandCampaign>('BrandCampaign', BrandCampaignSchema);