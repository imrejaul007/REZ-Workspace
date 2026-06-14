import mongoose, { Schema, Document } from 'mongoose';

// Yield Decision Log
export interface IYieldDecision extends Document {
  decisionId: string;
  inventorySlotId: string;
  inventoryType: string;
  userContext: {
    segments: string[];
    intentScore: number;
    deviceType?: string;
  };
  selectedAdId: string;
  advertiserId: string;
  bid: number;
  floorPrice: number;
  expectedRevenue: number;
  expectedCTR: number;
  expectedCVR: number;
  confidence: number;
  decisionReason: string;
  optimizationGoal: string;
  processingTimeMs: number;
  timestamp: Date;
}

const YieldDecisionSchema = new Schema<IYieldDecision>({
  decisionId: { type: String, required: true, unique: true, index: true },
  inventorySlotId: { type: String, required: true, index: true },
  inventoryType: { type: String, required: true, index: true },
  userContext: {
    segments: [{ type: String }],
    intentScore: { type: Number },
    deviceType: { type: String },
  },
  selectedAdId: { type: String, required: true },
  advertiserId: { type: String, required: true, index: true },
  bid: { type: Number, required: true },
  floorPrice: { type: Number, required: true },
  expectedRevenue: { type: Number, required: true },
  expectedCTR: { type: Number },
  expectedCVR: { type: Number },
  confidence: { type: Number },
  decisionReason: { type: String },
  optimizationGoal: { type: String, default: 'revenue' },
  processingTimeMs: { type: Number },
  timestamp: { type: Date, default: Date.now, index: true },
});

YieldDecisionSchema.index({ timestamp: -1, inventoryType: 1 });
YieldDecisionSchema.index({ advertiserId: 1, timestamp: -1 });
YieldDecisionSchema.index({ inventorySlotId: 1, timestamp: -1 });

// Floor Price History
export interface IFloorPrice extends Document {
  inventoryId: string;
  inventoryType: string;
  context: string;
  floorPrice: number;
  dynamic: boolean;
  factors: {
    name: string;
    impact: number;
    weight: number;
  }[];
  eligibleBidders: number;
  timestamp: Date;
}

const FloorPriceSchema = new Schema<IFloorPrice>({
  inventoryId: { type: String, required: true, index: true },
  inventoryType: { type: String, required: true },
  context: { type: String, default: 'default' },
  floorPrice: { type: Number, required: true },
  dynamic: { type: Boolean, default: true },
  factors: [{
    name: String,
    impact: Number,
    weight: Number,
  }],
  eligibleBidders: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now, index: true },
});

FloorPriceSchema.index({ inventoryId: 1, timestamp: -1 });
FloorPriceSchema.index({ inventoryType: 1, timestamp: -1 });

// Bid Landscape Data
export interface IBidLandscape extends Document {
  inventoryType: string;
  context: string;
  timeRange: string;
  distribution: {
    bid: number;
    count: number;
    percentage: number;
    cumulativePercentage: number;
  }[];
  statistics: {
    min: number;
    max: number;
    median: number;
    mean: number;
    p25: number;
    p75: number;
    p90: number;
    p95: number;
  };
  timestamp: Date;
}

const BidLandscapeSchema = new Schema<IBidLandscape>({
  inventoryType: { type: String, required: true, index: true },
  context: { type: String, default: 'all' },
  timeRange: { type: String, required: true },
  distribution: [{
    bid: Number,
    count: Number,
    percentage: Number,
    cumulativePercentage: Number,
  }],
  statistics: {
    min: Number,
    max: Number,
    median: Number,
    mean: Number,
    p25: Number,
    p75: Number,
    p90: Number,
    p95: Number,
  },
  timestamp: { type: Date, default: Date.now, index: true },
});

BidLandscapeSchema.index({ inventoryType: 1, timeRange: 1, timestamp: -1 });

// Revenue Attribution
export interface IRevenueAttribution extends Document {
  dimension: 'ad' | 'advertiser' | 'placement' | 'format' | 'segment';
  dimensionValue: string;
  impressions: number;
  revenue: number;
  rpm: number;
  ctr: number;
  conversions: number;
  conversionRate: number;
  ltv: number;
  periodStart: Date;
  periodEnd: Date;
  timestamp: Date;
}

const RevenueAttributionSchema = new Schema<IRevenueAttribution>({
  dimension: { type: String, required: true, index: true },
  dimensionValue: { type: String, required: true, index: true },
  impressions: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  rpm: { type: Number, default: 0 },
  ctr: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 },
  ltv: { type: Number, default: 0 },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  timestamp: { type: Date, default: Date.now },
});

RevenueAttributionSchema.index({ dimension: 1, dimensionValue: 1, periodStart: -1 });
RevenueAttributionSchema.index({ periodStart: -1, periodEnd: 1 });

