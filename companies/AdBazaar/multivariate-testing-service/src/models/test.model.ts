import mongoose, { Document, Schema } from 'mongoose';

export interface ITest extends Document {
  testId: string;
  name: string;
  description?: string;
  hypothesis?: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'archived';
  type: 'ab' | 'multivariate' | 'bandit';
  startDate?: Date;
  endDate?: Date;
  trafficAllocation: number; // Percentage 0-100
  targetAudience?: {
    segments?: string[];
    countries?: string[];
    platforms?: string[];
  };
  primaryMetric: 'ctr' | 'conversion' | 'revenue' | 'engagement' | 'custom';
  secondaryMetrics?: string[];
  minimumSampleSize?: number;
  confidenceLevel: number; // e.g., 0.95
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const testSchema = new Schema<ITest>(
  {
    testId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    hypothesis: { type: String },
    status: {
      type: String,
      enum: ['draft', 'running', 'paused', 'completed', 'archived'],
      default: 'draft'
    },
    type: {
      type: String,
      enum: ['ab', 'multivariate', 'bandit'],
      default: 'ab'
    },
    startDate: { type: Date },
    endDate: { type: Date },
    trafficAllocation: { type: Number, default: 100, min: 1, max: 100 },
    targetAudience: {
      segments: [String],
      countries: [String],
      platforms: [String]
    },
    primaryMetric: {
      type: String,
      enum: ['ctr', 'conversion', 'revenue', 'engagement', 'custom'],
      default: 'conversion'
    },
    secondaryMetrics: [String],
    minimumSampleSize: { type: Number, default: 1000 },
    confidenceLevel: { type: Number, default: 0.95 },
    createdBy: { type: String, required: true }
  },
  { timestamps: true }
);

testSchema.index({ testId: 1 });
testSchema.index({ status: 1 });
testSchema.index({ createdBy: 1 });

export const Test = mongoose.model<ITest>('Test', testSchema);