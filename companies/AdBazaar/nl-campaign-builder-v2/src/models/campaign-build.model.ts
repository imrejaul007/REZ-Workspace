import mongoose, { Schema, Document } from 'mongoose';
import {
  NLCampaignBuild,
  GoalType,
  BuildStatus,
  CampaignStatus,
  ChannelType
} from '../types';

// Extended Document interface
export interface NLCampaignBuildDocument extends Omit<NLCampaignBuild, 'createdAt' | 'updatedAt'>, Document {
  createdAt: Date;
  updatedAt: Date;
}

// Goal Schema
const CampaignGoalSchema = new Schema({
  type: {
    type: String,
    enum: ['leads', 'sales', 'bookings', 'traffic', 'awareness'],
    required: true
  },
  target: { type: Number, required: true },
  timeline: { type: String },
  kpi: { type: String },
  conversionMetric: { type: String }
}, { _id: false });

// Demographics Schema
const DemographicsSchema = new Schema({
  age: { type: String },
  gender: { type: String },
  income: { type: String },
  education: { type: String },
  occupation: [{ type: String }]
}, { _id: false });

// Audience Targeting Schema
const AudienceTargetingSchema = new Schema({
  location: [{ type: String, required: true }],
  demographics: DemographicsSchema,
  interests: [{ type: String }],
  income: { type: String },
  behaviors: [{ type: String }],
  customSegments: [{ type: String }]
}, { _id: false });

// Product Schema
const ProductSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number },
  category: { type: String },
  sku: { type: String },
  description: { type: String }
}, { _id: false });

// Budget Configuration Schema
const BudgetConfigSchema = new Schema({
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  allocation: {
    channels: { type: Map, of: Number },
    creative: { type: Number },
    testing: { type: Number }
  },
  optimization: {
    type: String,
    enum: ['aggressive', 'moderate', 'conservative'],
    default: 'moderate'
  }
}, { _id: false });

// Timeline Schema
const TimelineSchema = new Schema({
  startDate: { type: Date },
  endDate: { type: Date },
  duration: { type: String }
}, { _id: false });

// Parsed Intent Schema
const ParsedIntentSchema = new Schema({
  goal: { type: CampaignGoalSchema, required: true },
  audience: { type: AudienceTargetingSchema, required: true },
  budget: { type: BudgetConfigSchema, required: true },
  products: [ProductSchema],
  channels: [{
    type: String,
    enum: ['google', 'facebook', 'instagram', 'youtube', 'linkedin', 'twitter', 'tiktok', 'display', 'native']
  }],
  timeline: TimelineSchema,
  additionalContext: { type: Map, of: Schema.Types.Mixed }
}, { _id: false });

// Campaign Ad Schema
const CampaignAdSchema = new Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ['image', 'video', 'carousel', 'text', 'story'],
    required: true
  },
  headline: { type: String, required: true },
  description: { type: String },
  callToAction: { type: String, required: true },
  creativeAssets: {
    images: [{ type: String }],
    videos: [{ type: String }],
    copyVariants: [{ type: String }]
  },
  targetingOverrides: {
    location: [{ type: String }],
    ageRange: {
      min: Number,
      max: Number
    },
    interests: [{ type: String }]
  }
}, { _id: false });

// A/B Test Schema
const ABTestConfigSchema = new Schema({
  enabled: { type: Boolean, default: false },
  variants: [{
    id: String,
    name: String,
    weight: Number,
    changes: { type: Map, of: Schema.Types.Mixed }
  }],
  metric: { type: String, default: 'conversions' },
  sampleSize: { type: Number },
  confidence: { type: Number }
}, { _id: false });