// Yield Prediction
export interface IYieldPrediction extends Document {
  inventoryType: string;
  context: string;
  horizon: '1h' | '6h' | '24h' | '7d';
  predictedYield: number;
  confidence: number;
  factors: {
    name: string;
    contribution: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }[];
  riskFactors: {
    factor: string;
    probability: number;
    impact: 'high' | 'medium' | 'low';
  }[];
  timestamp: Date;
}

const YieldPredictionSchema = new Schema<IYieldPrediction>({
  inventoryType: { type: String, required: true, index: true },
  context: { type: String, default: 'all' },
  horizon: { type: String, required: true, index: true },
  predictedYield: { type: Number, required: true },
  confidence: { type: Number },
  factors: [{
    name: String,
    contribution: Number,
    trend: String,
  }],
  riskFactors: [{
    factor: String,
    probability: Number,
    impact: String,
  }],
  timestamp: { type: Date, default: Date.now, index: true },
});

YieldPredictionSchema.index({ inventoryType: 1, horizon: 1, timestamp: -1 });

// A/B Test Strategies
export interface IYieldStrategy extends Document {
  strategyId: string;
  name: string;
  type: 'floor_price' | 'bid_allocation' | 'audience_targeting' | 'format_optimization';
  config: Record<string, unknown>;
  weights: {
    revenue: number;
    conversions: number;
    ltv: number;
    ctr: number;
    brandSafety: number;
  };
  status: 'active' | 'paused' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const YieldStrategySchema = new Schema<IYieldStrategy>({
  strategyId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  config: { type: Schema.Types.Mixed, default: {} },
  weights: {
    revenue: { type: Number, default: 0.4 },
    conversions: { type: Number, default: 0.3 },
    ltv: { type: Number, default: 0.2 },
    ctr: { type: Number, default: 0.05 },
    brandSafety: { type: Number, default: 0.05 },
  },
  status: { type: String, default: 'active', enum: ['active', 'paused', 'archived'] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// A/B Test Results
export interface IABTest extends Document {
  testId: string;
  name: string;
  description: string;
  strategies: string[];
  trafficAllocation: number[];
  duration: number;
  successMetrics: string[];
  status: 'running' | 'completed' | 'paused';
  startDate: Date;
  endDate?: Date;
  results: {
    strategyId: string;
    impressions: number;
    revenue: number;
    rpm: number;
    ctr: number;
    conversions: number;
    cvr: number;
    confidence: number;
    winner: boolean;
  }[];
  recommendations: string[];
  statisticalSignificance: number;
  createdAt: Date;
  updatedAt: Date;
}

const ABTestSchema = new Schema<IABTest>({
  testId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  strategies: [{ type: String }],
  trafficAllocation: [{ type: Number }],
  duration: { type: Number, required: true },
  successMetrics: [{ type: String }],
  status: { type: String, default: 'running', enum: ['running', 'completed', 'paused'] },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  results: [{
    strategyId: String,
    impressions: Number,
    revenue: Number,
    rpm: Number,
    ctr: Number,
    conversions: Number,
    cvr: Number,
    confidence: Number,
    winner: Boolean,
  }],
  recommendations: [{ type: String }],
  statisticalSignificance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ABTestSchema.index({ status: 1, startDate: -1 });

// Inventory Performance Cache
export interface IInventoryPerformance extends Document {
  inventoryId: string;
  inventoryType: string;
  context: string;
  metrics: {
    impressions: number;
    revenue: number;
    rpm: number;
    ctr: number;
    fillRate: number;
    avgBid: number;
    floorPrice: number;
  };
  windowStart: Date;
  windowEnd: Date;
  timestamp: Date;
}

const InventoryPerformanceSchema = new Schema<IInventoryPerformance>({
  inventoryId: { type: String, required: true, index: true },
  inventoryType: { type: String, required: true },
  context: { type: String, default: 'all' },
  metrics: {
    impressions: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    rpm: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 },
    fillRate: { type: Number, default: 0 },
    avgBid: { type: Number, default: 0 },
    floorPrice: { type: Number, default: 0 },
  },
  windowStart: { type: Date, required: true },
  windowEnd: { type: Date, required: true },
  timestamp: { type: Date, default: Date.now },
});

InventoryPerformanceSchema.index({ inventoryId: 1, windowStart: -1 });

// Export models
export const YieldDecision = mongoose.model<IYieldDecision>('YieldDecision', YieldDecisionSchema);
export const FloorPrice = mongoose.model<IFloorPrice>('FloorPrice', FloorPriceSchema);
export const BidLandscape = mongoose.model<IBidLandscape>('BidLandscape', BidLandscapeSchema);
export const RevenueAttribution = mongoose.model<IRevenueAttribution>('RevenueAttribution', RevenueAttributionSchema);
export const YieldPrediction = mongoose.model<IYieldPrediction>('YieldPredictionSchema', YieldPredictionSchema);
export const YieldStrategy = mongoose.model<IYieldStrategy>('YieldStrategy', YieldStrategySchema);
export const ABTest = mongoose.model<IABTest>('ABTest', ABTestSchema);
export const InventoryPerformance = mongoose.model<IInventoryPerformance>('InventoryPerformance', InventoryPerformanceSchema);