/**
 * Analytics Model - Mongoose schema for support analytics
 */

import mongoose, { Document, Schema } from 'mongoose';

export enum MetricType {
  TICKET_VOLUME = 'ticket_volume',
  RESPONSE_TIME = 'response_time',
  RESOLUTION_TIME = 'resolution_time',
  CUSTOMER_SATISFACTION = 'customer_satisfaction',
  FIRST_CONTACT_RESOLUTION = 'first_contact_resolution',
  SLA_COMPLIANCE = 'sla_compliance',
  AGENT_PRODUCTIVITY = 'agent_productivity',
  TAG_USAGE = 'tag_usage',
}

export interface IAnalytics extends Document {
  analyticsId: string;
  type: MetricType;
  value: number;
  unit: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  periodStart: Date;
  periodEnd: Date;
  dimension: string; // e.g., 'team_id', 'agent_id', 'category'
  dimensionValue: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const analyticsSchema = new Schema<IAnalytics>(
  {
    analyticsId: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: Object.values(MetricType),
      required: true,
      index: true,
    },
    value: { type: Number, required: true },
    unit: { type: String, required: true },
    period: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: true,
    },
    periodStart: { type: Date, required: true, index: true },
    periodEnd: { type: Date, required: true },
    dimension: { type: String, required: true, index: true },
    dimensionValue: { type: String, required: true, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

// Indexes
analyticsSchema.index({ type: 1, dimension: 1, periodStart: -1 });
analyticsSchema.index({ dimensionValue: 1, periodStart: -1 });

export const Analytics = mongoose.model<IAnalytics>('Analytics', analyticsSchema);
export default Analytics;