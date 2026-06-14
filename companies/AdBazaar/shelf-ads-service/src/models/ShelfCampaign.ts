import mongoose, { Document, Schema } from 'mongoose';

export interface IGeoTargeting {
  type: 'city' | 'state' | 'zone' | 'radius';
  values: string[];
  radius?: {
    center: { lat: number; lng: number };
    km: number;
  };
}

export interface IShelfCampaign {
  advertiserId: string;
  name: string;
  description?: string;
  shelves: mongoose.Types.ObjectId[];
  storeIds: mongoose.Types.ObjectId[];
  targeting: {
    geo: IGeoTargeting;
    categories: string[];
    storeTiers: ('premium' | 'standard' | 'economy')[];
    storeSizes: ('small' | 'medium' | 'large')[];
    minFootfall?: number;
  };
  budget: {
    total: number;
    daily?: number;
    spent: number;
    currency: string;
  };
  dates: {
    start: Date;
    end: Date;
  };
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  creative: {
    type: 'image' | 'video' | 'digital';
    url: string;
    copy?: string;
  };
  performance: {
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    salesLift?: number;
    roas?: number;
  };
  bidStrategy: {
    type: 'auto' | 'manual';
    maxBid?: number;
    targetCpm?: number;
  };
  optimization: {
    enabled: boolean;
    goals: ('impressions' | 'clicks' | 'conversions' | 'sales_lift')[];
    weights: Record<string, number>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IShelfCampaignDocument extends IShelfCampaign, Document {
  _id: mongoose.Types.ObjectId;
}

const ShelfCampaignSchema = new Schema<IShelfCampaignDocument>(
  {
    advertiserId: {
      type: String,
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: String,
    shelves: [{
      type: Schema.Types.ObjectId,
      ref: 'Shelf'
    }],
    storeIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Store'
    }],
    targeting: {
      geo: {
        type: { type: String, enum: ['city', 'state', 'zone', 'radius'] },
        values: [String],
        radius: {
          center: {
            lat: Number,
            lng: Number
          },
          km: Number
        }
      },
      categories: [{
        type: String,
        index: true
      }],
      storeTiers: [{
        type: String,
        enum: ['premium', 'standard', 'economy']
      }],
      storeSizes: [{
        type: String,
        enum: ['small', 'medium', 'large']
      }],
      minFootfall: Number
    },
    budget: {
      total: { type: Number, required: true, min: 0 },
      daily: Number,
      spent: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' }
    },
    dates: {
      start: { type: Date, required: true, index: true },
      end: { type: Date, required: true, index: true }
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
      default: 'draft',
      index: true
    },
    creative: {
      type: {
        type: String,
        enum: ['image', 'video', 'digital'],
        default: 'image'
      },
      url: { type: String, required: true },
      copy: String
    },
    performance: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      salesLift: Number,
      roas: Number
    },
    bidStrategy: {
      type: {
        type: String,
        enum: ['auto', 'manual'],
        default: 'manual'
      },
      maxBid: Number,
      targetCpm: Number
    },
    optimization: {
      enabled: { type: Boolean, default: false },
      goals: [{
        type: String,
        enum: ['impressions', 'clicks', 'conversions', 'sales_lift']
      }],
      weights: { type: Map, of: Number }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
ShelfCampaignSchema.index({ advertiserId: 1, status: 1 });
ShelfCampaignSchema.index({ 'dates.start': 1, 'dates.end': 1 });
ShelfCampaignSchema.index({ 'targeting.categories': 1 });
ShelfCampaignSchema.index({ 'targeting.geo.values': 1 });

// Virtual for budget utilization
ShelfCampaignSchema.virtual('budgetUtilization').get(function() {
  if (this.budget?.total === 0) return 0;
  return (this.budget?.spent / this.budget?.total) * 100;
});

// Virtual for remaining budget
ShelfCampaignSchema.virtual('remainingBudget').get(function() {
  return this.budget?.total - this.budget?.spent;
});

export const ShelfCampaign = mongoose.model<IShelfCampaignDocument>('ShelfCampaign', ShelfCampaignSchema);
export default ShelfCampaign;