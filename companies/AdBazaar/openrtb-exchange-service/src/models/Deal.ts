import mongoose, { Document, Schema } from 'mongoose';

export type DealType = 'private_auction' | 'preferred_deal' | 'fixed_price' | 'open_auction';
export type DealStatus = 'active' | 'paused' | 'completed' | 'expired' | 'pending';

export interface IDeal extends Document {
  dealId: string;
  buyerId: string;
  sellerId: string;
  currency: string;
  type: DealType;
  status: DealStatus;
  // Pricing
  basePriceCpm: number;
  minimumPriceCpm?: number;
  maximumPriceCpm?: number;
  priceModel: 'cpm' | 'cpc' | 'cpa' | 'fixed';
  // Deal configuration
  impressionLimit?: number;
  clickLimit?: number;
  conversionLimit?: number;
  budgetLimit?: number;
  spentAmount?: number;
  // Targeting
  targeting?: DealTargeting;
  // Time bounds
  startTime?: Date;
  endTime?: Date;
  // Seat associations
  buyerSeatId?: string;
  sellerSeatId?: string;
  // Approval
  requiresApproval: boolean;
  approvedAt?: Date;
  approvedBy?: string;
  // Statistics
  impressionsServed: number;
  clicksCount: number;
  conversionsCount: number;
  averageCpm: number;
  totalRevenue: number;
  // Metadata
  name?: string;
  description?: string;
  externalDealId?: string;
  // Extensibility
  ext?: Record<string, unknown>;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface DealTargeting {
  // Site/App targeting
  siteIds?: string[];
  appIds?: string[];
  // Inventory targeting
  inventoryIds?: string[];
  excludedInventoryIds?: string[];
  // Geography
  countries?: string[];
  regions?: string[];
  cities?: string[];
  // Device targeting
  deviceTypes?: number[];
  osTypes?: string[];
  browsers?: string[];
  // Audience targeting
  audienceSegments?: string[];
  excludedSegments?: string[];
  // Content targeting
  categories?: string[];
  excludedCategories?: string[];
  // Viewability
  minViewability?: number;
  // Brand safety
  brandSafetyLevel?: 'strict' | 'moderate' | 'open';
  // Ext
  ext?: Record<string, unknown>;
}

const DealTargetingSchema = new Schema<DealTargeting>(
  {
    siteIds: [String],
    appIds: [String],
    inventoryIds: [String],
    excludedInventoryIds: [String],
    countries: [String],
    regions: [String],
    cities: [String],
    deviceTypes: [Number],
    osTypes: [String],
    browsers: [String],
    audienceSegments: [String],
    excludedSegments: [String],
    categories: [String],
    excludedCategories: [String],
    minViewability: Number,
    brandSafetyLevel: String,
    ext: { type: Schema.Types.Mixed }
  },
  { _id: false }
);

const DealSchema = new Schema<IDeal>(
  {
    dealId: { type: String, required: true, unique: true, index: true },
    buyerId: { type: String, required: true, index: true },
    sellerId: { type: String, required: true, index: true },
    currency: { type: String, default: 'USD' },
    type: {
      type: String,
      enum: ['private_auction', 'preferred_deal', 'fixed_price', 'open_auction'],
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'expired', 'pending'],
      default: 'pending',
      index: true
    },
    basePriceCpm: { type: Number, required: true },
    minimumPriceCpm: Number,
    maximumPriceCpm: Number,
    priceModel: { type: String, enum: ['cpm', 'cpc', 'cpa', 'fixed'], default: 'cpm' },
    impressionLimit: Number,
    clickLimit: Number,
    conversionLimit: Number,
    budgetLimit: Number,
    spentAmount: { type: Number, default: 0 },
    targeting: { type: DealTargetingSchema },
    startTime: Date,
    endTime: Date,
    buyerSeatId: { type: String, index: true },
    sellerSeatId: { type: String, index: true },
    requiresApproval: { type: Boolean, default: false },
    approvedAt: Date,
    approvedBy: String,
    impressionsServed: { type: Number, default: 0 },
    clicksCount: { type: Number, default: 0 },
    conversionsCount: { type: Number, default: 0 },
    averageCpm: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    name: String,
    description: String,
    externalDealId: String,
    ext: { type: Schema.Types.Mixed }
  },
  {
    timestamps: true,
    collection: 'deals'
  }
);

// Compound indexes for common queries
DealSchema.index({ buyerId: 1, status: 1 });
DealSchema.index({ sellerId: 1, status: 1 });
DealSchema.index({ buyerSeatId: 1, status: 1 });
DealSchema.index({ startTime: 1, endTime: 1 });
DealSchema.index({ status: 1, type: 1 });
DealSchema.index({ createdAt: -1 });

// TTL index for automatic deal expiration
DealSchema.index({ endTime: 1 }, { expireAfterSeconds: 0 });

export const Deal = mongoose.model<IDeal>('Deal', DealSchema);
export default Deal;