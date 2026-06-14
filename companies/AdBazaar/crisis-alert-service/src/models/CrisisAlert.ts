/**
 * CrisisAlert Model - Mongoose schema for crisis alerts
 */

import mongoose, { Document, Schema } from 'mongoose';

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum AlertType {
  NEGATIVE_SENTIMENT = 'negative_sentiment',
  VIRAL_NEGATIVE = 'viral_negative',
  COMPETITOR_CRISIS = 'competitor_crisis',
  MENTION_SPIKE = 'mention_spike',
  INFLUENCER_CRISIS = 'influencer_crisis',
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  ESCALATED = 'escalated',
  RESOLVED = 'resolved',
}

export interface ISource {
  platform: string;
  postId?: string;
  postUrl?: string;
  authorUsername?: string;
}

export interface IMetrics {
  mentions: number;
  sentiment: number; // -100 to 100
  reach?: number;
  velocity?: number; // mentions per hour
}

export interface ICrisisAlert extends Document {
  alertId: string;
  severity: AlertSeverity;
  type: AlertType;
  title: string;
  description: string;
  source: ISource;
  metrics: IMetrics;
  affectedBrand?: string;
  status: AlertStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  escalatedTo?: string[];
  resolvedAt?: Date;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
}

const sourceSchema = new Schema<ISource>(
  {
    platform: { type: String, required: true },
    postId: String,
    postUrl: String,
    authorUsername: String,
  },
  { _id: false }
);

const metricsSchema = new Schema<IMetrics>(
  {
    mentions: { type: Number, required: true, default: 0 },
    sentiment: { type: Number, required: true, default: 0, min: -100, max: 100 },
    reach: Number,
    velocity: Number,
  },
  { _id: false }
);

const crisisAlertSchema = new Schema<ICrisisAlert>(
  {
    alertId: { type: String, required: true, unique: true, index: true },
    severity: {
      type: String,
      enum: Object.values(AlertSeverity),
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(AlertType),
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    source: { type: sourceSchema, required: true },
    metrics: { type: metricsSchema, required: true },
    affectedBrand: { type: String, index: true },
    status: {
      type: String,
      enum: Object.values(AlertStatus),
      default: AlertStatus.ACTIVE,
      index: true,
    },
    acknowledgedBy: String,
    acknowledgedAt: Date,
    escalatedTo: [{ type: String }],
    resolvedAt: Date,
    resolution: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
crisisAlertSchema.index({ status: 1, createdAt: -1 });
crisisAlertSchema.index({ severity: 1, status: 1 });
crisisAlertSchema.index({ type: 1, status: 1 });
crisisAlertSchema.index({ affectedBrand: 1, status: 1 });
crisisAlertSchema.index({ 'metrics.sentiment':1 });
crisisAlertSchema.index({ 'metrics.mentions': -1 });

export const CrisisAlert = mongoose.model<ICrisisAlert>('CrisisAlert', crisisAlertSchema);
export default CrisisAlert;
