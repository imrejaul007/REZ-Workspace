import mongoose, { Document, Schema } from 'mongoose';

export interface IBrandAd extends Document {
  adId: string;
  campaignId: string;
  name: string;
  type: 'headline' | 'display' | 'video' | 'search';
  creative: {
    headlines: string[];
    descriptions: string[];
    logoUrl?: string;
    images: string[];
    videos: string[];
    callToAction: string;
  };
  landingPage: {
    url: string;
    type: 'product' | 'category' | 'brand' | 'custom';
    productIds: string[];
  };
  status: 'draft' | 'active' | 'paused' | 'rejected';
  performance: {
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    spend: number;
  };
  review: {
    status: 'pending' | 'approved' | 'rejected';
    feedback?: string;
    reviewedAt?: Date;
    reviewedBy?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const BrandAdSchema = new Schema<IBrandAd>(
  {
    adId: { type: String, required: true, unique: true, index: true },
    campaignId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['headline', 'display', 'video', 'search'],
      default: 'headline'
    },
    creative: {
      headlines: { type: [String], default: [] },
      descriptions: { type: [String], default: [] },
      logoUrl: { type: String },
      images: { type: [String], default: [] },
      videos: { type: [String], default: [] },
      callToAction: { type: String, default: 'Shop Now' }
    },
    landingPage: {
      url: { type: String, required: true },
      type: {
        type: String,
        enum: ['product', 'category', 'brand', 'custom'],
        default: 'brand'
      },
      productIds: { type: [String], default: [] }
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'rejected'],
      default: 'draft'
    },
    performance: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      spend: { type: Number, default: 0 }
    },
    review: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      feedback: { type: String },
      reviewedAt: { type: Date },
      reviewedBy: { type: String }
    }
  },
  { timestamps: true }
);

BrandAdSchema.index({ campaignId: 1, status: 1 });
BrandAdSchema.index({ campaignId: 1, type: 1 });

export const BrandAd = mongoose.model<IBrandAd>('BrandAd', BrandAdSchema);