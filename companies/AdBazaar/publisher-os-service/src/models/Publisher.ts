import mongoose, { Schema, Document } from 'mongoose';

export interface IPublisherContact {
  name: string;
  email: string;
  phone?: string;
  title?: string;
}

export interface IPublisherSettings {
  defaultFloorPrice: number;
  currency: string;
  timezone: string;
  revenueShare: number;
  paymentTerms: 'NET15' | 'NET30' | 'NET45' | 'NET60';
  autoPay: boolean;
  headerBiddingEnabled: boolean;
  dealPriority: 'CPM' | 'CPC' | 'CPA' | 'Hybrid';
  allowedAdTypes: string[];
  blockedAdvertisers: string[];
  blockedCategories: string[];
  brandSafety: {
    enabled: boolean;
    level: 'Strict' | 'Moderate' | 'Relaxed';
    customFilters: string[];
  };
  pacing: {
    enabled: boolean;
    dailyLimit: number;
    monthlyLimit: number;
  };
}

export interface IPublisher extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  domains: string[];
  contact: IPublisherContact;
  logo?: string;
  description?: string;
  category: string;
  settings: IPublisherSettings;
  verified: boolean;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  verificationNotes?: string;
  verifiedAt?: Date;
  verifiedBy?: string;
  apiKey?: string;
  sspConfig?: {
    enabled: boolean;
    bidders: string[];
    timeout: number;
    floorPriceAlgorithm: 'static' | 'dynamic' | 'auction';
  };
  stats: {
    totalImpressions: number;
    totalRevenue: number;
    fillRate: number;
    avgEcpm: number;
    activePlacements: number;
  };
  status: 'active' | 'suspended' | 'inactive';
  suspendedAt?: Date;
  suspensionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PublisherSettingsSchema = new Schema<IPublisherSettings>({
  defaultFloorPrice: { type: Number, default: 0.5 },
  currency: { type: String, default: 'USD' },
  timezone: { type: String, default: 'UTC' },
  revenueShare: { type: Number, default: 70, min: 0, max: 100 },
  paymentTerms: {
    type: String,
    enum: ['NET15', 'NET30', 'NET45', 'NET60'],
    default: 'NET30'
  },
  autoPay: { type: Boolean, default: true },
  headerBiddingEnabled: { type: Boolean, default: true },
  dealPriority: {
    type: String,
    enum: ['CPM', 'CPC', 'CPA', 'Hybrid'],
    default: 'CPM'
  },
  allowedAdTypes: [{ type: String }],
  blockedAdvertisers: [{ type: String }],
  blockedCategories: [{ type: String }],
  brandSafety: {
    enabled: { type: Boolean, default: true },
    level: {
      type: String,
      enum: ['Strict', 'Moderate', 'Relaxed'],
      default: 'Moderate'
    },
    customFilters: [{ type: String }]
  },
  pacing: {
    enabled: { type: Boolean, default: false },
    dailyLimit: { type: Number, default: 0 },
    monthlyLimit: { type: Number, default: 0 }
  }
}, { _id: false });

const PublisherSchema = new Schema<IPublisher>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  domains: [{ type: String, required: true }],
  contact: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    title: String
  },
  logo: String,
  description: String,
  category: { type: String, required: true },
  settings: { type: PublisherSettingsSchema, default: () => ({}) },
  verified: { type: Boolean, default: false },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  verificationNotes: String,
  verifiedAt: Date,
  verifiedBy: String,
  apiKey: String,
  sspConfig: {
    enabled: { type: Boolean, default: true },
    bidders: [{ type: String }],
    timeout: { type: Number, default: 200 },
    floorPriceAlgorithm: {
      type: String,
      enum: ['static', 'dynamic', 'auction'],
      default: 'dynamic'
    }
  },
  stats: {
    totalImpressions: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    fillRate: { type: Number, default: 0 },
    avgEcpm: { type: Number, default: 0 },
    activePlacements: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'inactive'],
    default: 'active'
  },
  suspendedAt: Date,
  suspensionReason: String
}, {
  timestamps: true
});

// Indexes
PublisherSchema.index({ slug: 1 });
PublisherSchema.index({ domains: 1 });
PublisherSchema.index({ status: 1, verified: 1 });
PublisherSchema.index({ 'contact.email': 1 });
PublisherSchema.index({ category: 1 });
PublisherSchema.index({ createdAt: -1 });

// Virtual for full URL
PublisherSchema.virtual('dashboardUrl').get(function() {
  return `https://publishers.adbazaar.io/${this.slug}`;
});

export const Publisher = mongoose.model<IPublisher>('Publisher', PublisherSchema);
