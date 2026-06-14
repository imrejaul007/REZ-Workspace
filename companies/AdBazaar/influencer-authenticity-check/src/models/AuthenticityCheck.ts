import mongoose, { Document, Schema } from 'mongoose';
import { Platform, CheckStatus, RiskLevel } from '../utils/validators';

// Score breakdown for authenticity check
export interface IScoreBreakdown {
  followerQuality: number;
  engagementAuthenticity: number;
  historicalPattern: number;
  botLikelihood: number;
}

// Recommendations from the check
export interface IRecommendation {
  category: string;
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  action: string;
}

export interface IAuthenticityCheck extends Document {
  influencerId: string;
  platform: Platform;
  username: string;
  date: Date;
  status: CheckStatus;
  scores: {
    followerQuality: number;
    engagementAuthenticity: number;
    historicalPattern: number;
    botLikelihood: number;
  };
  overallScore: number;
  riskLevel: RiskLevel;
  breakdown: IScoreBreakdown;
  recommendations: IRecommendation[];
  flags: string[];
  rawData: Record<string, unknown>;
  processingTime: number; // in milliseconds
  createdAt: Date;
  updatedAt: Date;
}

const RecommendationSchema = new Schema<IRecommendation>(
  {
    category: { type: String, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    action: { type: String, required: true },
  },
  { _id: false }
);

const AuthenticityCheckSchema = new Schema<IAuthenticityCheck>(
  {
    influencerId: {
      type: String,
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ['instagram', 'youtube', 'twitter', 'tiktok', 'facebook', 'linkedin'],
      required: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed'],
      default: 'pending',
    },
    scores: {
      followerQuality: { type: Number, min: 0, max: 100, default: 50 },
      engagementAuthenticity: { type: Number, min: 0, max: 100, default: 50 },
      historicalPattern: { type: Number, min: 0, max: 100, default: 50 },
      botLikelihood: { type: Number, min: 0, max: 100, default: 50 },
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    breakdown: {
      followerQuality: { type: Number, min: 0, max: 100, default: 50 },
      engagementAuthenticity: { type: Number, min: 0, max: 100, default: 50 },
      historicalPattern: { type: Number, min: 0, max: 100, default: 50 },
      botLikelihood: { type: Number, min: 0, max: 100, default: 50 },
    },
    recommendations: [RecommendationSchema],
    flags: [String],
    rawData: { type: Schema.Types.Mixed, default: {} },
    processingTime: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
AuthenticityCheckSchema.index({ influencerId: 1, date: -1 });
AuthenticityCheckSchema.index({ platform: 1, riskLevel: 1 });
AuthenticityCheckSchema.index({ status: 1, createdAt: -1 });

// Instance method to get score grade
AuthenticityCheckSchema.methods.getScoreGrade = function (): string {
  if (this.overallScore >= 80) return 'A';
  if (this.overallScore >= 60) return 'B';
  if (this.overallScore >= 40) return 'C';
  if (this.overallScore >= 20) return 'D';
  return 'F';
};

// Instance method to check if high risk
AuthenticityCheckSchema.methods.isHighRisk = function (): boolean {
  return this.riskLevel === 'high' || this.riskLevel === 'critical';
};

export const AuthenticityCheck = mongoose.model<IAuthenticityCheck>('AuthenticityCheck', AuthenticityCheckSchema);