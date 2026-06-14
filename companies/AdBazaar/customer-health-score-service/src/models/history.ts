import mongoose, { Schema, Document } from 'mongoose';

export interface IHistory extends Document {
  customerId: string;
  date: Date;
  overallScore: number;
  engagementScore: number;
  usageScore: number;
  paymentScore: number;
  supportScore: number;
  adoptionScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  metrics: {
    name: string;
    value: number;
    previousValue: number;
  }[];
  factors: {
    name: string;
    value: number;
    weight: number;
  }[];
  calculatedBy: string;
  calculationDuration: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const HistorySchema = new Schema<IHistory>(
  {
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    engagementScore: {
      type: Number,
      required: true,
    },
    usageScore: {
      type: Number,
      required: true,
    },
    paymentScore: {
      type: Number,
      required: true,
    },
    supportScore: {
      type: Number,
      required: true,
    },
    adoptionScore: {
      type: Number,
      required: true,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
    },
    metrics: [{
      name: { type: String, required: true },
      value: { type: Number, required: true },
      previousValue: { type: Number, required: true },
    }],
    factors: [{
      name: { type: String, required: true },
      value: { type: Number, required: true },
      weight: { type: Number, required: true },
    }],
    calculatedBy: {
      type: String,
      required: true,
    },
    calculationDuration: {
      type: Number,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'health_score_history',
  }
);

// Indexes
HistorySchema.index({ customerId: 1, date: -1 });
HistorySchema.index({ date: -1 });
HistorySchema.index({ overallScore: 1 });
HistorySchema.index({ riskLevel: 1 });

// TTL index to auto-expire old history (5 years)
HistorySchema.index({ date: 1 }, { expireAfterSeconds: 5 * 365 * 24 * 60 * 60 });

export const HistoryModel = mongoose.model<IHistory>('HealthScoreHistory', HistorySchema);
