import { Schema, model, Document, Types } from 'mongoose';

export interface IAnomalyMonitor extends Document {
  userId?: Types.ObjectId;
  merchantId?: Types.ObjectId;
  type: string;
  coinsEarned?: number;
  windowMinutes?: number;
  value?: number;
  threshold?: number;
  flaggedAt: Date;
  status: 'monitoring' | 'reviewed' | 'dismissed' | 'escalated';
  reviewedBy?: string;
  reviewedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AnomalyMonitorSchema = new Schema<IAnomalyMonitor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', index: true },
    type: { type: String, required: true, index: true },
    coinsEarned: { type: Number },
    windowMinutes: { type: Number },
    value: { type: Number },
    threshold: { type: Number },
    flaggedAt: { type: Date, required: true, default: Date.now },
    status: {
      type: String,
      enum: ['monitoring', 'reviewed', 'dismissed', 'escalated'],
      default: 'monitoring',
      index: true,
    },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true },
);

AnomalyMonitorSchema.index({ merchantId: 1, status: 1, flaggedAt: -1 });

export const AnomalyMonitor = model<IAnomalyMonitor>('AnomalyMonitor', AnomalyMonitorSchema);
export default AnomalyMonitor;
