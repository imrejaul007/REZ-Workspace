/**
 * DPACampaign MongoDB Model
 * Stores dynamic product ad campaigns
 */

import mongoose, { Document, Schema } from 'mongoose';
import type {
  AdTemplate,
  TargetingRules,
  UserTargeting,
  CampaignMetrics,
  CampaignStatus,
} from '../types';

// Element style schema
const elementStyleSchema = new Schema({
  fontFamily: { type: String },
  fontSize: { type: Number },
  fontWeight: { type: Schema.Types.Mixed },
  color: { type: String },
  backgroundColor: { type: String },
  borderRadius: { type: Number },
  borderWidth: { type: Number },
  borderColor: { type: String },
  padding: { type: Number },
  margin: { type: Number },
  textAlign: { type: String, enum: ['left', 'center', 'right'] },
  lineHeight: { type: Number },
  letterSpacing: { type: Number },
  opacity: { type: Number, min: 0, max: 1 },
  zIndex: { type: Number },
}, { _id: false });

// Element position schema
const elementPositionSchema = new Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
}, { _id: false });

// Template element schema
const templateElementSchema = new Schema({
  type: {
    type: String,
    enum: [
      'product_image',
      'product_name',
      'price',
      'original_price',
      'discount',
      'cta',
      'logo',
      'badge',
      'rating',
      'description',
      'brand',
      'availability',
    ],
    required: true,
  },
  position: elementPositionSchema,
  style: elementStyleSchema,
  content: { type: String },
  dynamicField: { type: String },
}, { _id: false });

// Ad template schema
const adTemplateSchema = new Schema({
  layout: {
    type: String,
    enum: ['grid', 'carousel', 'single', 'hero', 'collection'],
    required: true,
  },
  dimensions: {
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  elements: [templateElementSchema],
  backgroundColor: { type: String },
  borderRadius: { type: Number },
  spacing: { type: Number },
}, { _id: false });

// Targeting rules schema
const targetingRulesSchema = new Schema({
  minPrice: { type: Number, min: 0 },
  maxPrice: { type: Number, min: 0 },
  categories: [{ type: String }],
  excludeProducts: [{ type: String }],
  discountThreshold: { type: Number, min: 0, max: 100 },
  inStockOnly: { type: Boolean, default: false },
  brandWhitelist: [{ type: String }],
  brandBlacklist: [{ type: String }],
}, { _id: false });

// User targeting schema
const userTargetingSchema = new Schema({
  userSegments: [{ type: String }],
  browsingHistory: { type: Boolean, default: false },
  cartAbandoners: { type: Boolean, default: false },
  lookalikeAudience: { type: Boolean, default: false },
  retargetingDays: { type: Number, min: 1, max: 90 },
}, { _id: false });

// Campaign metrics schema
const campaignMetricsSchema = new Schema({
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  orders: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  ctr: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 },
  costPerClick: { type: Number, default: 0 },
  costPerOrder: { type: Number, default: 0 },
  roas: { type: Number, default: 0 },
}, { _id: false });

// Campaign budget schema
const campaignBudgetSchema = new Schema({
  daily: { type: Number, min: 0 },
  total: { type: Number, min: 0 },
  spent: { type: Number, default: 0 },
}, { _id: false });

// Campaign schedule schema
const campaignScheduleSchema = new Schema({
  startDate: { type: Date },
  endDate: { type: Date },
  timezone: { type: String, default: 'Asia/Kolkata' },
}, { _id: false });

