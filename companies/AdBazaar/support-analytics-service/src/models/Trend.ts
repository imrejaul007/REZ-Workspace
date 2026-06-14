/**
 * Trend Model - Mongoose schema for metric trends
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface ITrend extends Document {
  trendId: string;
  metricName: string;
  direction: 'up' | 'down' | 'stable';
  changePercent: number;
  previousValue: number;
  currentValue: number;
  period: 'daily' | 'weekly' | 'monthly';
  periodStart: Date;
  periodEnd: Date;
  dataPoints: Array<{ date: Date; value: number }>;
  teamId?: string;
  agentId?: string;
  createdAt: Date;
}

const trendSchema = new Schema<ITrend>(
  {
    trendId: { type: String, required: true, unique: true, index: true },
    metricName: { type: String, required: true, index: true },
    direction: {
      type: String,
      enum: ['up', 'down', 'stable'],
      required: true,
    },
    changePercent: { type: Number, required: true },
    previousValue: { type: Number, required: true },
    currentValue: { type: Number, required: true },
    period: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true,
    },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    dataPoints: [
      {
        date: Date,
        value: Number,
      },
    ],
    teamId: String,
    agentId: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
trendSchema.index({ metricName: 1, periodStart: -1 });
trendSchema.index({ teamId: 1, metricName: 1 });
trendSchema.index({ agentId: 1, metricName: 1 });

export const Trend = mongoose.model<ITrend>('Trend', trendSchema);
export default Trend;