// Campaign Targeting Schema
const CampaignTargetingSchema = new Schema({
  locations: [{ type: String, required: true }],
  ageRange: {
    min: { type: Number, min: 13, max: 65 },
    max: { type: Number, min: 13, max: 65 }
  },
  gender: [{ type: String }],
  interests: [{ type: String }],
  behaviors: [{ type: String }],
  customAudiences: [{ type: String }],
  lookalikeAudiences: [{ type: String }],
  placement: [{ type: String }],
  deviceTypes: [{
    type: String,
    enum: ['desktop', 'mobile', 'tablet']
  }]
}, { _id: false });

// Bid Strategy Schema
const BidStrategySchema = new Schema({
  type: {
    type: String,
    enum: ['cpc', 'cpm', 'cpa', 'cpv', 'auto'],
    required: true
  },
  bidAmount: { type: Number },
  maxBid: { type: Number },
  targetCost: { type: Number }
}, { _id: false });

// Tracking Schema
const TrackingSchema = new Schema({
  pixelIds: [{ type: String }],
  conversionEvents: [{ type: String }],
  utmParams: { type: Map, of: String }
}, { _id: false });

// Optimization Schema
const OptimizationSchema = new Schema({
  bidOptimization: { type: Boolean, default: true },
  audienceExpansion: { type: Boolean, default: false },
  placements: [{ type: String }]
}, { _id: false });

// Generated Campaign Schema
const GeneratedCampaignSchema = new Schema({
  name: { type: String, required: true },
  objective: {
    type: String,
    enum: ['leads', 'sales', 'bookings', 'traffic', 'awareness'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  },
  budget: { type: BudgetConfigSchema, required: true },
  targeting: { type: CampaignTargetingSchema, required: true },
  ads: { type: [CampaignAdSchema], required: true },
  schedule: {
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    frequencyCap: { type: Number }
  },
  bidStrategy: { type: BidStrategySchema, required: true },
  tracking: TrackingSchema,
  optimization: OptimizationSchema
}, { _id: false });

// Metadata Schema
const MetadataSchema = new Schema({
  model: { type: String },
  processingTime: { type: Number },
  tokensUsed: { type: Number }
}, { _id: false });

// Main Campaign Build Schema
const NLCampaignBuildSchema = new Schema<NLCampaignBuildDocument>({
  buildId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  advertiserId: {
    type: String,
    required: true,
    index: true
  },
  naturalLanguage: {
    type: String,
    required: true
  },
  parsed: {
    type: ParsedIntentSchema,
    required: true
  },
  generatedCampaign: {
    type: GeneratedCampaignSchema,
    required: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  suggestions: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['parsing', 'generating', 'completed', 'failed'],
    required: true,
    default: 'parsing'
  },
  errors: [{
    type: String
  }],
  warnings: [{
    type: String
  }],
  metadata: MetadataSchema
}, {
  timestamps: true,
  collection: 'campaign_builds'
});

// Indexes
NLCampaignBuildSchema.index({ advertiserId: 1, createdAt: -1 });
NLCampaignBuildSchema.index({ status: 1 });
NLCampaignBuildSchema.index({ confidence: -1 });
NLCampaignBuildSchema.index({ 'parsed.goal.type': 1 });

// Methods
NLCampaignBuildSchema.methods.updateStatus = function(status: BuildStatus, error?: string) {
  this.status = status;
  if (error) {
    this.errors = this.errors || [];
    this.errors.push(error);
  }
  return this.save();
};

NLCampaignBuildSchema.methods.addSuggestion = function(suggestion: string) {
  this.suggestions.push(suggestion);
  return this.save();
};

// Static methods
NLCampaignBuildSchema.statics.findByAdvertiser = function(advertiserId: string, limit = 20) {
  return this.find({ advertiserId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .exec();
};

NLCampaignBuildSchema.statics.findRecentByStatus = function(status: BuildStatus, limit = 50) {
  return this.find({ status })
    .sort({ createdAt: -1 })
    .limit(limit)
    .exec();
};

// Export
export const NLCampaignBuildModel = mongoose.model<NLCampaignBuildDocument>(
  'NLCampaignBuild',
  NLCampaignBuildSchema
);

export default NLCampaignBuildModel;