import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAnalytics extends Document {
  broadcastId: Types.ObjectId;
  timestamp: Date;
  metrics: {
    sent: number;
    delivered: number;
    failed: number;
    bounced: number;
    opened: number;
    clicked: number;
    unsubscribed: number;
  };
  byChannel?: {
    email?: { sent: number; delivered: number; opened: number; clicked: number };
    sms?: { sent: number; delivered: number; failed: number };
    push?: { sent: number; delivered: number; opened: number };
    inApp?: { sent: number; delivered: number };
  };
  createdAt: Date;
}

const AnalyticsSchema = new Schema<IAnalytics>(
  {
    broadcastId: { type: Schema.Types.ObjectId, ref: 'Broadcast', required: true, index: true },
    timestamp: { type: Date, default: Date.now },
    metrics: {
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      bounced: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      unsubscribed: { type: Number, default: 0 },
    },
    byChannel: {
      email: Schema.Types.Mixed,
      sms: Schema.Types.Mixed,
      push: Schema.Types.Mixed,
      inApp: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

AnalyticsSchema.index({ broadcastId: 1, timestamp: -1 });

export const Analytics = mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);