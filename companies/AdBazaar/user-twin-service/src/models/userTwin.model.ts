import mongoose, { Document, Schema } from 'mongoose';
import { IUserTwin, UserTwinStatus } from '../types';

export interface UserTwinDocument extends Omit<IUserTwin, 'userId' | 'twinId'>, Document {
  userId: string;
  twinId: string;
}

const LocationSchema = new Schema({
  city: { type: String, required: true, index: true },
  state: { type: String, required: true, index: true },
  country: { type: String, required: true, index: true },
}, { _id: false });

const PriceRangeSchema = new Schema({
  min: { type: Number, required: true, min: 0 },
  max: { type: Number, required: true, min: 0 },
}, { _id: false });

const DemographicsSchema = new Schema({
  age: { type: Number, min: 13, max: 120 },
  gender: { type: String },
  location: { type: LocationSchema, required: true },
}, { _id: false });

const PreferencesSchema = new Schema({
  language: { type: String, default: 'en' },
  notifications: { type: [String], default: [] },
  priceRange: { type: PriceRangeSchema, required: true },
}, { _id: false });

const ProfileSchema = new Schema({
  demographics: { type: DemographicsSchema, required: true },
  preferences: { type: PreferencesSchema, required: true },
}, { _id: false });

const InterestSchema = new Schema({
  category: { type: String, required: true, index: true },
  score: { type: Number, required: true, min: 0, max: 1 },
}, { _id: false });

const PurchaseHistoryItemSchema = new Schema({
  category: { type: String, required: true, index: true },
  count: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
}, { _id: false });

const BrowsingPatternsSchema = new Schema({
  patterns: { type: [String], default: [] },
  frequency: { type: Number, min: 0, max: 1, default: 0.5 },
}, { _id: false });

const BehavioralSchema = new Schema({
  interests: { type: [InterestSchema], default: [] },
  purchaseHistory: { type: [PurchaseHistoryItemSchema], default: [] },
  browsingPatterns: { type: BrowsingPatternsSchema, required: true },
  engagementScore: { type: Number, min: 0, max: 1, default: 0.5 },
  lastActive: { type: Date, default: Date.now, index: true },
}, { _id: false });

const PredictiveSchema = new Schema({
  churnRisk: { type: Number, min: 0, max: 1, default: 0.5 },
  lifetimeValue: { type: Number, min: 0, default: 0 },
  nextPurchaseLikely: { type: Date },
  preferredChannels: { type: [String], default: [] },
  optimalContactTime: { type: String, default: '10:00' },
}, { _id: false });

const AdvertisingSchema = new Schema({
  adResponsiveness: { type: Number, min: 0, max: 1, default: 0.5 },
  clickThroughHistory: { type: Number, min: 0, max: 1, default: 0 },
  conversionRate: { type: Number, min: 0, max: 1, default: 0 },
  preferredAdFormats: { type: [String], default: ['banner', 'video'] },
  brandAffinities: { type: Map, of: Number, default: {} },
}, { _id: false });

const UserTwinSchema = new Schema<UserTwinDocument>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    twinId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    profile: {
      type: ProfileSchema,
      required: true,
    },
    behavioral: {
      type: BehavioralSchema,
      required: true,
    },
    predictive: {
      type: PredictiveSchema,
      required: true,
    },
    advertising: {
      type: AdvertisingSchema,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'] as UserTwinStatus[],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound indexes for common queries
UserTwinSchema.index({ 'behavioral.lastActive': -1, status: 1 });
UserTwinSchema.index({ 'predictive.churnRisk': 1, status: 1 });
UserTwinSchema.index({ 'advertising.conversionRate': 1, status: 1 });
UserTwinSchema.index({ 'behavioral.engagementScore': -1, status: 1 });

// Virtual for full name
UserTwinSchema.virtual('fullLocation').get(function () {
  return `${this.profile.demographics.location.city}, ${this.profile.demographics.location.state}, ${this.profile.demographics.location.country}`;
});

// Method to check if twin needs refresh
UserTwinSchema.methods.needsRefresh = function (): boolean {
  const hoursSinceUpdate = (Date.now() - this.updatedAt.getTime()) / (1000 * 60 * 60);
  return hoursSinceUpdate > 24;
};

// Method to calculate engagement tier
UserTwinSchema.methods.getEngagementTier = function (): 'low' | 'medium' | 'high' {
  if (this.behavioral.engagementScore >= 0.7) return 'high';
  if (this.behavioral.engagementScore >= 0.4) return 'medium';
  return 'low';
};

// Static method to find high-value users
UserTwinSchema.statics.findHighValueUsers = function (ltvThreshold: number = 10000) {
  return this.find({
    'predictive.lifetimeValue': { $gte: ltvThreshold },
    status: 'active',
  }).sort({ 'predictive.lifetimeValue': -1 });
};

// Static method to find at-risk users
UserTwinSchema.statics.findAtRiskUsers = function (churnThreshold: number = 0.7) {
  return this.find({
    'predictive.churnRisk': { $gte: churnThreshold },
    status: 'active',
  }).sort({ 'predictive.churnRisk': -1 });
};

// Static method to get audience segments
UserTwinSchema.statics.getAudienceSegments = async function () {
  return this.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: '$profile.demographics.location.country',
        count: { $sum: 1 },
        avgEngagement: { $avg: '$behavioral.engagementScore' },
        avgChurnRisk: { $avg: '$predictive.churnRisk' },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

export const UserTwin = mongoose.model<UserTwinDocument>('UserTwin', UserTwinSchema);
export default UserTwin;