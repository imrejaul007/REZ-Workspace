import mongoose, { Schema, Document } from 'mongoose';

export interface IHealthScore extends Document {
  customerId: string;
  overallScore: number;
  engagementScore: number;
  usageScore: number;
  paymentScore: number;
  supportScore: number;
  adoptionScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastCalculated: Date;
  nextScheduledCalculation: Date;
  factors: {
    name: string;
    value: number;
    weight: number;
    description: string;
  }[];
  trends: {
    date: Date;
    score: number;
    change: number;
  }[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const HealthScoreSchema = new Schema<IHealthScore>(
  {
    customerId: {
      type: String,
      required: true,
      unique: true,
      index: true,
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
      min: 0,
      max: 100,
    },
    usageScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    paymentScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    supportScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    adoptionScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
    },
    lastCalculated: {
      type: Date,
      required: true,
    },
    nextScheduledCalculation: {
      type: Date,
      required: true,
    },
    factors: [{
      name: { type: String, required: true },
      value: { type: Number, required: true },
      weight: { type: Number, required: true },
      description: { type: String },
    }],
    trends: [{
      date: { type: Date, required: true },
      score: { type: Number, required: true },
      change: { type: Number, required: true },
    }],
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'health_scores',
  }
);

// Indexes
HealthScoreSchema.index({ customerId: 1 });
HealthScoreSchema.index({ riskLevel: 1 });
HealthScoreSchema.index({ overallScore: 1 });
HealthScoreSchema.index({ lastCalculated: 1 });
HealthScoreSchema.index({ nextScheduledCalculation: 1 });

export const HealthScoreModel = mongoose.model<IHealthScore>('HealthScore', HealthScoreSchema);
