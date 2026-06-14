import mongoose, { Schema, Document } from 'mongoose';

export type MetricType = 'revenue' | 'conversion' | 'engagement' | 'roi' | 'satisfaction';
export type MetricPeriod = 'realtime' | 'daily' | 'weekly' | 'monthly';

export interface IMetric extends Document {
  metricId: string;
  partnerId: string;
  type: MetricType;
  name: string;
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  period: MetricPeriod;
  periodStart: Date;
  periodEnd: Date;
  benchmarks: {
    industry: number;
    top25: number;
    top10: number;
  };
  breakdown: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const MetricSchema = new Schema<IMetric>(
  {
    metricId: { type: String, required: true, unique: true, index: true },
    partnerId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['revenue', 'conversion', 'engagement', 'roi', 'satisfaction'],
      required: true,
    },
    name: { type: String, required: true },
    value: { type: Number, required: true },
    previousValue: { type: Number, default: 0 },
    change: { type: Number, default: 0 },
    changePercent: { type: Number, default: 0 },
    period: {
      type: String,
      enum: ['realtime', 'daily', 'weekly', 'monthly'],
      required: true,
    },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    benchmarks: {
      industry: { type: Number, default: 0 },
      top25: { type: Number, default: 0 },
      top10: { type: Number, default: 0 },
    },
    breakdown: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

MetricSchema.index({ partnerId: 1, type: 1, periodEnd: -1 });
MetricSchema.index({ type: 1, periodEnd: -1 });

export const Metric = mongoose.model<IMetric>('Metric', MetricSchema);