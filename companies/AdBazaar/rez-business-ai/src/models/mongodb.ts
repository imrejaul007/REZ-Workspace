import logger from './utils/logger';

/**
 * REZ Business AI - MongoDB Schema
 * Production database models
 */

const mongoose = require('mongoose');

// Merchant Config Schema
const merchantConfigSchema = new mongoose.Schema({
  merchantId: { type: String, required: true, unique: true },
  businessName: String,
  businessType: { type: String, enum: ['restaurant', 'salon', 'hotel', 'gym', 'clinic', 'retail', 'grocery', 'other'] },
  goals: {
    revenue: { daily: Number, weekly: Number, monthly: Number },
    customers: { daily: Number, weekly: Number, monthly: Number },
    retention: { target: Number },
  },
  constraints: {
    maxDiscount: Number,
    maxAdBudget: Number,
    minMargin: Number,
    approvalRequiredAbove: Number,
  },
  approvalMode: { type: String, enum: ['manual', 'semi', 'auto'], default: 'manual' },
  tone: { type: String, enum: ['professional', 'friendly', 'luxury'] },
  channels: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// AI Action Schema
const actionSchema = new mongoose.Schema({
  merchantId: { type: String, required: true, index: true },
  type: { type: String, enum: ['campaign', 'pricing', 'notification', 'retention', 'inventory'] },
  title: String,
  description: String,
  reasoning: String,
  confidence: Number,
  estimatedImpact: {
    revenue: Number,
    customers: Number,
    roi: Number,
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'executing', 'completed'], default: 'pending' },
  executedAt: Date,
  result: {
    revenue: Number,
    customers: Number,
    roi: Number,
  },
  createdAt: { type: Date, default: Date.now },
});

// Campaign Bundle Schema
const bundleSchema = new mongoose.Schema({
  merchantId: { type: String, required: true },
  bundleType: String,
  name: String,
  executedAt: Date,
  result: {
    revenue: Number,
    customers: Number,
    conversions: Number,
  },
  createdAt: { type: Date, default: Date.now },
});

// Memory/History Schema
const memorySchema = new mongoose.Schema({
  merchantId: { type: String, required: true, index: true },
  actionType: String,
  result: String,
  impact: Number,
  pattern: String,
  createdAt: { type: Date, default: Date.now },
});

// Attribution Schema
const attributionSchema = new mongoose.Schema({
  merchantId: { type: String, required: true, index: true },
  channel: String,
  revenue: Number,
  conversions: Number,
  roi: Number,
  date: { type: Date, default: Date.now },
});

// Customer Schema
const customerSchema = new mongoose.Schema({
  merchantId: { type: String, required: true, index: true },
  customerId: { type: String, required: true },
  phone: String,
  name: String,
  lifetimeValue: { type: Number, default: 0 },
  orderFrequency: { type: Number, default: 0 },
  lastOrderAt: Date,
  churnRisk: { type: Number, default: 0 },
  segment: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Compile models
const MerchantConfig = mongoose.models.MerchantConfig || mongoose.model('MerchantConfig', merchantConfigSchema);
const AIAction = mongoose.models.AIAction || mongoose.model('AIAction', actionSchema);
const BundleExecution = mongoose.models.BundleExecution || mongoose.model('BundleExecution', bundleSchema);
const Memory = mongoose.models.Memory || mongoose.model('Memory', memorySchema);
const Attribution = mongoose.models.Attribution || mongoose.model('Attribution', attributionSchema);
const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);

// Database connection
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logger.info('MONGODB_URI not set - using in-memory mode');
    return false;
  }
  try {
    await mongoose.connect(uri);
    logger.info('Connected to MongoDB');
    return true;
  } catch (err) {
    logger.error('MongoDB connection failed:', err.message);
    return false;
  }
}

module.exports = {
  MerchantConfig,
  AIAction,
  BundleExecution,
  Memory,
  Attribution,
  Customer,
  connectDB,
};
