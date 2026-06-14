/**
 * REZ Business AI - Models
 */

import mongoose, { Schema } from 'mongoose';

// Merchant Configuration Schema
const MerchantConfigSchema = new Schema({
  merchantId: { type: String, required: true, unique: true, index: true },
  businessType: {
    type: String,
    enum: ['restaurant', 'hotel', 'salon', 'gym', 'clinic', 'spa', 'retail', 'pharmacy', 'education'],
    required: true,
  },
  goals: {
    primary: [{
      type: { type: String, enum: ['revenue', 'customers', 'retention', 'footfall', 'avg_order'] },
      target: Number,
      timeline: { type: String, enum: ['daily', 'weekly', 'monthly'] },
    }],
    secondary: [{
      type: String,
      target: Number,
      timeline: String,
    }],
    metrics: {
      targetRevenue: Number,
      targetCustomers: Number,
      targetRetention: Number,
      targetFootfall: Number,
    },
  },
  constraints: {
    maxDiscount: { type: Number, default: 30 },
    maxAdBudget: { type: Number, default: 5000 },
    minMargin: { type: Number, default: 15 },
    operatingHours: { type: Schema.Types.Mixed },
    restrictedDays: [String],
    maxCashback: { type: Number, default: 20 },
    maxOfferValue: { type: Number, default: 500 },
    requireApprovalAbove: { type: Number, default: 10 },
  },
  brandVoice: {
    tone: { type: String, enum: ['professional', 'friendly', 'luxury', 'casual'], default: 'friendly' },
    keywords: [String],
    avoidWords: [String],
    language: { type: String, enum: ['en', 'hi', 'regional'], default: 'en' },
  },
  approvalMode: {
    type: String,
    enum: ['suggestion', 'semi_autonomous', 'autonomous'],
    default: 'suggestion',
  },
  isActive: { type: Boolean, default: true },
  lastAnalysis: Date,
}, { timestamps: true });

// AI Action Schema
const AIActionSchema = new Schema({
  merchantId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: [
      'pricing_adjustment', 'campaign_create', 'offer_launch', 'notification_send',
      'whatsapp_campaign', 'loyalty_boost', 'ad_create', 'customer_reengagement',
      'inventory_alert', 'staffing_suggestion', 'demand_forecast',
      'competitor_response', 'event_campaign', 'report_generate',
    ],
    required: true,
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'executing', 'completed', 'failed'], default: 'pending' },
  agent: { type: String, required: true },
  data: { type: Schema.Types.Mixed, required: true },
  confidence: { type: Number, min: 0, max: 1 },
  reasoning: String,
  estimatedImpact: {
    revenue: Number,
    customers: Number,
    conversionRate: Number,
    roi: Number,
    confidence: Number,
  },
  requiresApproval: { type: Boolean, default: true },
  approvedBy: String,
  executedAt: Date,
  error: String,
}, { timestamps: true });

AIActionSchema.index({ merchantId: 1, status: 1 });
AIActionSchema.index({ merchantId: 1, type: 1, createdAt: -1 });

// Business Report Schema
const BusinessReportSchema = new Schema({
  merchantId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'custom', 'competitor_analysis', 'performance_review'],
    required: true,
  },
  period: {
    start: Date,
    end: Date,
  },
  summary: {
    revenue: Number,
    revenueChange: Number,
    orders: Number,
    ordersChange: Number,
    customers: Number,
    customersChange: Number,
    avgOrderValue: Number,
    topProducts: [{
      name: String,
      quantity: Number,
      revenue: Number,
    }],
    customerSegments: [{
      segment: String,
      count: Number,
      revenue: Number,
    }],
  },
  insights: [{
    type: { type: String, enum: ['positive', 'negative', 'neutral', 'opportunity', 'warning'] },
    title: String,
    description: String,
    data: Schema.Types.Mixed,
    impact: { type: String, enum: ['high', 'medium', 'low'] },
  }],
  recommendations: [{
    priority: Number,
    action: String,
    reason: String,
    expectedImpact: Schema.Types.Mixed,
    effort: { type: String, enum: ['low', 'medium', 'high'] },
    autoExecutable: Boolean,
  }],
  generatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

BusinessReportSchema.index({ merchantId: 1, generatedAt: -1 });

// Export models
export const MerchantConfigModel = mongoose.model('MerchantConfig', MerchantConfigSchema);
export const AIActionModel = mongoose.model('AIAction', AIActionSchema);
export const BusinessReportModel = mongoose.model('BusinessReport', BusinessReportSchema);
