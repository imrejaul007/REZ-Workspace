import mongoose, { Document, Schema } from 'mongoose';

export interface CheckResultItem {
  checkId: string;
  contentId: string;
  platform: string;
  score: number;
  status: string;
  violations: number;
}

export interface IComplianceHistory extends Document {
  userId: string;
  checks: CheckResultItem[];
  date: Date;
  totalScore: number;
  totalChecks: number;
  totalViolations: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const CheckResultItemSchema = new Schema<CheckResultItem>(
  {
    checkId: { type: String, required: true },
    contentId: { type: String, required: true },
    platform: { type: String, required: true },
    score: { type: Number, required: true },
    status: { type: String, required: true },
    violations: { type: Number, required: true },
  },
  { _id: false }
);

const ComplianceHistorySchema = new Schema<IComplianceHistory>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    checks: {
      type: [CheckResultItemSchema],
      default: [],
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    totalScore: {
      type: Number,
      required: true,
      default: 100,
    },
    totalChecks: {
      type: Number,
      required: true,
      default: 0,
    },
    totalViolations: {
      type: Number,
      required: true,
      default: 0,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
ComplianceHistorySchema.index({ userId: 1, date: -1 });
ComplianceHistorySchema.index({ date: -1 });

export const ComplianceHistory = mongoose.model<IComplianceHistory>(
  'ComplianceHistory',
  ComplianceHistorySchema
);