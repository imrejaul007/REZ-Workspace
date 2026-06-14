import mongoose, { Document, Schema } from 'mongoose';
import { Platform } from './ComplianceRule.js';

export type CheckStatus = 'pending' | 'passed' | 'warning' | 'failed' | 'error';

export interface Violation {
  ruleId: string;
  ruleName: string;
  type: string;
  severity: string;
  description: string;
  matchedContent: string;
  position: {
    start: number;
    end: number;
  };
  action: string;
  autoFixAvailable: boolean;
}

export interface CheckResult {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  details?: string;
}

export interface IComplianceCheck extends Document {
  contentId: string;
  content: {
    text: string;
    imageUrls?: string[];
    videoUrl?: string;
    metadata?: Record<string, unknown>;
  };
  platform: Platform;
  rules: CheckResult[];
  violations: Violation[];
  score: number;
  status: CheckStatus;
  checkedAt: Date;
  userId?: string;
  sessionId?: string;
  processingTimeMs?: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ViolationSchema = new Schema<Violation>(
  {
    ruleId: { type: String, required: true },
    ruleName: { type: String, required: true },
    type: { type: String, required: true },
    severity: { type: String, required: true },
    description: { type: String, required: true },
    matchedContent: { type: String, required: true },
    position: {
      start: { type: Number, required: true },
      end: { type: Number, required: true },
    },
    action: { type: String, required: true },
    autoFixAvailable: { type: Boolean, default: true },
  },
  { _id: false }
);

const CheckResultSchema = new Schema<CheckResult>(
  {
    ruleId: { type: String, required: true },
    ruleName: { type: String, required: true },
    passed: { type: Boolean, required: true },
    details: { type: String },
  },
  { _id: false }
);

const ComplianceCheckSchema = new Schema<IComplianceCheck>(
  {
    contentId: {
      type: String,
      required: true,
      index: true,
    },
    content: {
      text: { type: String, required: true },
      imageUrls: { type: [String], default: [] },
      videoUrl: { type: String },
      metadata: { type: Schema.Types.Mixed },
    },
    platform: {
      type: String,
      required: true,
      enum: [
        'instagram',
        'facebook',
        'twitter',
        'youtube',
        'tiktok',
        'linkedin',
        'all',
      ],
      index: true,
    },
    rules: [CheckResultSchema],
    violations: [ViolationSchema],
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 100,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'passed', 'warning', 'failed', 'error'],
      default: 'pending',
      index: true,
    },
    checkedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
    },
    processingTimeMs: {
      type: Number,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
ComplianceCheckSchema.index({ userId: 1, checkedAt: -1 });
ComplianceCheckSchema.index({ status: 1, checkedAt: -1 });
ComplianceCheckSchema.index({ score: 1, checkedAt: -1 });

export const ComplianceCheck = mongoose.model<IComplianceCheck>(
  'ComplianceCheck',
  ComplianceCheckSchema
);