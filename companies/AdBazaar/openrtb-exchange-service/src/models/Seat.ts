import mongoose, { Document, Schema } from 'mongoose';

export type SeatStatus = 'active' | 'inactive' | 'suspended' | 'pending';
export type SeatType = 'buyer' | 'seller' | 'both';

export interface ISeat extends Document {
  seatId: string;
  name: string;
  type: SeatType;
  status: SeatStatus;
  // Contact information
  email?: string;
  phone?: string;
  company?: string;
  // Billing/Payment
  billingContact?: BillingContact;
  // Permissions
  permissions: SeatPermissions;
  // Rate limits
  rateLimits: RateLimits;
  // Exchange settings
  defaultBidValidation: boolean;
  bidValidationRules?: BidValidationRules;
  // Metadata
  buyerExternalId?: string;
  sellerExternalId?: string;
  // SSO/Auth
  ssoEnabled: boolean;
  ssoProvider?: string;
  // Statistics
  totalBids: number;
  totalSpend: number;
  averageCpm: number;
  winRate: number;
  // Timestamps
  lastActivityAt?: Date;
  approvedAt?: Date;
  approvedBy?: string;
  suspendedAt?: Date;
  suspendedBy?: string;
  suspensionReason?: string;
  // Extensibility
  ext?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingContact {
  name: string;
  email: string;
  phone?: string;
  address?: BillingAddress;
}

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface SeatPermissions {
  // Bidding permissions
  canBid: boolean;
  maxBidPerRequest: number;
  maxTotalDailySpend: number;
  // Deal permissions
  canCreateDeals: boolean;
  canJoinDeals: boolean;
  dealTypes: string[];
  // Inventory access
  canAccessInventory: boolean;
  allowedSiteIds?: string[];
  allowedAppIds?: string[];
  blockedSiteIds?: string[];
  blockedAppIds?: string[];
  // Analytics access
  canViewAnalytics: boolean;
  analyticsGranularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
  // Creative review
  requiresCreativeReview: boolean;
  autoApproveBelowCpm?: number;
  // Feature flags
  features: {
    realTimeBidding: boolean;
    programmaticDirect: boolean;
    preferredDeals: boolean;
    firstLook: boolean;
    dealManagement: boolean;
    privateMarketplace: boolean;
    audienceTargeting: boolean;
    viewabilityOptimization: boolean;
    brandSafetyTools: boolean;
  };
}

export interface RateLimits {
  requestsPerSecond: number;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  bidsPerSecond: number;
  bidsPerMinute: number;
}

export interface BidValidationRules {
  minBidFloorCpm: number;
  maxBidFloorCpm: number;
  allowedAdTypes: number[];
  blockedCategories: number[];
  brandSafetyLevel: 'strict' | 'moderate' | 'open';
  viewabilityThreshold: number;
  invalidTrafficThreshold: number;
}

const BillingAddressSchema = new Schema<BillingAddress>(
  {
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  { _id: false }
);

const BillingContactSchema = new Schema<BillingContact>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    address: BillingAddressSchema
  },
  { _id: false }
);

const SeatPermissionsSchema = new Schema<SeatPermissions>(
  {
    canBid: { type: Boolean, default: true },
    maxBidPerRequest: { type: Number, default: 10000 },
    maxTotalDailySpend: { type: Number, default: 100000 },
    canCreateDeals: { type: Boolean, default: false },
    canJoinDeals: { type: Boolean, default: true },
    dealTypes: [String],
    canAccessInventory: { type: Boolean, default: true },
    allowedSiteIds: [String],
    allowedAppIds: [String],
    blockedSiteIds: [String],
    blockedAppIds: [String],
    canViewAnalytics: { type: Boolean, default: true },
    analyticsGranularity: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'monthly'],
      default: 'daily'
    },
    requiresCreativeReview: { type: Boolean, default: false },
    autoApproveBelowCpm: Number,
    features: {
      type: Schema.Types.Mixed,
      default: () => ({
        realTimeBidding: true,
        programmaticDirect: true,
        preferredDeals: true,
        firstLook: false,
        dealManagement: true,
        privateMarketplace: true,
        audienceTargeting: true,
        viewabilityOptimization: false,
        brandSafetyTools: false
      })
    }
  },
  { _id: false }
);

const RateLimitsSchema = new Schema<RateLimits>(
  {
    requestsPerSecond: { type: Number, default: 100 },
    requestsPerMinute: { type: Number, default: 5000 },
    requestsPerHour: { type: Number, default: 100000 },
    requestsPerDay: { type: Number, default: 1000000 },
    bidsPerSecond: { type: Number, default: 50 },
    bidsPerMinute: { type: Number, default: 2000 }
  },
  { _id: false }
);

const BidValidationRulesSchema = new Schema<BidValidationRules>(
  {
    minBidFloorCpm: { type: Number, default: 0 },
    maxBidFloorCpm: { type: Number, default: 10000 },
    allowedAdTypes: [Number],
    blockedCategories: [Number],
    brandSafetyLevel: {
      type: String,
      enum: ['strict', 'moderate', 'open'],
      default: 'moderate'
    },
    viewabilityThreshold: { type: Number, default: 50 },
    invalidTrafficThreshold: { type: Number, default: 5 }
  },
  { _id: false }
);

const SeatSchema = new Schema<ISeat>(
  {
    seatId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['buyer', 'seller', 'both'],
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'pending'],
      default: 'pending',
      index: true
    },
    email: String,
    phone: String,
    company: String,
    billingContact: BillingContactSchema,
    permissions: { type: SeatPermissionsSchema, required: true },
    rateLimits: { type: RateLimitsSchema, required: true },
    defaultBidValidation: { type: Boolean, default: true },
    bidValidationRules: BidValidationRulesSchema,
    buyerExternalId: String,
    sellerExternalId: String,
    ssoEnabled: { type: Boolean, default: false },
    ssoProvider: String,
    totalBids: { type: Number, default: 0 },
    totalSpend: { type: Number, default: 0 },
    averageCpm: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
    lastActivityAt: Date,
    approvedAt: Date,
    approvedBy: String,
    suspendedAt: Date,
    suspendedBy: String,
    suspensionReason: String,
    ext: { type: Schema.Types.Mixed }
  },
  {
    timestamps: true,
    collection: 'seats'
  }
);

// Compound indexes
SeatSchema.index({ status: 1, type: 1 });
SeatSchema.index({ email: 1 }, { unique: true, sparse: true });
SeatSchema.index({ buyerExternalId: 1 });
SeatSchema.index({ sellerExternalId: 1 });
SeatSchema.index({ createdAt: -1 });

export const Seat = mongoose.model<ISeat>('Seat', SeatSchema);
export default Seat;