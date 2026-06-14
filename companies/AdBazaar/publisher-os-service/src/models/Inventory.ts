import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryTargeting {
  geo?: {
    countries: string[];
    regions: string[];
    cities: string[];
    postalCodes: string[];
  };
  device?: {
    types: ('desktop' | 'mobile' | 'tablet' | 'CTV')[];
    os: string[];
    browsers: string[];
  };
  dayparting?: {
    days: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[];
    hours: number[];
  };
  audience?: {
    segments: string[];
    excludes: string[];
  };
  content?: {
    categories: string[];
    keywords: string[];
    excludes: string[];
  };
}

export interface IInventoryDimensions {
  width: number;
  height: number;
  size: string;
}

export interface IInventory extends Document {
  _id: mongoose.Types.ObjectId;
  publisherId: mongoose.Types.ObjectId;
  placementId?: mongoose.Types.ObjectId;
  name: string;
  code: string;
  type: 'banner' | 'video' | 'native' | 'interstitial' | 'rewarded' | 'CTV';
  adTypes: string[];
  dimensions: IInventoryDimensions;
  position: 'header' | 'sidebar' | 'in-article' | 'footer' | 'overlay' | 'pre-roll' | 'mid-roll' | 'post-roll';
  environment: 'web' | 'mobile-web' | 'app' | 'CTV';
  targeting: IInventoryTargeting;
  floorPrice: number;
  reservePrice?: number;
  maxBid?: number;
  currency: string;
  enabled: boolean;
  pausedAt?: Date;
  tags: string[];
  metadata?: Record<string, unknown>;
  stats: {
    totalRequests: number;
    totalImpressions: number;
    totalRevenue: number;
    fillRate: number;
    avgEcpm: number;
    bidRate: number;
  };
  lastPing?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryDimensionsSchema = new Schema<IInventoryDimensions>({
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  size: { type: String, required: true }
}, { _id: false });

const InventoryTargetingSchema = new Schema<IInventoryTargeting>({
  geo: {
    countries: [{ type: String }],
    regions: [{ type: String }],
    cities: [{ type: String }],
    postalCodes: [{ type: String }]
  },
  device: {
    types: [{
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'CTV']
    }],
    os: [{ type: String }],
    browsers: [{ type: String }]
  },
  dayparting: {
    days: [{
      type: String,
      enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    }],
    hours: [{ type: Number }]
  },
  audience: {
    segments: [{ type: String }],
    excludes: [{ type: String }]
  },
  content: {
    categories: [{ type: String }],
    keywords: [{ type: String }],
    excludes: [{ type: String }]
  }
}, { _id: false });

const InventorySchema = new Schema<IInventory>({
  publisherId: { type: Schema.Types.ObjectId, ref: 'Publisher', required: true },
  placementId: { type: Schema.Types.ObjectId, ref: 'Placement' },
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true },
  type: {
    type: String,
    enum: ['banner', 'video', 'native', 'interstitial', 'rewarded', 'CTV'],
    required: true
  },
  adTypes: [{ type: String, required: true }],
  dimensions: { type: InventoryDimensionsSchema, required: true },
  position: {
    type: String,
    enum: ['header', 'sidebar', 'in-article', 'footer', 'overlay', 'pre-roll', 'mid-roll', 'post-roll'],
    required: true
  },
  environment: {
    type: String,
    enum: ['web', 'mobile-web', 'app', 'CTV'],
    default: 'web'
  },
  targeting: { type: InventoryTargetingSchema, default: () => ({}) },
  floorPrice: { type: Number, required: true, default: 0.5 },
  reservePrice: Number,
  maxBid: Number,
  currency: { type: String, default: 'USD' },
  enabled: { type: Boolean, default: true },
  pausedAt: Date,
  tags: [{ type: String }],
  metadata: { type: Schema.Types.Mixed },
  stats: {
    totalRequests: { type: Number, default: 0 },
    totalImpressions: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    fillRate: { type: Number, default: 0 },
    avgEcpm: { type: Number, default: 0 },
    bidRate: { type: Number, default: 0 }
  },
  lastPing: Date
}, {
  timestamps: true
});

// Indexes
InventorySchema.index({ publisherId: 1, code: 1 }, { unique: true });
InventorySchema.index({ publisherId: 1, type: 1 });
InventorySchema.index({ enabled: 1, type: 1 });
InventorySchema.index({ 'targeting.geo.countries': 1 });
InventorySchema.index({ 'targeting.device.types': 1 });
InventorySchema.index({ tags: 1 });
InventorySchema.index({ 'stats.totalImpressions': -1 });
InventorySchema.index({ lastPing: -1 });

export const Inventory = mongoose.model<IInventory>('Inventory', InventorySchema);
