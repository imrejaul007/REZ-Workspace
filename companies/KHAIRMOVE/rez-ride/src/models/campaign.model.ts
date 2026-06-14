import mongoose, { Document, Schema } from 'mongoose';
import { BusinessRuleError } from '../common/exceptions';

// ===========================================
// CAMPAIGN TYPE ENUM
// ===========================================
export enum CampaignType {
  SERVICE_TO_RIDE = 'service_to_ride',
  SHOP_TO_RIDE = 'shop_to_ride',
  RIDE_TO_SERVICE = 'ride_to_service',
  BUNDLE = 'bundle',
}

// ===========================================
// CAMPAIGN STATUS ENUM
// ===========================================
export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ENDED = 'ended',
  EXPIRED = 'expired',
}

// ===========================================
// TRIGGER CONFIG
// ===========================================
export interface ITriggerConfig {
  // Event type
  action: 'service_completed' | 'order_placed' | 'booking_confirmed' | 'ride_completed';

  // Source (for Service → Ride)
  source?: 'restaurant' | 'retail' | 'salon' | 'hotel' | 'healthcare' | 'education';

  // Threshold
  minAmount?: number;
  maxAmount?: number;

  // Categories
  categories?: string[];

  // Merchant IDs
  merchantIds?: string[];

  // Product IDs
  productIds?: string[];
}

// ===========================================
// REWARD CONFIG
// ===========================================
export interface IRewardConfig {
  type: 'ride_discount' | 'free_ride' | 'ride_credit' | 'service_discount' | 'cashback';
  value: number;
  maxValue?: number;
  rideTypes?: ('auto' | 'cab' | 'suv')[];
  applicableServices?: string[];
  applicableMerchants?: string[];
  validityDays: number;
}

// ===========================================
// LIMITS CONFIG
// ===========================================
export interface ILimitsConfig {
  totalBudget: number;
  remainingBudget: number;
  redemptionLimit: number;
  redeemedCount: number;
  perUserLimit: number;
  dailyLimit?: number;
  dailyRedeemed?: Record<string, number>;
}

// ===========================================
// TARGETING CONFIG
// ===========================================
export interface ITargetingConfig {
  cities?: string[];
  userSegments?: ('new' | 'active' | 'high_value' | 'inactive')[];
  minRides?: number;
  minAge?: number;
  maxAge?: number;
  loyaltyTiers?: ('bronze' | 'silver' | 'gold' | 'platinum')[];
}

// ===========================================
// SCHEDULE CONFIG
// ===========================================
export interface IScheduleConfig {
  startDate: Date;
  endDate: Date;
  daysOfWeek?: number[];
  timeSlots?: { start: string; end: string }[];
}

// ===========================================
// ATTRIBUTION CONFIG
// ===========================================
export interface IAttributionConfig {
  merchantShare: number;
  platformShare: number;
  trackingEnabled: boolean;
}

// ===========================================
// CAMPAIGN STATICS INTERFACE
// ===========================================
export interface ICampaignStatics extends mongoose.Model<ICampaign> {
  findActiveByMerchant(merchantId: string): Promise<ICampaign[]>;
  findEligibleForEvent(event: { action: string; source?: string; merchantId?: string }): Promise<ICampaign[]>;
}

// ===========================================
// CAMPAIGN INTERFACE
// ===========================================
export interface ICampaign extends Document {
  // Methods
  activate(): void;
  pause(): void;
  end(): void;
  canIssueVoucher(userId?: string, amount?: number): { canIssue: boolean; reason?: string };
  decrementBudget(amount: number): void;
  incrementIssued(): void;
  incrementImpressions(): void;
  incrementEligible(): void;

  // Merchant
  merchantId: string;
  merchantName?: string;

  // Campaign type
  type: CampaignType;

  // Status
  status: CampaignStatus;

  // Names & Description
  name: string;
  description?: string;

  // Campaign Config
  trigger: ITriggerConfig;
  reward: IRewardConfig;
  limits: ILimitsConfig;
  targeting: ITargetingConfig;
  schedule: IScheduleConfig;
  attribution: IAttributionConfig;

  // Creative
  creative?: {
    title?: string;
    description?: string;
    imageUrl?: string;
    ctaText?: string;
  };

  // Stats
  stats: {
    impressions: number;
    eligible: number;
    issued: number;
    redeemed: number;
    conversionRate: number;
    totalValue: number;
    ctr: number;
  };

