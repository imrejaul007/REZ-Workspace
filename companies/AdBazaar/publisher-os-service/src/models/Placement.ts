import mongoose, { Schema, Document } from 'mongoose';

export interface IPlacementSizes {
  width: number;
  height: number;
}

export interface IPlacement extends Document {
  _id: mongoose.Types.ObjectId;
  publisherId: mongoose.Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  status: 'active' | 'paused' | 'archived';
  sizes: IPlacementSizes[];
  primarySize: IPlacementSizes;
  adTypes: ('banner' | 'video' | 'native' | 'richmedia' | 'CTV')[];
  positions: ('header' | 'sidebar' | 'in-article' | 'footer' | 'overlay' | 'pre-roll' | 'mid-roll' | 'post-roll')[];
  environments: ('web' | 'mobile-web' | 'app' | 'CTV')[];
  floorPrice: number;
  currency: string;
  settings: {
    viewabilityTarget: number;
    brandSafetyLevel: 'Strict' | 'Moderate' | 'Relaxed';
    frequencyCapping: number;
    pacing: 'none' | 'even' | 'front' | 'back';
    dynamicAllocation: boolean;
    deals: {
      preferred: boolean;
      private: boolean;
      programmatic: boolean;
    };
  };
  targeting: {
    geo?: {
      countries?: string[];
      regions?: string[];
      cities?: string[];
    };
    device?: {
      types?: ('desktop' | 'mobile' | 'tablet' | 'CTV')[];
      os?: string[];
    };
    dayparting?: {
      days?: string[];
      hours?: number[];
    };
    audience?: {
      segments?: string[];
    };
    content?: {
      categories?: string[];
    };
  };
  stats: {
    totalImpressions: number;
    totalRevenue: number;
    avgEcpm: number;
    fillRate: number;
    viewability: number;
  };
  childInventories: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const PlacementSizesSchema = new Schema<IPlacementSizes>({
  width: { type: Number, required: true },
  height: { type: Number, required: true }
}, { _id: false });

const PlacementSchema = new Schema<IPlacement>({
  publisherId: { type: Schema.Types.ObjectId, ref: 'Publisher', required: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true },
  description: String,
  status: {
    type: String,
    enum: ['active', 'paused', 'archived'],
    default: 'active'
  },
  sizes: [{ type: PlacementSizesSchema, required: true }],
  primarySize: { type: PlacementSizesSchema, required: true },
  adTypes: [{
    type: String,
    enum: ['banner', 'video', 'native', 'richmedia', 'CTV']
  }],
  positions: [{
    type: String,
    enum: ['header', 'sidebar', 'in-article', 'footer', 'overlay', 'pre-roll', 'mid-roll', 'post-roll']
  }],
  environments: [{
    type: String,
    enum: ['web', 'mobile-web', 'app', 'CTV']
  }],
  floorPrice: { type: Number, required: true, default: 0.5 },
  currency: { type: String, default: 'USD' },
  settings: {
    viewabilityTarget: { type: Number, default: 70 },
    brandSafetyLevel: {
      type: String,
      enum: ['Strict', 'Moderate', 'Relaxed'],
      default: 'Moderate'
    },
    frequencyCapping: { type: Number, default: 0 },
    pacing: {
      type: String,
      enum: ['none', 'even', 'front', 'back'],
      default: 'none'
    },
    dynamicAllocation: { type: Boolean, default: true },
    deals: {
      preferred: { type: Boolean, default: true },
      private: { type: Boolean, default: true },
      programmatic: { type: Boolean, default: true }
    }
  },
  targeting: {
    geo: {
      countries: [{ type: String }],
      regions: [{ type: String }],
      cities: [{ type: String }]
    },
    device: {
      types: [{
        type: String,
        enum: ['desktop', 'mobile', 'tablet', 'CTV']
      }],
      os: [{ type: String }]
    },
    dayparting: {
      days: [{ type: String }],
      hours: [{ type: Number }]
    },
    audience: {
      segments: [{ type: String }]
    },
    content: {
      categories: [{ type: String }]
    }
  },
  stats: {
    totalImpressions: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    avgEcpm: { type: Number, default: 0 },
    fillRate: { type: Number, default: 0 },
    viewability: { type: Number, default: 0 }
  },
  childInventories: [{ type: Schema.Types.ObjectId, ref: 'Inventory' }]
}, {
  timestamps: true
});

// Indexes
PlacementSchema.index({ publisherId: 1, code: 1 }, { unique: true });
PlacementSchema.index({ publisherId: 1, status: 1 });
PlacementSchema.index({ adTypes: 1 });
PlacementSchema.index({ 'stats.totalRevenue': -1 });
PlacementSchema.index({ createdAt: -1 });

export const Placement = mongoose.model<IPlacement>('Placement', PlacementSchema);
