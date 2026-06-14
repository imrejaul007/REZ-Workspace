/**
 * REZ Signal Service - Company Signals Aggregated Model
 *
 * Stores aggregated signal data per company for quick lookups
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================================================
// Types
// ============================================================================

export interface ISignalTrend {
  date: Date;
  count: number;
  score: number;
}

export interface ISignalDistribution {
  jobPosting: number;
  funding: number;
  news: number;
  technologyChange: number;
  expansion: number;
  executiveChange: number;
  partnership: number;
  productLaunch: number;
  regulatory: number;
  other: number;
}

export interface ICompanySignals extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: string;
  companyId: string;
  companyName: string;

  // Aggregated scores
  overallScore: number;
  intentStage: 'awareness' | 'consideration' | 'decision' | 'purchase';
  intentScore: {
    awareness: number;
    consideration: number;
    decision: number;
    purchase: number;
  };

  // Signal counts by type
  signalCounts: ISignalDistribution;
  totalSignals: number;

  // Trends (last 30 days)
  signalTrends: ISignalTrend[];
  trendDirection: 'increasing' | 'stable' | 'decreasing';
  trendPercentage: number;

  // Engagement
  avgEngagement: number;
  totalEngagement: number;

  // Notable signals
  notableSignals: mongoose.Types.ObjectId[];

  // Last activity
  lastSignalAt?: Date;
  lastEngagedAt?: Date;

  // Status
  isMonitored: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Schema
// ============================================================================

const SignalTrendSchema = new Schema<ISignalTrend>({
  date: { type: Date, required: true },
  count: { type: Number, required: true },
  score: { type: Number, required: true },
}, { _id: false });

const SignalDistributionSchema = new Schema<ISignalDistribution>({
  jobPosting: { type: Number, default: 0 },
  funding: { type: Number, default: 0 },
  news: { type: Number, default: 0 },
  technologyChange: { type: Number, default: 0 },
  expansion: { type: Number, default: 0 },
  executiveChange: { type: Number, default: 0 },
  partnership: { type: Number, default: 0 },
  productLaunch: { type: Number, default: 0 },
  regulatory: { type: Number, default: 0 },
  other: { type: Number, default: 0 },
}, { _id: false });

const CompanySignalsSchema = new Schema<ICompanySignals>({
  tenantId: { type: String, required: true, index: true },
  companyId: { type: String, required: true, unique: true, index: true },
  companyName: { type: String, required: true },

  overallScore: { type: Number, default: 0, min: 0, max: 100 },
  intentStage: {
    type: String,
    enum: ['awareness', 'consideration', 'decision', 'purchase'],
    default: 'awareness',
  },
  intentScore: {
    awareness: { type: Number, default: 0 },
    consideration: { type: Number, default: 0 },
    decision: { type: Number, default: 0 },
    purchase: { type: Number, default: 0 },
  },

  signalCounts: {
    type: SignalDistributionSchema,
    default: () => ({}),
  },
  totalSignals: { type: Number, default: 0 },

  signalTrends: [SignalTrendSchema],
  trendDirection: {
    type: String,
    enum: ['increasing', 'stable', 'decreasing'],
    default: 'stable',
  },
  trendPercentage: { type: Number, default: 0 },

  avgEngagement: { type: Number, default: 0 },
  totalEngagement: { type: Number, default: 0 },

  notableSignals: [{ type: Schema.Types.ObjectId, ref: 'Signal' }],

  lastSignalAt: Date,
  lastEngagedAt: Date,

  isMonitored: { type: Boolean, default: true },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
}, {
  timestamps: true,
});

// Indexes
CompanySignalsSchema.index({ tenantId: 1, overallScore: -1 });
CompanySignalsSchema.index({ tenantId: 1, intentStage: 1 });
CompanySignalsSchema.index({ tenantId: 1, priority: 1 });
CompanySignalsSchema.index({ tenantId: 1, trendDirection: 1 });
CompanySignalsSchema.index({ lastSignalAt: -1 });

// ============================================================================
// Model
// ============================================================================

export const CompanySignalsModel: Model<ICompanySignals> = mongoose.model<ICompanySignals>(
  'CompanySignals',
  CompanySignalsSchema
);
export default CompanySignalsModel;
