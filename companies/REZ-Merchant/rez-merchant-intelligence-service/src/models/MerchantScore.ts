import mongoose, { Document, Schema } from 'mongoose';
import {
  HealthScore,
  GrowthScore,
  EngagementScore,
  RiskIndicator,
} from '../types';

export interface MerchantScoreDocument extends Document {
  merchantId: string;
  healthScore: HealthScore;
  growthScore: GrowthScore;
  engagementScore: EngagementScore;
  riskIndicators: RiskIndicator[];
  compositeScore: number;
  calculatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Health Score Components
const HealthScoreComponentsSchema = new Schema({
  revenue: { type: Number, default: 0 },
  orders: { type: Number, default: 0 },
  customers: { type: Number, default: 0 },
  inventory: { type: Number, default: 0 },
  feedback: { type: Number, default: 0 },
  engagement: { type: Number, default: 0 },
}, { _id: false });

const HealthScoreFactorSchema = new Schema({
  name: { type: String, required: true },
  impact: { type: Number, required: true },
}, { _id: false });

const HealthScoreSchema = new Schema({
  score: { type: Number, default: 0 },
  grade: { type: String, enum: ['A', 'B', 'C', 'D', 'F'], default: 'C' },
  components: { type: HealthScoreComponentsSchema, default: () => ({}) },
  factors: [HealthScoreFactorSchema],
}, { _id: false });

// Growth Score Components
const GrowthScoreComponentsSchema = new Schema({
  revenueGrowth: { type: Number, default: 0 },
  orderGrowth: { type: Number, default: 0 },
  customerGrowth: { type: Number, default: 0 },
  marketExpansion: { type: Number, default: 0 },
}, { _id: false });

const GrowthScoreSchema = new Schema({
  score: { type: Number, default: 0 },
  grade: { type: String, enum: ['A', 'B', 'C', 'D', 'F'], default: 'C' },
  components: { type: GrowthScoreComponentsSchema, default: () => ({}) },
  momentum: { type: String, enum: ['accelerating', 'stable', 'decelerating'], default: 'stable' },
}, { _id: false });

// Engagement Score Components
const EngagementScoreComponentsSchema = new Schema({
  customerEngagement: { type: Number, default: 0 },
  repeatPurchaseRate: { type: Number, default: 0 },
  responseRate: { type: Number, default: 0 },
  updateFrequency: { type: Number, default: 0 },
}, { _id: false });

const EngagementScoreSchema = new Schema({
  score: { type: Number, default: 0 },
  grade: { type: String, enum: ['A', 'B', 'C', 'D', 'F'], default: 'C' },
  components: { type: EngagementScoreComponentsSchema, default: () => ({}) },
}, { _id: false });

// Risk Indicator Schema
const RiskIndicatorSchema = new Schema({
  type: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  probability: { type: Number, required: true },
  impact: { type: Number, required: true },
  description: { type: String, required: true },
  mitigation: { type: String },
}, { _id: false });

// Main Score Schema
const MerchantScoreSchema = new Schema<MerchantScoreDocument>(
  {
    merchantId: { type: String, required: true, unique: true, index: true },
    healthScore: { type: HealthScoreSchema, default: () => ({}) },
    growthScore: { type: GrowthScoreSchema, default: () => ({}) },
    engagementScore: { type: EngagementScoreSchema, default: () => ({}) },
    riskIndicators: [RiskIndicatorSchema],
    compositeScore: { type: Number, default: 0 },
    calculatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'merchant_scores',
  }
);

// Indexes
MerchantScoreSchema.index({ compositeScore: -1 });
MerchantScoreSchema.index({ 'healthScore.score': -1 });
MerchantScoreSchema.index({ 'growthScore.score': -1 });
MerchantScoreSchema.index({ calculatedAt: -1 });

export const MerchantScoreModel = mongoose.model<MerchantScoreDocument>('MerchantScore', MerchantScoreSchema);

export default MerchantScoreModel;
