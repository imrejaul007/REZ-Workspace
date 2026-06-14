import mongoose, { Schema, Document } from 'mongoose';
import { CTVCampaign, CampaignStatus, AdFormat } from '../types/index.js';

export interface CTVCampaignDocument extends Omit<CTVCampaign, 'createdAt' | 'updatedAt'>, Document {
  createdAt: Date;
  updatedAt: Date;
}

const CompanionAdSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['static', 'html'], required: true },
  content: { type: String, required: true },
  clickUrl: { type: String, required: true },
  altText: { type: String },
}, { _id: false });

const CTVCreativeSchema = new Schema({
  creativeId: { type: String, required: true },
  name: { type: String, required: true },
  videoUrl: { type: String, required: true },
  vastXml: { type: String },
  duration: { type: Number, required: true },
  clickUrl: { type: String, required: true },
  mimeType: { type: String },
  bitrate: { type: Number },
  width: { type: Number },
  height: { type: Number },
  companionAds: [CompanionAdSchema],
}, { _id: false });

const CTVCampaignSchema = new Schema<CTVCampaignDocument>({
  campaignId: { type: String, required: true, unique: true, index: true },
  advertiserId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'draft'] as CampaignStatus[],
    default: 'draft',
    index: true
  },
  format: {
    type: String,
    enum: ['preroll', 'midroll', 'postroll', 'pod'] as AdFormat[],
    required: true
  },
  budget: {
    daily: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    spent: { type: Number, default: 0, min: 0 },
  },
  bid: {
    type: { type: String, enum: ['cpm', 'cpv', 'cpa'], required: true },
    amount: { type: Number, required: true, min: 0 },
    maxBid: { type: Number, required: true, min: 0 },
  },
  targeting: {
    geo: [String],
    deviceTypes: [String],
    apps: [String],
    contentCategories: [String],
    dayparting: {
      days: [String],
      startHour: Number,
      endHour: Number,
    },
    ageRating: [String],
  },
  creatives: [CTVCreativeSchema],
  pacing: {
    type: { type: String, enum: ['even', 'asap', 'frontloaded'], required: true },
    dailyPacingPercent: Number,
  },
  frequency: {
    maxImpressions: { type: Number, required: true, min: 1 },
    windowHours: { type: Number, required: true, min: 1 },
  },
  metrics: {
    impressions: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    completions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    skips: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
 ctr: Number,
    vtr: Number,
    cpm: Number,
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
}, {
  timestamps: true,
  collection: 'ctv_campaigns',
});

// Indexes for efficient queries
CTVCampaignSchema.index({ status: 1, startDate: 1, endDate: 1 });
CTVCampaignSchema.index({ 'targeting.geo': 1 });
CTVCampaignSchema.index({ 'targeting.deviceTypes': 1 });
CTVCampaignSchema.index({ 'budget.spent': 1, 'budget.total': 1 });

// Pre-save hook to calculate derived metrics
CTVCampaignSchema.pre('save', function(next) {
  if (this.metrics.impressions > 0) {
    this.metrics.ctr = (this.metrics.clicks / this.metrics.impressions) * 100;
    this.metrics.vtr = (this.metrics.completions / this.metrics.impressions) * 100;
    this.metrics.cpm = (this.metrics.revenue / this.metrics.impressions) * 1000;
  }
  next();
});

export const CTVCampaignModel = mongoose.model<CTVCampaignDocument>('CTVCampaign', CTVCampaignSchema);
