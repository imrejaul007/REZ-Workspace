import mongoose, { Schema, Document } from 'mongoose';

/**
 * Error types for automation exceptions
 */
export type ExceptionErrorType =
  | 'validation'
  | 'api_error'
  | 'timeout'
  | 'rate_limit'
  | 'invalid_data'
  | 'auth_error'
  | 'unknown';

/**
 * AI decision actions for handling exceptions
 */
export type ExceptionAction =
  | 'retry'
  | 'skip'
  | 'human'
  | 'escalate'
  | 'fallback';

/**
 * Exception status
 */
export type ExceptionStatus = 'pending' | 'processing' | 'resolved' | 'escalated' | 'ignored';

/**
 * AI decision for exception handling
 */
export interface IAIDecision {
  action: ExceptionAction;
  confidence: number;
  reasoning: string;
  adjustedParams?: Record<string, unknown>;
  suggestedChannel?: string;
  estimatedRetryDelay?: number;
}

/**
 * Automation exception interface
 */
export interface IAutomationException {
  ruleId: string;
  stepId: string;
  executionId: string;
  errorType: ExceptionErrorType;
  errorMessage: string;
  errorStack?: string;
  originalParams: Record<string, unknown>;
  failedAt: Date;
  retryCount: number;
  maxRetries: number;
  aiDecision?: IAIDecision;
  status: ExceptionStatus;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Mongoose document interface for Exception
 */
export interface IExceptionDocument extends IAutomationException, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Exception schema
 */
const ExceptionSchema = new Schema<IExceptionDocument>(
  {
    ruleId: {
      type: String,
      required: true,
      index: true,
    },
    stepId: {
      type: String,
      required: true,
      index: true,
    },
    executionId: {
      type: String,
      required: true,
      index: true,
    },
    errorType: {
      type: String,
      enum: ['validation', 'api_error', 'timeout', 'rate_limit', 'invalid_data', 'auth_error', 'unknown'],
      required: true,
      index: true,
    },
    errorMessage: {
      type: String,
      required: true,
    },
    errorStack: {
      type: String,
    },
    originalParams: {
      type: Schema.Types.Mixed,
      required: true,
    },
    failedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    retryCount: {
      type: Number,
      required: true,
      default: 0,
    },
    maxRetries: {
      type: Number,
      required: true,
      default: 3,
    },
    aiDecision: {
      action: {
        type: String,
        enum: ['retry', 'skip', 'human', 'escalate', 'fallback'],
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1,
      },
      reasoning: {
        type: String,
      },
      adjustedParams: {
        type: Schema.Types.Mixed,
      },
      suggestedChannel: {
        type: String,
      },
      estimatedRetryDelay: {
        type: Number,
      },
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'resolved', 'escalated', 'ignored'],
      required: true,
      default: 'pending',
      index: true,
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: String,
    },
    resolution: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    collection: 'automation_exceptions',
  }
);

// Indexes for efficient querying
ExceptionSchema.index({ status: 1, failedAt: -1 });
ExceptionSchema.index({ ruleId: 1, status: 1 });
ExceptionSchema.index({ executionId: 1, stepId: 1 });
ExceptionSchema.index({ 'aiDecision.action': 1, createdAt: -1 });

/**
 * Instance methods
 */
ExceptionSchema.methods = {
  /**
   * Check if exception can be retried
   */
  canRetry(): boolean {
    return this.retryCount < this.maxRetries && this.status === 'pending';
  },

  /**
   * Mark exception as resolved
   */
  resolve(resolvedBy: string, resolution: string): void {
    this.status = 'resolved';
    this.resolvedAt = new Date();
    this.resolvedBy = resolvedBy;
    this.resolution = resolution;
  },

  /**
   * Mark exception as escalated
   */
  escalate(): void {
    this.status = 'escalated';
  },

  /**
   * Check if human intervention is needed
   */
  needsHumanIntervention(): boolean {
    return this.aiDecision?.action === 'human' ||
           (this.retryCount >= this.maxRetries && this.status === 'pending');
  },
};

/**
 * Static methods
 */
ExceptionSchema.statics = {
  /**
   * Find pending exceptions for processing
   */
  findPending(limit: number = 100): Promise<IExceptionDocument[]> {
    return this.find({
      status: 'pending',
      'aiDecision.action': { $ne: 'escalate' },
    })
      .sort({ failedAt: 1 })
      .limit(limit)
      .exec();
  },

  /**
   * Find exceptions by error type
   */
  findByErrorType(errorType: ExceptionErrorType): Promise<IExceptionDocument[]> {
    return this.find({ errorType, status: 'pending' })
      .sort({ failedAt: -1 })
      .exec();
  },

  /**
   * Get exception statistics
   */
  async getStats(startDate?: Date, endDate?: Date): Promise<{
    total: number;
    byStatus: Record<ExceptionStatus, number>;
    byErrorType: Record<ExceptionErrorType, number>;
    byAction: Record<ExceptionAction, number>;
    avgRetryCount: number;
    resolutionRate: number;
  }> {
    const dateFilter: Record<string, unknown> = {};
    if (startDate) dateFilter.$gte = startDate;
    if (endDate) dateFilter.$lte = endDate;

    const matchStage: Record<string, unknown> = {};
    if (Object.keys(dateFilter).length > 0) {
      matchStage.failedAt = dateFilter;
    }

    const stats = await this.aggregate([
      { $match: matchStage },
      {
        $facet: {
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          byErrorType: [{ $group: { _id: '$errorType', count: { $sum: 1 } } }],
          byAction: [{ $match: { 'aiDecision.action': { $exists: true } } }, { $group: { _id: '$aiDecision.action', count: { $sum: 1 } } }],
          totalCount: [{ $count: 'count' }],
          avgRetry: [{ $group: { _id: null, avg: { $avg: '$retryCount' } } }],
          resolvedCount: [{ $match: { status: 'resolved' } }, { $count: 'count' }],
        },
      },
    ]);

    const result = stats[0] || {};
    const total = result.totalCount?.[0]?.count || 0;
    const resolved = result.resolvedCount?.[0]?.count || 0;

    return {
      total,
      byStatus: Object.fromEntries((result.byStatus || []).map((s: { _id: string; count: number }) => [s._id, s.count])),
      byErrorType: Object.fromEntries((result.byErrorType || []).map((s: { _id: string; count: number }) => [s._id, s.count])),
      byAction: Object.fromEntries((result.byAction || []).map((s: { _id: string; count: number }) => [s._id, s.count])),
      avgRetryCount: result.avgRetry?.[0]?.avg || 0,
      resolutionRate: total > 0 ? (resolved / total) * 100 : 0,
    };
  },

  /**
   * Clean up old resolved exceptions
   */
  async cleanupResolved(retentionDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.deleteMany({
      status: { $in: ['resolved', 'ignored'] },
      resolvedAt: { $lt: cutoffDate },
    });

    return result.deletedCount;
  },
};

/**
 * Pre-save middleware to set failedAt if not set
 */
ExceptionSchema.pre('save', function (next) {
  if (!this.failedAt) {
    this.failedAt = new Date();
  }
  next();
});

export const Exception = mongoose.model<IExceptionDocument>('Exception', ExceptionSchema);
