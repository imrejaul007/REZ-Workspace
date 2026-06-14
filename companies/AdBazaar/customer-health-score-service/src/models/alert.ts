import mongoose, { Schema, Document } from 'mongoose';

export interface IAlert extends Document {
  customerId: string;
  type: 'score_drop' | 'risk_increase' | 'milestone' | 'engagement_drop' | 'payment_issue';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  scoreValue?: number;
  previousScore?: number;
  change?: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  actionTaken?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const AlertSchema = new Schema<IAlert>(
  {
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['score_drop', 'risk_increase', 'milestone', 'engagement_drop', 'payment_issue'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    scoreValue: {
      type: Number,
    },
    previousScore: {
      type: Number,
    },
    change: {
      type: Number,
    },
    acknowledged: {
      type: Boolean,
      default: false,
    },
    acknowledgedBy: {
      type: String,
    },
    acknowledgedAt: {
      type: Date,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    resolvedBy: {
      type: String,
    },
    resolvedAt: {
      type: Date,
    },
    actionTaken: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'health_alerts',
  }
);

// Indexes
AlertSchema.index({ customerId: 1, acknowledged: 1 });
AlertSchema.index({ customerId: 1, resolved: 1 });
AlertSchema.index({ severity: 1, createdAt: -1 });
AlertSchema.index({ type: 1, createdAt: -1 });
AlertSchema.index({ resolved: 1, createdAt: -1 });

export const AlertModel = mongoose.model<IAlert>('Alert', AlertSchema);
