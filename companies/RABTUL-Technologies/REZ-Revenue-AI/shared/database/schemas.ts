/**
 * REZ Revenue AI - Database Schemas
 * MongoDB schemas for persistence
 */

import mongoose, { Schema, Document } from 'mongoose';

// ============================================================
// MERCHANT CONFIG
// ============================================================

export interface IMerchantConfig extends Document {
  merchantId: string;
  vertical: 'restaurant' | 'hotel' | 'salon' | 'gym' | 'clinic' | 'retail' | 'ride';
  businessName: string;
  config: {
    dynamicPricingEnabled: boolean;
    autoCashbackEnabled: boolean;
    autoNotificationsEnabled: boolean;
    surgeMultiplierMax: number;
    discountMax: number;
    peakHours: number[];
    happyHourStart?: number;
    happyHourEnd?: number;
  };
  rbacEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MerchantConfigSchema = new Schema<IMerchantConfig>({
  merchantId: { type: String, required: true, unique: true, index: true },
  vertical: { type: String, required: true, enum: ['restaurant', 'hotel', 'salon', 'gym', 'clinic', 'retail', 'ride'] },
  businessName: { type: String, required: true },
  config: {
    dynamicPricingEnabled: { type: Boolean, default: true },
    autoCashbackEnabled: { type: Boolean, default: true },
    autoNotificationsEnabled: { type: Boolean, default: true },
    surgeMultiplierMax: { type: Number, default: 2.0, min: 1.0, max: 3.0 },
    discountMax: { type: Number, default: 0.5, min: 0, max: 1 },
    peakHours: { type: [Number], default: [12, 13, 19, 20, 21] },
    happyHourStart: { type: Number },
    happyHourEnd: { type: Number },
  },
  rbacEnabled: { type: Boolean, default: true },
}, { timestamps: true });

MerchantConfigSchema.index({ vertical: 1 });
MerchantConfigSchema.index({ 'config.dynamicPricingEnabled': 1 });

// ============================================================
// PRICING HISTORY
// ============================================================

export interface IPricingHistory extends Document {
  merchantId: string;
  entityId: string;
  entityType: 'product' | 'service' | 'room' | 'appointment';
  entityName: string;
  category: string;
  originalPrice: number;
  finalPrice: number;
  adjustment: number;
  adjustmentType: 'surge' | 'discount' | 'loyalty' | 'bundle' | 'time_based' | 'none';
  factors: Array<{
    name: string;
    reason: string;
    contribution: number;
  }>;
  context: {
    dayOfWeek: number;
    hourOfDay: number;
    isPeakHour: boolean;
    isWeekend: boolean;
    slotsRemaining?: number;
    totalSlots?: number;
    customerSegment?: string;
  };
  customerId?: string;
  orderId?: string;
  sessionId?: string;
  createdAt: Date;
}

const PricingHistorySchema = new Schema<IPricingHistory>({
  merchantId: { type: String, required: true, index: true },
  entityId: { type: String, required: true, index: true },
  entityType: { type: String, enum: ['product', 'service', 'room', 'appointment'] },
  entityName: { type: String, required: true },
  category: { type: String, required: true, index: true },
  originalPrice: { type: Number, required: true },
  finalPrice: { type: Number, required: true },
  adjustment: { type: Number, required: true },
  adjustmentType: { type: String, enum: ['surge', 'discount', 'loyalty', 'bundle', 'time_based', 'none'] },
  factors: [{
    name: String,
    reason: String,
    contribution: Number,
  }],
  context: {
    dayOfWeek: Number,
    hourOfDay: Number,
    isPeakHour: Boolean,
    isWeekend: Boolean,
    slotsRemaining: Number,
    totalSlots: Number,
    customerSegment: String,
  },
  customerId: { type: String, index: true },
  orderId: { type: String, index: true },
  sessionId: String,
}, { timestamps: true });

PricingHistorySchema.index({ merchantId: 1, createdAt: -1 });
PricingHistorySchema.index({ entityId: 1, createdAt: -1 });
PricingHistorySchema.index({ adjustmentType: 1, createdAt: -1 });

// ============================================================
// BENCHMARK SCORES
// ============================================================

export interface IBenchmarkScore extends Document {
  merchantId: string;
  vertical: string;
  overallScore: number;
  percentile: string;
  letterGrade: string;
  breakdown: Array<{
    metric: string;
    score: number;
    categoryRank: string;
    trend: 'increasing' | 'stable' | 'decreasing';
    benchmark: number;
    gap: number;
  }>;
  period: 'day' | 'week' | 'month';
  calculatedAt: Date;
  createdAt: Date;
}

const BenchmarkScoreSchema = new Schema<IBenchmarkScore>({
  merchantId: { type: String, required: true, index: true },
  vertical: { type: String, required: true },
  overallScore: { type: Number, required: true, min: 0, max: 100 },
  percentile: { type: String, required: true },
  letterGrade: { type: String, required: true },
  breakdown: [{
    metric: String,
    score: Number,
    categoryRank: String,
    trend: { type: String, enum: ['increasing', 'stable', 'decreasing'] },
    benchmark: Number,
    gap: Number,
  }],
  period: { type: String, enum: ['day', 'week', 'month'], default: 'week' },
  calculatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

BenchmarkScoreSchema.index({ merchantId: 1, calculatedAt: -1 });
BenchmarkScoreSchema.index({ overallScore: -1 });

// ============================================================
// CAMPAIGNS
// ============================================================

export interface ICampaign extends Document {
  campaignId: string;
  merchantId: string;
  name: string;
  objective: 'acquisition' | 'retention' | 'reactivation';
  target: string;
  offer: {
    type: string;
    value: number;
    description?: string;
  };
  channels: string[];
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused';
  schedule: {
    startDate: Date;
    endDate?: Date;
  };
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    converted: number;
    revenue: number;
  };
  budget?: {
    total: number;
    spent: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>({
  campaignId: { type: String, required: true, unique: true, index: true },
  merchantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  objective: { type: String, enum: ['acquisition', 'retention', 'reactivation'], required: true },
  target: { type: String, required: true },
  offer: {
    type: { type: String, required: true },
    value: { type: Number, required: true },
    description: String,
  },
  channels: [{ type: String }],
  status: { type: String, enum: ['draft', 'scheduled', 'running', 'completed', 'paused'], default: 'draft' },
  schedule: {
    startDate: { type: Date, required: true },
    endDate: Date,
  },
  stats: {
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    converted: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
  },
  budget: {
    total: Number,
    spent: { type: Number, default: 0 },
  },
}, { timestamps: true });

CampaignSchema.index({ merchantId: 1, status: 1 });
CampaignSchema.index({ 'schedule.startDate': 1, 'schedule.endDate': 1 });

// ============================================================
// CUSTOMER SEGMENTS
// ============================================================

export interface ICustomerSegment extends Document {
  merchantId: string;
  segmentId: string;
  segment: {
    id: string;
    name: string;
    description: string;
    icon?: string;
    color?: string;
  };
  count: number;
  percentage: number;
  avgOrderValue: number;
  visitFrequency: number;
  churnRisk: number;
  lifetimeValue: number;
  characteristics: string[];
  pricingStrategy: {
    recommendedRate: number;
    discountTolerance: number;
    preferredOfferType: string;
    premiumTolerance: number;
  };
  preferredChannels: string[];
  calculatedAt: Date;
  createdAt: Date;
}

const CustomerSegmentSchema = new Schema<ICustomerSegment>({
  merchantId: { type: String, required: true, index: true },
  segmentId: { type: String, required: true },
  segment: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: String,
    icon: String,
    color: String,
  },
  count: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  avgOrderValue: { type: Number, default: 0 },
  visitFrequency: { type: Number, default: 0 },
  churnRisk: { type: Number, default: 0 },
  lifetimeValue: { type: Number, default: 0 },
  characteristics: [String],
  pricingStrategy: {
    recommendedRate: { type: Number, default: 0.05 },
    discountTolerance: { type: Number, default: 0.1 },
    preferredOfferType: { type: String, default: 'discount' },
    premiumTolerance: { type: Number, default: 0.05 },
  },
  preferredChannels: [String],
  calculatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

CustomerSegmentSchema.index({ merchantId: 1, 'segment.id': 1 });

// ============================================================
// REVENUE PLANS
// ============================================================

export interface IRevenuePlan extends Document {
  merchantId: string;
  planId: string;
  goal: {
    type: 'revenue' | 'customers' | 'orders' | 'retention';
    target: number;
    timeframe: 'week' | 'month' | 'quarter';
    current: number;
    gap: number;
  };
  recommendations: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    expectedImpact: number;
    confidence: number;
    priority: 'quick_win' | 'medium' | 'strategic';
    status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  }>;
  totalExpectedUplift: number;
  actualUplift?: number;
  status: 'active' | 'completed' | 'archived';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RevenuePlanSchema = new Schema<IRevenuePlan>({
  merchantId: { type: String, required: true, index: true },
  planId: { type: String, required: true, unique: true },
  goal: {
    type: { type: String, enum: ['revenue', 'customers', 'orders', 'retention'], required: true },
    target: { type: Number, required: true },
    timeframe: { type: String, enum: ['week', 'month', 'quarter'], required: true },
    current: { type: Number, required: true },
    gap: { type: Number, required: true },
  },
  recommendations: [{
    id: String,
    type: String,
    title: String,
    description: String,
    expectedImpact: Number,
    confidence: Number,
    priority: { type: String, enum: ['quick_win', 'medium', 'strategic'] },
    status: { type: String, enum: ['pending', 'in_progress', 'completed', 'skipped'], default: 'pending' },
  }],
  totalExpectedUplift: { type: Number, required: true },
  actualUplift: Number,
  status: { type: String, enum: ['active', 'completed', 'archived'], default: 'active' },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

RevenuePlanSchema.index({ merchantId: 1, status: 1 });
RevenuePlanSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ============================================================
// CASHBACK TRANSACTIONS
// ============================================================

export interface ICashbackTransaction extends Document {
  transactionId: string;
  merchantId: string;
  userId: string;
  orderId?: string;
  amount: number;
  rate: number;
  reason: string;
  status: 'pending' | 'completed' | 'failed';
  source: 'pricing' | 'campaign' | 'loyalty' | 'manual';
  notificationSent: boolean;
  notificationChannels: string[];
  createdAt: Date;
  completedAt?: Date;
}

const CashbackTransactionSchema = new Schema<ICashbackTransaction>({
  transactionId: { type: String, required: true, unique: true, index: true },
  merchantId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  orderId: { type: String, index: true },
  amount: { type: Number, required: true },
  rate: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  source: { type: String, enum: ['pricing', 'campaign', 'loyalty', 'manual'], required: true },
  notificationSent: { type: Boolean, default: false },
  notificationChannels: [String],
  completedAt: Date,
}, { timestamps: true });

CashbackTransactionSchema.index({ merchantId: 1, createdAt: -1 });
CashbackTransactionSchema.index({ userId: 1, createdAt: -1 });

// ============================================================
// EXPORTS
// ============================================================

export const MerchantConfig = mongoose.model<IMerchantConfig>('MerchantConfig', MerchantConfigSchema);
export const PricingHistory = mongoose.model<IPricingHistory>('PricingHistory', PricingHistorySchema);
export const BenchmarkScore = mongoose.model<IBenchmarkScore>('BenchmarkScore', BenchmarkScoreSchema);
export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);
export const CustomerSegment = mongoose.model<ICustomerSegment>('CustomerSegment', CustomerSegmentSchema);
export const RevenuePlan = mongoose.model<IRevenuePlan>('RevenuePlanSchema', RevenuePlanSchema);
export const CashbackTransaction = mongoose.model<ICashbackTransaction>('CashbackTransaction', CashbackTransactionSchema);

// ============================================================
// DATABASE CONNECTION
// ============================================================

export async function connectDatabase(uri?: string): Promise<typeof mongoose> {
  const mongodbUri = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-revenue-ai';

  try {
    await mongoose.connect(mongodbUri);
    console.log('✅ MongoDB connected:', mongodbUri);
    return mongoose;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  console.log('MongoDB disconnected');
}

export default {
  connectDatabase,
  disconnectDatabase,
  MerchantConfig,
  PricingHistory,
  BenchmarkScore,
  Campaign,
  CustomerSegment,
  RevenuePlan,
  CashbackTransaction,
};
