import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUsageRecord extends Document {
  usageId: string;
  subscriptionId: string;
  customerId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  timestamp: Date;
  idempotencyKey?: string;
  description?: string;
  periodStart: Date;
  periodEnd: Date;
  metadata: Record<string, unknown>;
  processed: boolean;
  invoiceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UsageRecordSchema = new Schema<IUsageRecord>(
  {
    usageId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    subscriptionId: {
      type: String,
      required: true,
      index: true
    },
    customerId: {
      type: String,
      required: true,
      index: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR',
      length: 3
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      index: true
    },
    description: {
      type: String
    },
    periodStart: {
      type: Date,
      required: true
    },
    periodEnd: {
      type: Date,
      required: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    processed: {
      type: Boolean,
      default: false,
      index: true
    },
    invoiceId: {
      type: String,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'usage_records'
  }
);

// Compound indexes for efficient queries
UsageRecordSchema.index({ subscriptionId: 1, periodStart: 1, periodEnd: 1 });
UsageRecordSchema.index({ subscriptionId: 1, timestamp: -1 });
UsageRecordSchema.index({ customerId: 1, timestamp: -1 });
UsageRecordSchema.index({ processed: 1, timestamp: 1 });
UsageRecordSchema.index(
  { subscriptionId: 1, periodStart: 1, periodEnd: 1, processed: 1 },
  { name: 'subscription_period_processed' }
);

// Static method to get total usage for a period
UsageRecordSchema.statics.getTotalUsage = async function(
  subscriptionId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<number> {
  const result = await this.aggregate([
    {
      $match: {
        subscriptionId,
        periodStart: { $gte: periodStart },
        periodEnd: { $lte: periodEnd }
      }
    },
    {
      $group: {
        _id: null,
        totalQuantity: { $sum: '$quantity' },
        totalAmount: { $sum: '$totalAmount' }
      }
    }
  ]);

  return result.length > 0 ? result[0].totalQuantity : 0;
};

// Static method to get unprocessed usage
UsageRecordSchema.statics.getUnprocessedUsage = async function(
  subscriptionId: string
): Promise<IUsageRecord[]> {
  return this.find({
    subscriptionId,
    processed: false
  }).sort({ timestamp: 1 });
};

// Static method to mark usage as processed
UsageRecordSchema.statics.markAsProcessed = async function(
  usageIds: string[],
  invoiceId: string
): Promise<void> {
  await this.updateMany(
    { usageId: { $in: usageIds } },
    {
      $set: {
        processed: true,
        invoiceId
      }
    }
  );
};

// Static method to get usage summary by day
UsageRecordSchema.statics.getDailyUsageSummary = async function(
  subscriptionId: string,
  startDate: Date,
  endDate: Date
): Promise<{ date: string; quantity: number; amount: number }[]> {
  return this.aggregate([
    {
      $match: {
        subscriptionId,
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
        },
        quantity: { $sum: '$quantity' },
        amount: { $sum: '$totalAmount' }
      }
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        quantity: 1,
        amount: 1
      }
    },
    {
      $sort: { date: 1 }
    }
  ]);
};

// Static method to check for duplicate idempotency key
UsageRecordSchema.statics.findByIdempotencyKey = async function(
  idempotencyKey: string
): Promise<IUsageRecord | null> {
  return this.findOne({ idempotencyKey });
};

export const UsageRecord: Model<IUsageRecord> = mongoose.model<IUsageRecord>(
  'UsageRecord',
  UsageRecordSchema
);