// DPACampaign document interface
export interface IDPACampaign extends Document {
  campaignId: string;
  advertiserId: string;
  name: string;
  description?: string;
  feedId: string;
  template: AdTemplate;
  rules: TargetingRules;
  targeting: UserTargeting;
  metrics: CampaignMetrics;
  status: CampaignStatus;
  budget?: {
    daily?: number;
    total?: number;
    spent: number;
  };
  schedule?: {
    startDate?: Date;
    endDate?: Date;
    timezone?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Campaign schema
const dpaCampaignSchema = new Schema<IDPACampaign>(
  {
    campaignId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    advertiserId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: { type: String },
    feedId: {
      type: String,
      required: true,
      index: true,
    },
    template: {
      type: adTemplateSchema,
      required: true,
    },
    rules: {
      type: targetingRulesSchema,
      default: () => ({}),
    },
    targeting: {
      type: userTargetingSchema,
      default: () => ({}),
    },
    metrics: {
      type: campaignMetricsSchema,
      default: () => ({
        impressions: 0,
        clicks: 0,
        orders: 0,
        revenue: 0,
        ctr: 0,
        conversionRate: 0,
        costPerClick: 0,
        costPerOrder: 0,
        roas: 0,
      }),
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'draft'],
      default: 'draft',
    },
    budget: campaignBudgetSchema,
    schedule: campaignScheduleSchema,
  },
  {
    timestamps: true,
    collection: 'dpa_campaigns',
  }
);

// Indexes
dpaCampaignSchema.index({ advertiserId: 1, status: 1 });
dpaCampaignSchema.index({ feedId: 1 });
dpaCampaignSchema.index({ 'metrics.impressions': -1 });
dpaCampaignSchema.index({ createdAt: -1 });

// Instance methods
dpaCampaignSchema.methods.recordImpression = function () {
  this.metrics.impressions += 1;
  this.calculateCTR();
};

dpaCampaignSchema.methods.recordClick = function () {
  this.metrics.clicks += 1;
  this.calculateCTR();
};

dpaCampaignSchema.methods.recordConversion = function (revenue: number) {
  this.metrics.orders += 1;
  this.metrics.revenue += revenue;
  this.calculateConversionRate();
  this.calculateROAS();
};

dpaCampaignSchema.methods.calculateCTR = function () {
  if (this.metrics.impressions > 0) {
    this.metrics.ctr = (this.metrics.clicks / this.metrics.impressions) * 100;
  }
};

dpaCampaignSchema.methods.calculateConversionRate = function () {
  if (this.metrics.clicks > 0) {
    this.metrics.conversionRate = (this.metrics.orders / this.metrics.clicks) * 100;
  }
};

dpaCampaignSchema.methods.calculateROAS = function () {
  // ROAS = Revenue / Ad Spend (assuming spend is tracked elsewhere)
  // For now, we return revenue directly
  return this.metrics.revenue;
};

dpaCampaignSchema.methods.pause = function () {
  this.status = 'paused';
};

dpaCampaignSchema.methods.activate = function () {
  this.status = 'active';
};

dpaCampaignSchema.methods.complete = function () {
  this.status = 'completed';
};

// Static methods
dpaCampaignSchema.statics.findByAdvertiser = function (advertiserId: string) {
  return this.find({ advertiserId }).sort({ createdAt: -1 });
};

dpaCampaignSchema.statics.findActiveCampaigns = function () {
  return this.find({ status: 'active' });
};

dpaCampaignSchema.statics.findByFeedId = function (feedId: string) {
  return this.find({ feedId });
};

dpaCampaignSchema.statics.findByCampaignId = function (campaignId: string) {
  return this.findOne({ campaignId });
};

dpaCampaignSchema.statics.getTopPerforming = function (limit: number = 10) {
  return this.find({ status: 'active' })
    .sort({ 'metrics.ctr': -1 })
    .limit(limit);
};

dpaCampaignSchema.statics.getCampaignsByMetric = function (
  metric: keyof CampaignMetrics,
  order: 'asc' | 'desc' = 'desc',
  limit: number = 10
) {
  const sortObj: Record<string, 1 | -1> = {};
  sortObj[`metrics.${metric}`] = order === 'desc' ? -1 : 1;
  return this.find({ status: 'active' }).sort(sortObj).limit(limit);
};

// Pre-save hook
dpaCampaignSchema.pre('save', function (next) {
  if (this.isModified('metrics')) {
    this.calculateCTR();
    this.calculateConversionRate();
  }
  next();
});

export const DPACampaignModel = mongoose.model<IDPACampaign>('DPACampaign', dpaCampaignSchema);

export default DPACampaignModel;