import mongoose, { Document, Schema } from 'mongoose';

export interface ITest extends Document {
  testId: string;
  name: string;
  description: string;
  companyId: string;
  type: 'ab' | 'multivariate' | 'bandit';
  status: 'draft' | 'running' | 'paused' | 'completed' | 'archived';
  hypothesis?: string;
  primaryMetric: string;
  secondaryMetrics: string[];
  targetAudience: {
    userIds?: string[];
    segments?: string[];
    percentage: number;
  };
  startDate?: Date;
  endDate?: Date;
  minSampleSize: number;
  confidenceLevel: number;
  winnerId?: string;
  winnerReason?: string;
  metadata?: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const TestSchema = new Schema<ITest>(
  {
    testId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    companyId: { type: String, required: true, index: true },
    type: { type: String, enum: ['ab', 'multivariate', 'bandit'], required: true },
    status: { type: String, enum: ['draft', 'running', 'paused', 'completed', 'archived'], default: 'draft' },
    hypothesis: { type: String },
    primaryMetric: { type: String, required: true },
    secondaryMetrics: [{ type: String }],
    targetAudience: {
      userIds: [{ type: String }],
      segments: [{ type: String }],
      percentage: { type: Number, default: 100 }
    },
    startDate: { type: Date },
    endDate: { type: Date },
    minSampleSize: { type: Number, default: 1000 },
    confidenceLevel: { type: Number, default: 0.95 },
    winnerId: { type: String },
    winnerReason: { type: String },
    metadata: { type: Schema.Types.Mixed },
    createdBy: { type: String, required: true }
  },
  { timestamps: true }
);

TestSchema.index({ companyId: 1, status: 1 });
TestSchema.index({ startDate: 1, endDate: 1 });

export const Test = mongoose.model<ITest>('Test', TestSchema);