/**
 * COD Intelligence - Models
 * MongoDB schemas for COD/RTO data
 */

import mongoose, { Schema } from 'mongoose';

// ============================================
// COD ORDER - Historical data for training
// ============================================

const CODOrderSchema = new Schema({
  orderId: { type: String, required: true, unique: true, index: true },
  customerId: { type: String, required: true, index: true },
  customerPhone: { type: String, required: true, index: true },
  customerAddress: {
    pincode: { type: String, index: true },
    city: String,
    state: String,
    region: String,
  },

  // Order details
  amount: { type: Number, required: true },
  items: [{
    sku: String,
    name: String,
    quantity: Number,
    price: Number,
    category: String,
  }],
  category: String,
  paymentMethod: { type: String, enum: ['cod', 'prepaid', 'wallet'], default: 'cod' },

  // Merchant details
  merchantId: { type: String, required: true, index: true },
  storeId: String,

  // Logistics
  courier: String,
  deliveryAttempts: { type: Number, default: 1 },

  // Outcomes
  outcome: {
    type: String,
    enum: ['delivered', 'rto', 'refunded', 'partial_refund', 'disputed'],
    index: true
  },
  deliveredAt: Date,
  rtoAt: Date,
  refundAt: Date,

  // Timing
  orderDate: { type: Date, required: true, index: true },
  deliveryDate: Date,
  rtoDate: Date,

  // Days to deliver (for analysis)
  daysToDeliver: Number,
  daysToRTO: Number,
}, { timestamps: true });

CODOrderSchema.index({ merchantId: 1, outcome: 1 });
CODOrderSchema.index({ 'customerAddress.pincode': 1, outcome: 1 });
CODOrderSchema.index({ courier: 1, outcome: 1 });
CODOrderSchema.index({ orderDate: -1, outcome: 1 });

export const CODOrder = mongoose.models.CODOrder || mongoose.model('CODOrder', CODOrderSchema);

// ============================================
// CUSTOMER PROFILE - Aggregated customer behavior
// ============================================

const CustomerRTOSchema = new Schema({
  customerId: { type: String, required: true, unique: true },
  customerPhone: { type: String, required: true, index: true },

  // Lifetime stats
  totalOrders: { type: Number, default: 0 },
  codOrders: { type: Number, default: 0 },
  prepaidOrders: { type: Number, default: 0 },

  // Outcomes
  deliveredOrders: { type: Number, default: 0 },
  rtoOrders: { type: Number, default: 0 },
  refundedOrders: { type: Number, default: 0 },

  // Calculated rates
  rtoRate: { type: Number, default: 0 },
  refundRate: { type: Number, default: 0 },

  // Risk factors
  highValueCancellations: { type: Number, default: 0 },
  addressChanges: { type: Number, default: 0 },
  phoneChanges: { type: Number, default: 0 },

  // Recency
  lastOrderDate: Date,
  lastRTODate: Date,

  // Risk score (0-100)
  riskScore: { type: Number, default: 50, index: true },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'very_high'],
    default: 'medium',
    index: true
  },
}, { timestamps: true });

export const CustomerRTO = mongoose.models.CustomerRTO || mongoose.model('CustomerRTO', CustomerRTOSchema);

// ============================================
// PINCODE ANALYSIS - Regional RTO patterns
// ============================================

const PincodeRTOSchema = new Schema({
  pincode: { type: String, required: true, unique: true, index: true },
  city: String,
  state: String,
  region: String,

  // Stats
  totalOrders: { type: Number, default: 0 },
  deliveredOrders: { type: Number, default: 0 },
  rtoOrders: { type: Number, default: 0 },
  refundedOrders: { type: Number, default: 0 },

  // Rates
  rtoRate: { type: Number, default: 0 },
  refundRate: { type: Number, default: 0 },

  // By courier
  courierPerformance: [{
    courier: String,
    orders: Number,
    rtoRate: Number,
  }],

  // Timing
  avgDaysToDeliver: Number,

  // Risk
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'very_high'],
    default: 'medium',
    index: true
  },
}, { timestamps: true });

export const PincodeRTO = mongoose.models.PincodeRTO || mongoose.model('PincodeRTO', PincodeRTOSchema);

// ============================================
// MERCHANT PROFILE - Merchant RTO patterns
// ============================================

