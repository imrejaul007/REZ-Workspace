import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalytics extends Document {
  customerId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  periodStart: Date;
  periodEnd: Date;
  totalSurveys: number;
  totalResponses: number;
  responseRate: number;
  npsScore: number;
  promoters: number;
  passives: number;
  detractors: number;
  avgTimeToRespond: number;
  avgTimeToComplete: number;
  topImprovementAreas: string[];
  trend: 'up' | 'down' | 'stable';
  previousNps?: number;
  change?: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const AnalyticsSchema = new Schema<IAnalytics>(
  {
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    period: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly'],
      required: true,
    },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    totalSurveys: { type: Number, default: 0 },
    totalResponses: { type: Number, default: 0 },
    responseRate: { type: Number, default: 0 },
    npsScore: { type: Number, required: true },
    promoters: { type: Number, default: 0 },
    passives: { type: Number, default: 0 },
    detractors: { type: Number, default: 0 },
    avgTimeToRespond: { type: Number, default: 0 },
    avgTimeToComplete: { type: Number, default: 0 },
    topImprovementAreas: [{ type: String }],
    trend: {
      type: String,
      enum: ['up', 'down', 'stable'],
      default: 'stable',
    },
    previousNps: { type: Number },
    change: { type: Number },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    collection: 'nps_analytics',
  }
);

AnalyticsSchema.index({ customerId: 1, period: 1, periodStart: -1 });
AnalyticsSchema.index({ period: 1, periodStart: -1 });
AnalyticsSchema.index({ npsScore: 1 });

export const AnalyticsModel = mongoose.model<IAnalytics>('NPSAnalytics', AnalyticsSchema);