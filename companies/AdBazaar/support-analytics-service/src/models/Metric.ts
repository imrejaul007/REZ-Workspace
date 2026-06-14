/**
 * Metric Model - Mongoose schema for aggregated metrics
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IMetric extends Document {
  metricId: string;
  name: string;
  type: string;
  value: number;
  previousValue?: number;
  changePercent?: number;
  period: 'daily' | 'weekly' | 'monthly';
  periodStart: Date;
  periodEnd: Date;
  teamId?: string;
  agentId?: string;
  category?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const metricSchema = new Schema<IMetric>(
  {
    metricId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    type: { type: String, required: true, index: true },
    value: { type: Number, required: true },
    previousValue: Number,
    changePercent: Number,
    period: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true,
    },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    teamId: String,
    agentId: String,
    category: String,
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

// Indexes
metricSchema.index({ name: 1, periodStart: -1 });
metricSchema.index({ agentId: 1, periodStart: -1 });
metricSchema.index({ teamId: 1, periodStart: -1 });

export const Metric = mongoose.model<IMetric>('Metric', metricSchema);
export default Metric;