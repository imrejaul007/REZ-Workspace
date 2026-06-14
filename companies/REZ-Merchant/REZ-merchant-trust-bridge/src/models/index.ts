import mongoose, { Schema, Document } from 'mongoose';
import { TrustScore, CreditLimit, TrustAlert } from '../types';

/**
 * Merchant Trust Score Document
 */
export interface ITrustScoreDocument extends Omit<TrustScore, 'lastUpdated'>, Document {
  lastUpdated: Date;
  syncHistory: Array<{
    timestamp: Date;
    previousScore: number;
    newScore: number;
    source: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const TrustScoreSchema = new Schema<ITrustScoreDocument>(
  {
    merchantId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      required: true,
    },
    factors: {
      paymentHistory: { type: Number, min: 0, max: 100 },
      disputeRate: { type: Number, min: 0, max: 100 },
      complianceScore: { type: Number, min: 0, max: 100 },
      businessAge: { type: Number, min: 0, max: 100 },
      volumeScore: { type: Number, min: 0, max: 100 },
    },
    lastUpdated: {
      type: Date,
      required: true,
    },
    source: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    syncHistory: [
      {
        timestamp: Date,
        previousScore: Number,
        newScore: Number,
        source: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
TrustScoreSchema.index({ riskLevel: 1, score: 1 });
TrustScoreSchema.index({ lastUpdated: 1 });

/**
 * Merchant Credit Limit Document
 */
export interface ICreditLimitDocument extends Omit<CreditLimit, 'lastCalculated' | 'expiresAt'>, Document {
  lastCalculated: Date;
  expiresAt?: Date;
  calculationHistory: Array<{
    timestamp: Date;
    previousLimit: number;
    newLimit: number;
    reason: string;
    trustScore: number;
  }>;
  isBlocked: boolean;
  blockReason?: string;
  blockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CreditLimitSchema = new Schema<ICreditLimitDocument>(
  {
    merchantId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    currentLimit: {
      type: Number,
      required: true,
      min: 0,
    },
    availableLimit: {
      type: Number,
      required: true,
      min: 0,
    },
    usedLimit: {
      type: Number,
      required: true,
      min: 0,
    },
    creditUtilization: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    lastCalculated: {
      type: Date,
      required: true,
    },
    expiresAt: Date,
    calculationHistory: [
      {
        timestamp: Date,
        previousLimit: Number,
        newLimit: Number,
        reason: String,
        trustScore: Number,
      },
    ],
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockReason: String,
    blockedAt: Date,
  },
  {
    timestamps: true,
  }
);

CreditLimitSchema.index({ isBlocked: 1 });
CreditLimitSchema.index({ currentLimit: 1 });

/**
 * Trust Alert Document
 */
export interface ITrustAlertDocument extends Omit<TrustAlert, 'createdAt' | 'acknowledged'>, Document {
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

const TrustAlertSchema = new Schema<ITrustAlertDocument>(
  {
    merchantId: {
      type: String,
      required: true,
      index: true,
    },
    alertType: {
      type: String,
      enum: [
        'TRUST_DROP',
        'RISK_INCREASE',
        'LIMIT_THRESHOLD',
        'BLOCK_TRIGGERED',
        'COMPLIANCE_ISSUE',
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ['INFO', 'WARNING', 'CRITICAL'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    previousScore: Number,
    currentScore: Number,
    createdAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    acknowledged: {
      type: Boolean,
      default: false,
    },
    acknowledgedBy: String,
    acknowledgedAt: Date,
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
TrustAlertSchema.index({ merchantId: 1, createdAt: -1 });
TrustAlertSchema.index({ alertType: 1, severity: 1 });
TrustAlertSchema.index({ acknowledged: 1, createdAt: -1 });

/**
 * Sync Log Document - Track all sync operations
 */
export interface ISyncLogDocument extends Document {
  merchantId: string;
  source: string;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  startTime: Date;
  endTime?: Date;
  recordsProcessed: number;
  recordsUpdated: number;
  recordsFailed: number;
  errorMessage?: string;
  errorDetails?: unknown;
  createdAt: Date;
}

const SyncLogSchema = new Schema<ISyncLogDocument>(
  {
    merchantId: String,
    source: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'PARTIAL'],
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime: Date,
    recordsProcessed: {
      type: Number,
      default: 0,
    },
    recordsUpdated: {
      type: Number,
      default: 0,
    },
    recordsFailed: {
      type: Number,
      default: 0,
    },
    errorMessage: String,
    errorDetails: Schema.Types.Mixed,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

SyncLogSchema.index({ source: 1, status: 1 });
SyncLogSchema.index({ createdAt: -1 });

// Export models
export const TrustScoreModel = mongoose.model<ITrustScoreDocument>('TrustScore', TrustScoreSchema);
export const CreditLimitModel = mongoose.model<ICreditLimitDocument>('CreditLimit', CreditLimitSchema);
export const TrustAlertModel = mongoose.model<ITrustAlertDocument>('TrustAlert', TrustAlertSchema);
export const SyncLogModel = mongoose.model<ISyncLogDocument>('SyncLog', SyncLogSchema);
