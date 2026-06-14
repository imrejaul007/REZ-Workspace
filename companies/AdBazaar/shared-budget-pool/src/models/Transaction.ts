import mongoose, { Document, Schema } from 'mongoose';

export type TransactionType =
  | 'allocation'
  | 'contribution'
  | 'spend'
  | 'refund'
  | 'transfer_in'
  | 'transfer_out'
  | 'adjustment'
  | 'reversal';

export interface ITransaction extends Document {
  poolId: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string;
  referenceType?: string;
  description?: string;
  metadata: Record<string, unknown>;
  relatedTransactionId?: mongoose.Types.ObjectId;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    poolId: {
      type: Schema.Types.ObjectId,
      ref: 'BudgetPool',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'allocation',
        'contribution',
        'spend',
        'refund',
        'transfer_in',
        'transfer_out',
        'adjustment',
        'reversal',
      ],
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    reference: {
      type: String,
      required: true,
      trim: true,
    },
    referenceType: {
      type: String,
      enum: ['campaign', 'pool', 'refund', 'adjustment', 'manual', 'system'],
    },
    description: {
      type: String,
      maxlength: 500,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    relatedTransactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
TransactionSchema.index({ poolId: 1, timestamp: -1 });
TransactionSchema.index({ type: 1, timestamp: -1 });
TransactionSchema.index({ reference: 1 });
TransactionSchema.index({ createdAt: -1 });

// Methods
TransactionSchema.methods.getNetEffect = function (): number {
  switch (this.type) {
    case 'allocation':
    case 'contribution':
    case 'refund':
    case 'transfer_in':
      return this.amount;
    case 'spend':
    case 'transfer_out':
    case 'adjustment':
      return -this.amount;
    case 'reversal':
      return this.amount;
    default:
      return 0;
  }
};

TransactionSchema.statics.getPoolTransactions = async function (
  poolId: mongoose.Types.ObjectId,
  options: {
    startDate?: Date;
    endDate?: Date;
    type?: TransactionType;
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

  if (options.type) {
    query.type = options.type;
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 50);
};

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);