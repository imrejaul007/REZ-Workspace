import mongoose, { Schema, Document, Model } from 'mongoose';
import { ISSOLog, SSOAction, SSOProvider } from '../types';

export interface SSOLogDocument extends Omit<ISSOLog, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const SSOLogSchema = new Schema<SSOLogDocument>(
  {
    logId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      enum: ['google', 'microsoft', 'saml', 'ldap', 'oidc'],
    },
    action: {
      type: String,
      required: true,
      enum: [
        'login_attempt',
        'login_success',
        'login_failure',
        'logout',
        'token_refresh',
        'user_provisioned',
        'user_updated',
        'user_deprovisioned',
        'config_updated',
        'config_verified',
        'saml_assertion_validated',
        'saml_assertion_failed',
      ],
    },
    status: {
      type: String,
      required: true,
      enum: ['success', 'failure', 'pending'],
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    errorCode: {
      type: String,
    },
    errorMessage: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // We use our own timestamp field
    collection: 'sso_logs',
  }
);

// Compound indexes
SSOLogSchema.index({ companyId: 1, timestamp: -1 });
SSOLogSchema.index({ userId: 1, timestamp: -1 });
SSOLogSchema.index({ companyId: 1, action: 1, timestamp: -1 });
SSOLogSchema.index({ status: 1, timestamp: -1 });

// TTL index - keep logs for 90 days
SSOLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

// Static to find recent logs
SSOLogSchema.statics.findRecent = async function (
  companyId: string,
  options?: {
    userId?: string;
    action?: SSOAction;
    status?: 'success' | 'failure' | 'pending';
    limit?: number;
  }
): Promise<SSOLogDocument[]> {
  const query: Record<string, unknown> = { companyId };

  if (options?.userId) query.userId = options.userId;
  if (options?.action) query.action = options.action;
  if (options?.status) query.status = options.status;

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(options?.limit || 100);
};

// Static to find failed login attempts
SSOLogSchema.statics.findFailedLogins = async function (
  companyId: string,
  since: Date
): Promise<SSOLogDocument[]> {
  return this.find({
    companyId,
    action: { $in: ['login_attempt', 'login_failure'] },
    status: 'failure',
    timestamp: { $gte: since },
  }).sort({ timestamp: -1 });
};

// Static to get login statistics
SSOLogSchema.statics.getLoginStats = async function (
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalAttempts: number;
  successfulLogins: number;
  failedLogins: number;
  uniqueUsers: number;
}> {
  const pipeline = [
    {
      $match: {
        companyId,
        action: { $in: ['login_attempt', 'login_success', 'login_failure'] },
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        successfulLogins: {
          $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
        },
        failedLogins: {
          $sum: { $cond: [{ $eq: ['$status', 'failure'] }, 1, 0] },
        },
        uniqueUsers: { $addToSet: '$userId' },
      },
    },
    {
      $project: {
        totalAttempts: 1,
        successfulLogins: 1,
        failedLogins: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
      },
    },
  ];

  const result = await this.aggregate(pipeline);

  if (result.length === 0) {
    return {
      totalAttempts: 0,
      successfulLogins: 0,
      failedLogins: 0,
      uniqueUsers: 0,
    };
  }

  return result[0];
};

export const SSOLog: Model<SSOLogDocument> = mongoose.model<SSOLogDocument>(
  'SSOLog',
  SSOLogSchema
);
