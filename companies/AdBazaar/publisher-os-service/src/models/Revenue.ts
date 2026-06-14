import mongoose, { Schema, Document } from 'mongoose';

export interface IRevenue extends Document {
  _id: mongoose.Types.ObjectId;
  publisherId: mongoose.Types.ObjectId;
  inventoryId?: mongoose.Types.ObjectId;
  placementId?: mongoose.Types.ObjectId;
  date: Date;
  dateStr: string; // YYYY-MM-DD format for aggregation
  hour?: number;
  impressions: number;
  bids: number;
  wins: number;
  revenue: number;
  cost: number;
  ecpm: number;
  cpm: number;
  cpc: number;
  cpa: number;
  currency: string;
  adType: string;
  dealType?: 'open' | 'preferred' | 'private' | 'programmatic';
  country?: string;
  device?: 'desktop' | 'mobile' | 'tablet' | 'CTV';
  viewableImpressions: number;
  viewability: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
  createdAt: Date;
  updatedAt: Date;
}

const RevenueSchema = new Schema<IRevenue>({
  publisherId: { type: Schema.Types.ObjectId, ref: 'Publisher', required: true },
  inventoryId: { type: Schema.Types.ObjectId, ref: 'Inventory' },
  placementId: { type: Schema.Types.ObjectId, ref: 'Placement' },
  date: { type: Date, required: true },
  dateStr: { type: String, required: true },
  hour: { type: Number, min: 0, max: 23 },
  impressions: { type: Number, default: 0 },
  bids: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  cost: { type: Number, default: 0 },
  ecpm: { type: Number, default: 0 },
  cpm: { type: Number, default: 0 },
  cpc: { type: Number, default: 0 },
  cpa: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  adType: { type: String, required: true },
  dealType: {
    type: String,
    enum: ['open', 'preferred', 'private', 'programmatic']
  },
  country: String,
  device: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'CTV']
  },
  viewableImpressions: { type: Number, default: 0 },
  viewability: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },
  ctr: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Compound indexes for efficient aggregation
RevenueSchema.index({ publisherId: 1, dateStr: 1 }, { unique: true });
RevenueSchema.index({ publisherId: 1, dateStr: 1, hour: 1 });
RevenueSchema.index({ publisherId: 1, dateStr: 1, adType: 1 });
RevenueSchema.index({ publisherId: 1, dateStr: 1, country: 1 });
RevenueSchema.index({ publisherId: 1, dateStr: 1, device: 1 });
RevenueSchema.index({ publisherId: 1, dateStr: 1, dealType: 1 });
RevenueSchema.index({ inventoryId: 1, dateStr: 1 });
RevenueSchema.index({ placementId: 1, dateStr: 1 });
RevenueSchema.index({ dateStr: -1 });
RevenueSchema.index({ date: -1 });

// TTL index to auto-delete old data (optional, configurable)
RevenueSchema.index({ date: 1 }, { expireAfterSeconds: 31536000 }); // 1 year retention

export const Revenue = mongoose.model<IRevenue>('Revenue', RevenueSchema);