const MerchantRTOSchema = new Schema({
  merchantId: { type: String, required: true, unique: true, index: true },

  // Overall stats
  totalOrders: { type: Number, default: 0 },
  codOrders: { type: Number, default: 0 },

  // Outcomes
  deliveredOrders: { type: Number, default: 0 },
  rtoOrders: { type: Number, default: 0 },
  refundedOrders: { type: Number, default: 0 },

  // Rates
  rtoRate: { type: Number, default: 0 },
  refundRate: { type: Number, default: 0 },

  // Trends
  weeklyRTO: [{ week: Date, rate: Number }],
  monthlyRTO: [{ month: Date, rate: Number }],

  // Risk
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'very_high'],
    default: 'medium'
  },
}, { timestamps: true });

export const MerchantRTO = mongoose.models.MerchantRTO || mongoose.model('MerchantRTO', MerchantRTOSchema);

// ============================================
// FRAUD PATTERNS - Known fraud indicators
// ============================================

const FraudPatternSchema = new Schema({
  patternType: {
    type: String,
    enum: ['phone', 'address', 'behavior', 'device', 'order'],
    required: true
  },
  pattern: { type: String, required: true }, // The actual pattern (regex, value, etc.)
  description: String,

  // Severity
  severity: { type: Number, min: 1, max: 10, default: 5 },

  // Match count
  matchCount: { type: Number, default: 0 },
  confirmedFraudCount: { type: Number, default: 0 },

  // Actions
  autoBlock: { type: Boolean, default: false },
  flagForReview: { type: Boolean, default: true },

  active: { type: Boolean, default: true },
}, { timestamps: true });

FraudPatternSchema.index({ patternType: 1, active: 1 });

export const FraudPattern = mongoose.models.FraudPattern || mongoose.model('FraudPattern', FraudPatternSchema);

// ============================================
// ORDER RISK SCORE - Real-time scoring
// ============================================

const OrderRiskScoreSchema = new Schema({
  orderId: { type: String, required: true, unique: true },

  // Input features
  customerId: String,
  customerPhone: String,
  amount: Number,
  items: [{
    category: String,
    price: Number,
  }],
  pincode: String,
  merchantId: String,
  courier: String,

  // Scores (0-100)
  customerRisk: { type: Number, default: 50 },
  pincodeRisk: { type: Number, default: 50 },
  merchantRisk: { type: Number, default: 50 },
  orderRisk: { type: Number, default: 50 },
  courierRisk: { type: Number, default: 50 },

  // Combined score
  totalRiskScore: { type: Number, default: 50, index: true },

  // Recommendations
  recommendations: [{
    action: String,
    reason: String,
    confidence: Number,
  }],

  // Decision
  decision: {
    type: String,
    enum: ['approve', 'review', 'reject', 'prepay'],
    default: 'review'
  },

  // Features used
  features: Schema.Types.Mixed,

  // Model version
  modelVersion: { type: String, default: '1.0' },

  checkedAt: { type: Date, default: Date.now },
}, { timestamps: true });

OrderRiskScoreSchema.index({ totalRiskScore: 1, decision: 1 });

export const OrderRiskScore = mongoose.models.OrderRiskScore || mongoose.model('OrderRiskScore', OrderRiskScoreSchema);

// ============================================
// TRAINING DATA - ML model training records
// ============================================

const TrainingDataSchema = new Schema({
  orderId: { type: String, required: true },

  // Features (input)
  features: {
    customerOrderCount: Number,
    customerRTORate: Number,
    customerAvgOrderValue: Number,
    pincodeRTORate: Number,
    merchantRTORate: Number,
    orderValue: Number,
    itemCount: Number,
    highValueItems: Number,
    deliveryAttempts: Number,
    timeOfDay: Number,
    dayOfWeek: Number,
    region: String,
    category: String,
  },

  // Label (output)
  label: { type: String, enum: ['delivered', 'rto'] },

  // Model that created this
  modelVersion: String,

  // Actual outcome (filled later)
  outcome: String,
  outcomeVerified: { type: Boolean, default: false },
}, { timestamps: true });

TrainingDataSchema.index({ modelVersion: 1, label: 1 });

export const TrainingData = mongoose.models.TrainingData || mongoose.model('TrainingData', TrainingDataSchema);
