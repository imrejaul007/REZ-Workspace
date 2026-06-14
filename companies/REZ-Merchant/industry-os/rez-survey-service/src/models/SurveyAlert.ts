import mongoose, { Schema, Document } from 'mongoose';

export interface ISurveyAlert extends Document {
  alertId: string;
  hotelId: string;
  type: 'low_nps' | 'detractor' | 'urgent_comment' | 'response_spike';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  status: 'new' | 'acknowledged' | 'resolved';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
}

const SurveyAlertSchema = new Schema<ISurveyAlert>(
  {
    alertId: { type: String, required: true, unique: true, index: true },
    hotelId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['low_nps', 'detractor', 'urgent_comment', 'response_spike'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['new', 'acknowledged', 'resolved'],
      default: 'new',
      index: true,
    },
    acknowledgedBy: String,
    acknowledgedAt: Date,
    resolvedBy: String,
    resolvedAt: Date,
  },
  { timestamps: true }
);

SurveyAlertSchema.index({ hotelId: 1, status: 1, severity: 1 });
SurveyAlertSchema.index({ createdAt: -1 });

export const SurveyAlert = mongoose.model<ISurveyAlert>('SurveyAlert', SurveyAlertSchema);
