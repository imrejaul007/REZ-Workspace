/**
 * REZ Deal Intelligence - Deal Model
 *
 * Stores deals with AI-generated insights and scores
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================================================
// Types
// ============================================================================

export type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
export type DealTemperature = 'hot' | 'warm' | 'cold';
export type WinProbabilityMethod = 'rule_based' | 'ml_model' | 'historical';

export interface IDealScore {
  overall: number;
  companyFit: number;
  intent: number;
  engagement: number;
  activity: number;
  sentiment: number;
}

export interface IWinPrediction {
  probability: number;
  confidence: number;
  method: WinProbabilityMethod;
  factors: Array<{ name: string; contribution: number }>;
  lastUpdated: Date;
}

export interface IDeal extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: string;

  // Deal Info
  dealId: string;
  name: string;
  value: number;
  currency: string;

  // Stage
  stage: DealStage;
  temperature: DealTemperature;

  // Company
  companyId: string;
  companyName: string;
  industry?: string;
  companySize?: string;

  // Contacts
  primaryContactId?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;

  // Owner
  ownerId: string;
  ownerName?: string;

  // CRM Reference
  crmDealId?: string;
  crmOpportunityId?: string;

  // AI Scores
  score: IDealScore;

  // Win Prediction
  winPrediction?: IWinPrediction;

  // Recommendations
  recommendations: Array<{
    id: string;
    type: 'next_action' | 'risk' | 'opportunity' | 'insight';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    action?: string;
    confidence?: number;
    createdAt: Date;
  }>;

  // Risk Factors
  riskFactors: Array<{
    factor: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    detectedAt: Date;
  }>;

  // Timeline
  expectedCloseDate?: Date;
  actualCloseDate?: Date;
  daysInStage: number;
  totalDays: number;

  // Competitors
  competitors?: string[];

  // Notes
  notes?: string;

  // External refs
  icpId?: string;
  signalIds?: string[];
  conversationIds?: string[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Schemas
// ============================================================================

const DealScoreSchema = new Schema<IDealScore>({
  overall: { type: Number, default: 0 },
  companyFit: { type: Number, default: 0 },
  intent: { type: Number, default: 0 },
  engagement: { type: Number, default: 0 },
  activity: { type: Number, default: 0 },
  sentiment: { type: Number, default: 0 },
}, { _id: false });

const WinPredictionSchema = new Schema<IWinPrediction>({
  probability: { type: Number, required: true },
  confidence: { type: Number, required: true },
  method: { type: String, enum: ['rule_based', 'ml_model', 'historical'], required: true },
  factors: [{
    name: { type: String, required: true },
    contribution: { type: Number, required: true },
  }],
  lastUpdated: { type: Date, required: true },
}, { _id: false });

const RecommendationSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['next_action', 'risk', 'opportunity', 'insight'], required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  action: String,
  confidence: Number,
  createdAt: { type: Date, required: true },
}, { _id: false });

const RiskFactorSchema = new Schema({
  factor: { type: String, required: true },
  severity: { type: String, enum: ['high', 'medium', 'low'], required: true },
  description: { type: String, required: true },
  detectedAt: { type: Date, required: true },
}, { _id: false });

// ============================================================================
// Main Schema
// ============================================================================

const DealSchema = new Schema<IDeal>({
  tenantId: { type: String, required: true, index: true },

  dealId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  value: { type: Number, required: true },
  currency: { type: String, default: 'USD' },

  stage: {
    type: String,
    enum: ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
    default: 'lead',
    index: true,
  },
  temperature: {
    type: String,
    enum: ['hot', 'warm', 'cold'],
    default: 'cold',
  },

  companyId: { type: String, required: true, index: true },
  companyName: { type: String, required: true },
  industry: String,
  companySize: String,

  primaryContactId: String,
  primaryContactName: String,
  primaryContactEmail: String,

  ownerId: { type: String, required: true, index: true },
  ownerName: String,

  crmDealId: String,
  crmOpportunityId: String,

  score: {
    type: DealScoreSchema,
    default: () => ({}),
  },

  winPrediction: WinPredictionSchema,

  recommendations: [RecommendationSchema],

  riskFactors: [RiskFactorSchema],

  expectedCloseDate: Date,
  actualCloseDate: Date,
  daysInStage: { type: Number, default: 0 },
  totalDays: { type: Number, default: 0 },

  competitors: [String],

  notes: String,

  icpId: String,
  signalIds: [String],
  conversationIds: [String],
}, {
  timestamps: true,
});

// Indexes
DealSchema.index({ tenantId: 1, stage: 1 });
DealSchema.index({ tenantId: 1, temperature: 1 });
DealSchema.index({ tenantId: 1, 'score.overall': -1 });
DealSchema.index({ tenantId: 1, ownerId: 1 });
DealSchema.index({ tenantId: 1, expectedCloseDate: 1 });
DealSchema.index({ companyId: 1 });
DealSchema.index({ createdAt: -1 });

// ============================================================================
// Model
// ============================================================================

export const DealModel: Model<IDeal> = mongoose.model<IDeal>('Deal', DealSchema);
export default DealModel;
