import mongoose, { Document, Schema } from 'mongoose';

export interface IContribution extends Document {
  poolId: mongoose.Types.ObjectId;
  source: string;
  sourceType: 'organization' | 'campaign' | 'manual' | 'refund' | 'transfer';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  reference?: string;
  description?: string;
  metadata: Record<string, unknown>;
  processedAt?: Date;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ContributionSchema = new Schema<IContribution>(
  {
    poolId: {
      type: Schema.Types.ObjectId,
      ref: 'BudgetPool',
      required: true,
      index: true,
    },
    source: {
      type: String,
      required: true,
      trim: true,
    },
    sourceType: {
      type: String,
      required: true,
      enum: ['organization', 'campaign', 'manual', 'refund', 'transfer'],
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    reference: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    processedAt: {
      type: Date,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ContributionSchema.index({ poolId: 1, status: 1 });
ContributionSchema.index({ source: 1, sourceType: 1 });
ContributionSchema.index({ timestamp: -1 });
ContributionSchema.index({ createdAt: -1 });

// Methods
ContributionSchema.methods.markCompleted = async function (): Promise<IContribution> {
  this.status = 'completed';
  this.processedAt = new Date();
  return this.save();
};

ContributionSchema.methods.markFailed = async function (): Promise<IContribution> {
  this.status = 'failed';
  this.processedAt = new Date();
  return this.save();
};

ContributionSchema.statics.getPoolContributions = async function (
  poolId: mongoose.Types.ObjectId,
  options: {
    startDate?: Date;
    endDate?: Date;
    sourceType?: string;
    status?: string;
    limit?: number;
    skip?: number;
  } = {}
) {
  const query: Record<string, unknown> = { poolId };

  if (options.startDate || options.endDate) {
    query.timestamp = {};
    if (options.startDate) query.timestamp.$gte = options.startDate;
    if (options.endDate) query.timestamp.$lte = options.endDate;
  }

  if (options.sourceType) {
    query.sourceType = options.sourceType;
  }

  if (options.status) {
    query.status = options.status;
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 50);
};

ContributionSchema.statics.getTotalContributions = async function (
  poolId: mongoose.Types.ObjectId,
  status: string = 'completed'
): Promise<number> {
  const result = await this.aggregate([
    { $match: { poolId, status } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return result.length > 0 ? result[0].total : 0;
};

export const Contribution = mongoose.model<IContribution>('Contribution', ContributionSchema);