  // Metadata
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ===========================================
// CAMPAIGN SCHEMA
// ===========================================
const TriggerConfigSchema = new Schema({
  action: {
    type: String,
    enum: ['service_completed', 'order_placed', 'booking_confirmed', 'ride_completed'],
    required: true
  },
  source: String,
  minAmount: Number,
  maxAmount: Number,
  categories: [String],
  merchantIds: [String],
  productIds: [String],
}, { _id: false });

const RewardConfigSchema = new Schema({
  type: {
    type: String,
    enum: ['ride_discount', 'free_ride', 'ride_credit', 'service_discount', 'cashback'],
    required: true
  },
  value: { type: Number, required: true },
  maxValue: Number,
  rideTypes: [{ type: String, enum: ['auto', 'cab', 'suv'] }],
  applicableServices: [String],
  applicableMerchants: [String],
  validityDays: { type: Number, required: true, default: 7 },
}, { _id: false });

const LimitsConfigSchema = new Schema({
  totalBudget: { type: Number, required: true },
  remainingBudget: { type: Number, required: true },
  redemptionLimit: { type: Number, required: true },
  redeemedCount: { type: Number, default: 0 },
  perUserLimit: { type: Number, default: 1 },
  dailyLimit: Number,
  dailyRedeemed: { type: Map, of: Number, default: {} },
}, { _id: false });

const TargetingConfigSchema = new Schema({
  cities: [String],
  userSegments: [{
    type: String,
    enum: ['new', 'active', 'high_value', 'inactive']
  }],
  minRides: Number,
  minAge: Number,
  maxAge: Number,
  loyaltyTiers: [{
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum']
  }],
}, { _id: false });

const ScheduleConfigSchema = new Schema({
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  daysOfWeek: [Number],
  timeSlots: [{
    start: String,
    end: String,
  }],
}, { _id: false });

const AttributionConfigSchema = new Schema({
  merchantShare: { type: Number, default: 100 },
  platformShare: { type: Number, default: 0 },
  trackingEnabled: { type: Boolean, default: true },
}, { _id: false });

const CreativeSchema = new Schema({
  title: String,
  description: String,
  imageUrl: String,
  ctaText: String,
}, { _id: false });

const StatsSchema = new Schema({
  impressions: { type: Number, default: 0 },
  eligible: { type: Number, default: 0 },
  issued: { type: Number, default: 0 },
  redeemed: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 },
  totalValue: { type: Number, default: 0 },
  ctr: { type: Number, default: 0 },
}, { _id: false });

const CampaignSchema = new Schema<ICampaign>({
  merchantId: { type: String, required: true, index: true },
  merchantName: String,

  type: {
    type: String,
    enum: Object.values(CampaignType),
    required: true,
    index: true
  },

  status: {
    type: String,
    enum: Object.values(CampaignStatus),
    default: CampaignStatus.DRAFT,
    index: true
  },

  name: { type: String, required: true },
  description: String,

  trigger: { type: TriggerConfigSchema, required: true },
  reward: { type: RewardConfigSchema, required: true },
  limits: { type: LimitsConfigSchema, required: true },
  targeting: { type: TargetingConfigSchema, default: () => ({}) },
  schedule: { type: ScheduleConfigSchema, required: true },
  attribution: { type: AttributionConfigSchema, default: () => ({}) },

  creative: CreativeSchema,

  stats: { type: StatsSchema, default: () => ({}) },

  createdBy: { type: String, required: true },
  approvedBy: String,
  approvedAt: Date,
}, {
  timestamps: true,
});

// ===========================================
// INDEXES
// ===========================================
CampaignSchema.index({ merchantId: 1, status: 1 });
CampaignSchema.index({ type: 1, status: 1 });
CampaignSchema.index({ 'schedule.startDate': 1, 'schedule.endDate': 1 });
CampaignSchema.index({ status: 1, 'limits.remainingBudget': 1 });
CampaignSchema.index({ 'trigger.source': 1, 'trigger.action': 1 });

// ===========================================
// VIRTUALS
// ===========================================
CampaignSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === CampaignStatus.ACTIVE &&
         this.schedule.startDate <= now &&
         this.schedule.endDate >= now &&
         this.limits.remainingBudget > 0;
});

CampaignSchema.virtual('isExpired').get(function() {
  return this.schedule.endDate < new Date();
});

CampaignSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  if (this.schedule.endDate < now) return 0;
  return Math.ceil((this.schedule.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
});

