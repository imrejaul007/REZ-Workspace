import mongoose, { Schema, Document } from 'mongoose';
import { MatchType, MatchStatus } from '../types';

export interface IMatchSegmentResult extends Document {
  name: string;
  total: number;
  matched: number;
  matchRate: number;
}

export interface IMatchJob extends Document {
  matchId: string;
  uploadId: string;
  brandId: string;
  matchType: MatchType;
  matchThreshold: number;
  privacyBudget: number;
  status: MatchStatus;
  uploadedRecords: number;
  matchedRecords: number;
  matchRate: number;
  segments: Array<{
    name: string;
    total: number;
    matched: number;
    matchRate: number;
  }>;
  matchRateBySegment: Record<string, number>;
  processingTimeMs: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const MatchJobSchema = new Schema<IMatchJob>(
  {
    matchId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    uploadId: {
      type: String,
      required: true,
      index: true,
    },
    brandId: {
      type: String,
      required: true,
      index: true,
    },
    matchType: {
      type: String,
      enum: ['deterministic', 'probabilistic', 'hybrid'],
      default: 'deterministic',
    },
    matchThreshold: {
      type: Number,
      default: 0.7,
    },
    privacyBudget: {
      type: Number,
      default: 1.0,
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed'],
      default: 'pending',
    },
    uploadedRecords: {
      type: Number,
      default: 0,
    },
    matchedRecords: {
      type: Number,
      default: 0,
    },
    matchRate: {
      type: Number,
      default: 0,
    },
    segments: [{
      name: String,
      total: Number,
      matched: Number,
      matchRate: Number,
    }],
    matchRateBySegment: {
      type: Map,
      of: Number,
    },
    processingTimeMs: {
      type: Number,
      default: 0,
    },
    errorMessage: String,
    completedAt: Date,
  },
  {
    timestamps: true,
    collection: 'match_jobs',
  }
);

// Indexes
MatchJobSchema.index({ uploadId: 1, createdAt: -1 });
MatchJobSchema.index({ brandId: 1, createdAt: -1 });
MatchJobSchema.index({ status: 1 });
MatchJobSchema.index({ createdAt: -1 });

export const MatchJob = mongoose.model<IMatchJob>('MatchJob', MatchJobSchema);