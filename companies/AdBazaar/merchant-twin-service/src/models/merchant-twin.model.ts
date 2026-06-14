/**
 * Merchant Twin MongoDB Model
 */

import mongoose, { Schema, Document } from 'mongoose';
import { MerchantTwin } from '../types';

export interface MerchantTwinDocument extends Omit<MerchantTwin, 'createdAt' | 'updatedAt'>, Document {
  createdAt: Date;
  updatedAt: Date;
}

const AgeDistributionSchema = new Schema({
  range: { type: String, required: true },
  percentage: { type: Number, required: true, min: 0, max: 100 },
}, { _id: false });

const LocationSchema = new Schema({
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
}, { _id: false });

const BusinessSchema = new Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  subcategory: { type: String, required: true },
  location: { type: LocationSchema, required: true },
  size: { type: String, enum: ['small', 'medium', 'large'], required: true },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  yearsActive: { type: Number, min: 0, default: 0 },
}, { _id: false });

const DemographicsSchema = new Schema({
  ageDistribution: { type: [AgeDistributionSchema], default: [] },
  genderDistribution: { type: Map, of: Number, default: {} },
  incomeLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
}, { _id: false });

const BehavioralSchema = new Schema({
  avgVisitFrequency: { type: Number, default: 0 },
  avgOrderValue: { type: Number, default: 0 },
  peakHours: { type: [String], default: [] },
  popularDays: { type: [String], default: [] },
  repeatCustomerRate: { type: Number, min: 0, max: 1, default: 0 },
}, { _id: false });

const CustomerProfileSchema = new Schema({
  demographics: { type: DemographicsSchema, default: () => ({}) },
  behavioral: { type: BehavioralSchema, default: () => ({}) },
  size: { type: Number, default: 0 },
}, { _id: false });

const AdSpendHistorySchema = new Schema({
  month: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
}, { _id: false });

const AdvertisingSchema = new Schema({
  adSpendHistory: { type: [AdSpendHistorySchema], default: [] },
  preferredChannels: { type: [String], default: [] },
  targetAudience: { type: [String], default: [] },
  competitorOverlap: { type: Number, min: 0, max: 100, default: 0 },
  adEffectiveness: { type: Number, min: 0, max: 100, default: 0 },
}, { _id: false });

const GrowthSchema = new Schema({
  monthlyGrowth: { type: Number, default: 0 },
  seasonalPatterns: { type: [String], default: [] },
  expansionPotential: { type: Number, min: 0, max: 100, default: 0 },
  investmentReadiness: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
}, { _id: false });

const MerchantTwinSchema = new Schema({
  merchantId: { type: String, required: true, unique: true, index: true },
  twinId: { type: String, required: true, unique: true },
  business: { type: BusinessSchema, required: true },
  customerProfile: { type: CustomerProfileSchema, default: () => ({}) },
  advertising: { type: AdvertisingSchema, default: () => ({}) },
  growth: { type: GrowthSchema, default: () => ({}) },
}, {
  timestamps: true,
  collection: 'merchant_twins',
});

MerchantTwinSchema.index({ 'business.category': 1 });
MerchantTwinSchema.index({ 'business.location.city': 1 });
MerchantTwinSchema.index({ 'growth.investmentReadiness': 1 });

export const MerchantTwinModel = mongoose.model<MerchantTwinDocument>('MerchantTwin', MerchantTwinSchema);

export default MerchantTwinModel;