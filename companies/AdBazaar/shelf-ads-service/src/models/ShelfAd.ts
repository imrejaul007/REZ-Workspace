import mongoose, { Document, Schema } from 'mongoose';

export interface IShelfAd {
  shelfId: mongoose.Types.ObjectId;
  advertiserId: string;
  campaignId: mongoose.Types.ObjectId;
  product: {
    name: string;
    sku: string;
    brand: string;
    category: string;
    imageUrl?: string;
    landingUrl?: string;
  };
  creative: {
    type: 'image' | 'video' | 'digital';
    url: string;
    dimensions: {
      width: number;
      height: number;
    };
    copy?: string;
  };
  bid: {
    amount: number;
    currency: string;
    bidType: 'cpm' | 'cpc' | 'fixed';
  };
  targeting: {
    demographics?: {
      ageRange?: string;
      gender?: string;
      income?: string;
    };
    timeSlots?: string[];
    days?: string[];
  };
  status: 'pending' | 'active' | 'paused' | 'completed' | 'rejected';
  impressions: {
    total: number;
    daily: Map<string, number>;
    lastUpdated: Date;
  };
  clicks: {
    total: number;
    daily: Map<string, number>;
  };
  spend: {
    total: number;
    daily: Map<string, number>;
  };
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IShelfAdDocument extends IShelfAd, Document {
  _id: mongoose.Types.ObjectId;
}

const ShelfAdSchema = new Schema<IShelfAdDocument>(
  {
    shelfId: {
      type: Schema.Types.ObjectId,
      ref: 'Shelf',
      required: true,
      index: true
    },
    advertiserId: {
      type: String,
      required: true,
      index: true
    },
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'ShelfCampaign',
      required: true,
      index: true
    },
    product: {
      name: { type: String, required: true },
      sku: { type: String, required: true },
      brand: { type: String, required: true },
      category: { type: String, required: true, index: true },
      imageUrl: String,
      landingUrl: String
    },
    creative: {
      type: {
        type: String,
        enum: ['image', 'video', 'digital'],
        default: 'image'
      },
      url: { type: String, required: true },
      dimensions: {
        width: { type: Number, default: 300 },
        height: { type: Number, default: 200 }
      },
      copy: String
    },
    bid: {
      amount: { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'INR' },
      bidType: {
        type: String,
        enum: ['cpm', 'cpc', 'fixed'],
        default: 'cpm'
      }
    },
    targeting: {
      demographics: {
        ageRange: String,
        gender: String,
        income: String
      },
      timeSlots: [String],
      days: [String]
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'paused', 'completed', 'rejected'],
      default: 'pending',
      index: true
    },
    impressions: {
      total: { type: Number, default: 0 },
      daily: { type: Map, of: Number, default: new Map() },
      lastUpdated: Date
    },
    clicks: {
      total: { type: Number, default: 0 },
      daily: { type: Map, of: Number, default: new Map() }
    },
    spend: {
      total: { type: Number, default: 0 },
      daily: { type: Map, of: Number, default: new Map() }
    },
    startDate: {
      type: Date,
      required: true,
      index: true
    },
    endDate: {
      type: Date,
      required: true,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
ShelfAdSchema.index({ shelfId: 1, status: 1 });
ShelfAdSchema.index({ advertiserId: 1, status: 1 });
ShelfAdSchema.index({ campaignId: 1, status: 1 });
ShelfAdSchema.index({ 'product.category': 1, status: 1 });
ShelfAdSchema.index({ startDate: 1, endDate: 1 });

// Virtual for CTR
ShelfAdSchema.virtual('ctr').get(function() {
  if (this.impressions?.total === 0) return 0;
  return (this.clicks?.total / this.impressions?.total) * 100;
});

// Virtual for effective CPM
ShelfAdSchema.virtual('effectiveCpm').get(function() {
  if (this.impressions?.total === 0) return 0;
  return (this.spend?.total / this.impressions?.total) * 1000;
});

export const ShelfAd = mongoose.model<IShelfAdDocument>('ShelfAd', ShelfAdSchema);
export default ShelfAd;