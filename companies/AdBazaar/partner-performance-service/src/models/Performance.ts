import mongoose, { Schema, Document } from 'mongoose';

export interface IPerformance extends Document {
  performanceId: string;
  partnerId: string;
  period: {
    start: Date;
    end: Date;
    type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  };
  metrics: {
    revenue: number;
    conversions: number;
    clicks: number;
    impressions: number;
    ctr: number;
    conversionRate: number;
    avgOrderValue: number;
    totalSpend: number;
    roi: number;
  };
  comparison: {
    previousPeriod: {
      revenue: number;
      conversions: number;
      clicks: number;
    };
    percentChange: {
      revenue: number;
      conversions: number;
      clicks: number;
      ctr: number;
      conversionRate: number;
    };
  };
  rankings: {
    tier: string;
    categoryRank: number;
    overallRank: number;
    performanceScore: number;
  };
  trends: Array<{
    date: Date;
    revenue: number;
    conversions: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const PerformanceSchema = new Schema<IPerformance>(
  {
    performanceId: { type: String, required: true, unique: true, index: true },
    partnerId: { type: String, required: true, index: true },
    period: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
      type: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
        required: true,
      },
    },
    metrics: {
      revenue: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      impressions: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 },
      avgOrderValue: { type: Number, default: 0 },
      totalSpend: { type: Number, default: 0 },
      roi: { type: Number, default: 0 },
    },
    comparison: {
      previousPeriod: {
        revenue: { type: Number, default: 0 },
        conversions: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 },
      },
      percentChange: {
        revenue: { type: Number, default: 0 },
        conversions: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 },
        ctr: { type: Number, default: 0 },
        conversionRate: { type: Number, default: 0 },
      },
    },
    rankings: {
      tier: { type: String, default: 'bronze' },
      categoryRank: { type: Number, default: 0 },
      overallRank: { type: Number, default: 0 },
      performanceScore: { type: Number, default: 0 },
    },
    trends: [{
      date: { type: Date, required: true },
      revenue: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
    }],
  },
  { timestamps: true }
);

PerformanceSchema.index({ partnerId: 1, 'period.start': -1 });
PerformanceSchema.index({ 'period.type': 1, 'period.start': -1 });

export const Performance = mongoose.model<IPerformance>('Performance', PerformanceSchema);