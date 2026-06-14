import mongoose, { Schema, Document } from 'mongoose';

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
export type CampaignObjective = 'awareness' | 'consideration' | 'conversion' | 'loyalty';
export type BidStrategy = 'cpm' | 'cpc' | 'cpas';

export interface IRetailCampaign extends Document {
  _id: mongoose.Types.ObjectId;
  retailerId: mongoose.Types.ObjectId;
  advertiserId: string;
  name: string;
  description?: string;
  objective: CampaignObjective;
  status: CampaignStatus;
  bidStrategy: BidStrategy;
  budget: {
    total: number;
    daily?: number;
    spent: number;
    remaining: number;
  };
  targeting: {
    storeIds?: string[];
    categories?: string[];
    productIds?: string[];
    audienceSegments?: string[];
    locationTypes?: string[];
  };
  products: Array<{
    productId: string;
    name: string;
    category: string;
    bidAmount: number;
    adSchedule: {
      startDate: Date;
      endDate: Date;
      days: string[];
      hours: { start: number; end: number };
    };
  }>;
  creativeAssets: Array<{
    assetId: string;
    type: 'image' | 'video' | 'html';
    url: string;
    inventoryType: string;
    status: 'pending' | 'approved' | 'rejected';
  }>;
  schedule: {
    startDate: Date;
    endDate: Date;
    flighting?: Array<{
      startDate: Date;
      endDate: Date;
      budgetPercent: number;
    }>;
  };
  performance: {
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    ctr: number;
    conversionRate: number;
    roas: number;
    avgCpc: number;
    avgCpm: number;
  };
  attribution: {
    enabled: boolean;
    model: 'last_touch' | 'first_touch' | 'linear' | 'data_driven';
    windowDays: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const RetailCampaignSchema = new Schema<IRetailCampaign>(
  {
    retailerId: { type: Schema.Types.ObjectId, ref: 'Retailer', required: true, index: true },
    advertiserId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    objective: {
      type: String,
      enum: ['awareness', 'consideration', 'conversion', 'loyalty'],
      required: true
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
      default: 'draft',
      index: true
    },
    bidStrategy: {
      type: String,
      enum: ['cpm', 'cpc', 'cpas'],
      default: 'cpm'
    },
    budget: {
      total: { type: Number, required: true },
      daily: { type: Number },
      spent: { type: Number, default: 0 },
      remaining: { type: Number }
    },
    targeting: {
      storeIds: [{ type: String }],
      categories: [{ type: String }],
      productIds: [{ type: String }],
      audienceSegments: [{ type: String }],
      locationTypes: [{ type: String }]
    },
    products: [{
      productId: { type: String, required: true },
      name: { type: String, required: true },
      category: { type: String, required: true },
      bidAmount: { type: Number, required: true },
      adSchedule: {
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        days: [{ type: String }],
        hours: {
          start: { type: Number, default: 0 },
          end: { type: Number, default: 24 }
        }
      }
    }],
    creativeAssets: [{
      assetId: { type: String, required: true },
      type: { type: String, enum: ['image', 'video', 'html'], required: true },
      url: { type: String, required: true },
      inventoryType: { type: String, required: true },
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
    }],
    schedule: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      flighting: [{
        startDate: Date,
        endDate: Date,
        budgetPercent: Number
      }]
    },
    performance: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 },
      roas: { type: Number, default: 0 },
      avgCpc: { type: Number, default: 0 },
      avgCpm: { type: Number, default: 0 }
    },
    attribution: {
      enabled: { type: Boolean, default: true },
      model: {
        type: String,
        enum: ['last_touch', 'first_touch', 'linear', 'data_driven'],
        default: 'last_touch'
      },
      windowDays: { type: Number, default: 7 }
    }
  },
  { timestamps: true }
);

// Indexes
RetailCampaignSchema.index({ retailerId: 1, status: 1 });
RetailCampaignSchema.index({ advertiserId: 1, status: 1 });
RetailCampaignSchema.index({ 'schedule.startDate': 1, 'schedule.endDate': 1 });
RetailCampaignSchema.index({ 'budget.spent': 1 });

// Pre-save to calculate remaining budget
RetailCampaignSchema.pre('save', function (next) {
  this.budget.remaining = this.budget.total - this.budget.spent;
  next();
});

export const RetailCampaign = mongoose.model<IRetailCampaign>('RetailCampaign', RetailCampaignSchema);
export default RetailCampaign;