import mongoose, { Document, Schema } from 'mongoose';

export interface ISpendAnalytics extends Document {
  _id: mongoose.Types.ObjectId;
  analyticsId: string;
  clientId: string;
  period: {
    start: Date;
    end: Date;
    type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  };
  budget: {
    allocated: number;
    spent: number;
    remaining: number;
    utilizationRate: number;
  };
  spend: {
    total: number;
    byChannel: Record<string, number>;
    byCampaign: Record<string, number>;
    daily: number[];
  };
  projections: {
    endOfPeriod: number;
    confidence: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  };
  benchmarks: {
    industryAverage: number;
    clientVsBenchmark: number;
    percentile: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SpendAnalyticsSchema = new Schema<ISpendAnalytics>(
  {
    analyticsId: { type: String, required: true, unique: true, index: true },
    clientId: { type: String, required: true, index: true },
    period: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
      type: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
        required: true,
      },
    },
    budget: {
      allocated: { type: Number, default: 0 },
      spent: { type: Number, default: 0 },
      remaining: { type: Number, default: 0 },
      utilizationRate: { type: Number, default: 0 },
    },
    spend: {
      total: { type: Number, default: 0 },
      byChannel: { type: Map, of: Number, default: {} },
      byCampaign: { type: Map, of: Number, default: {} },
      daily: [{ type: Number, default: 0 }],
    },
    projections: {
      endOfPeriod: { type: Number, default: 0 },
      confidence: { type: Number, default: 0 },
      trend: {
        type: String,
        enum: ['increasing', 'stable', 'decreasing'],
        default: 'stable',
      },
    },
    benchmarks: {
      industryAverage: { type: Number, default: 0 },
      clientVsBenchmark: { type: Number, default: 0 },
      percentile: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Indexes
SpendAnalyticsSchema.index({ clientId: 1, 'period.start': -1 });
SpendAnalyticsSchema.index({ clientId: 1, 'period.type': 1 });
SpendAnalyticsSchema.index({ clientId: 1, 'period.end': -1 });

export const SpendAnalytics = mongoose.model<ISpendAnalytics>('SpendAnalytics', SpendAnalyticsSchema);