CampaignSchema.virtual('budgetUtilization').get(function() {
  if (this.limits.totalBudget === 0) return 0;
  return ((this.limits.totalBudget - this.limits.remainingBudget) / this.limits.totalBudget) * 100;
});

// ===========================================
// METHODS
// ===========================================
CampaignSchema.methods.activate = function() {
  if (this.status !== CampaignStatus.DRAFT && this.status !== CampaignStatus.PAUSED) {
    throw new BusinessRuleError('Can only activate draft or paused campaigns', 'INVALID_CAMPAIGN_STATE');
  }
  this.status = CampaignStatus.ACTIVE;
};

CampaignSchema.methods.pause = function() {
  if (this.status !== CampaignStatus.ACTIVE) {
    throw new BusinessRuleError('Can only pause active campaigns', 'INVALID_CAMPAIGN_STATE');
  }
  this.status = CampaignStatus.PAUSED;
};

CampaignSchema.methods.end = function() {
  this.status = CampaignStatus.ENDED;
};

CampaignSchema.methods.canIssueVoucher = function(userId?: string, amount?: number): {
  canIssue: boolean;
  reason?: string;
} {
  // Check status
  if (this.status !== CampaignStatus.ACTIVE) {
    return { canIssue: false, reason: 'Campaign not active' };
  }

  // Check dates
  const now = new Date();
  if (now < this.schedule.startDate || now > this.schedule.endDate) {
    return { canIssue: false, reason: 'Campaign not within valid dates' };
  }

  // Check budget
  if (this.limits.remainingBudget < this.reward.value) {
    return { canIssue: false, reason: 'Insufficient budget' };
  }

  // Check redemption limit
  if (this.limits.redeemedCount >= this.limits.redemptionLimit) {
    return { canIssue: false, reason: 'Redemption limit reached' };
  }

  // Check daily limit
  if (this.limits.dailyLimit) {
    const today = now.toISOString().split('T')[0];
    const dailyCount = this.limits.dailyRedeemed?.get(today) || 0;
    if (dailyCount >= this.limits.dailyLimit) {
      return { canIssue: false, reason: 'Daily limit reached' };
    }
  }

  // Check amount threshold
  if (this.trigger.minAmount && amount && amount < this.trigger.minAmount) {
    return { canIssue: false, reason: `Minimum amount ₹${this.trigger.minAmount} required` };
  }

  if (this.trigger.maxAmount && amount && amount > this.trigger.maxAmount) {
    return { canIssue: false, reason: `Maximum amount ₹${this.trigger.maxAmount} exceeded` };
  }

  return { canIssue: true };
};

CampaignSchema.methods.decrementBudget = function(amount: number) {
  this.limits.remainingBudget -= amount;
  this.limits.redeemedCount += 1;

  // Update daily count
  const today = new Date().toISOString().split('T')[0];
  const currentDaily = this.limits.dailyRedeemed?.get(today) || 0;
  this.limits.dailyRedeemed?.set(today, currentDaily + 1);

  // Update stats
  this.stats.redeemed = this.limits.redeemedCount;
  this.stats.totalValue += amount;
  this.stats.conversionRate = this.stats.issued > 0
    ? (this.stats.redeemed / this.stats.issued) * 100
    : 0;
};

CampaignSchema.methods.incrementIssued = function() {
  this.stats.issued += 1;
};

CampaignSchema.methods.incrementImpressions = function() {
  this.stats.impressions += 1;
};

CampaignSchema.methods.incrementEligible = function() {
  this.stats.eligible += 1;
};

// ===========================================
// STATICS
// ===========================================
CampaignSchema.statics.findActiveByMerchant = function(merchantId: string) {
  return this.find({
    merchantId,
    status: CampaignStatus.ACTIVE,
  });
};

CampaignSchema.statics.findEligibleForEvent = async function(event: {
  action: string;
  source?: string;
  merchantId?: string;
}) {
  const now = new Date();

  return this.find({
    status: CampaignStatus.ACTIVE,
    'trigger.action': event.action,
    'schedule.startDate': { $lte: now },
    'schedule.endDate': { $gte: now },
    'limits.remainingBudget': { $gt: 0 },
    $or: [
      { 'trigger.merchantIds': { $exists: false } },
      { 'trigger.merchantIds': { $size: 0 } },
      { 'trigger.merchantIds': event.merchantId },
    ],
  });
};

export const Campaign = mongoose.model<ICampaign, ICampaignStatics>('Campaign', CampaignSchema);

// Type alias for TypeScript - use this for type annotations
export type Campaign = ICampaign;
