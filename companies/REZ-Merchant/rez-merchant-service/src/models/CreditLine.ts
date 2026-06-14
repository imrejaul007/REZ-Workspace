import mongoose, { Schema, Types, Document } from 'mongoose';

/**
 * Credit Line / BNPL model for B2B supplier credit management.
 * Tracks credit limits, usage, interest, and payment history.
 */

export type CreditLineStatus = 'active' | 'suspended' | 'closed';

export interface IPaymentHistoryEntry {
  date: Date;
  amount: number;
  reference: string;
  method: 'bank_transfer' | 'upi' | 'neft' | 'rtgs' | 'cash' | 'adjustment' | 'credit_note';
  appliedTo: string[]; // Reference IDs this payment was applied to
  notes?: string;
}

export interface ICreditLine extends Document {
  merchantId: Types.ObjectId;
  supplierId: Types.ObjectId;
  creditLimit: number;
  creditPeriodDays: number; // Net payment terms (30, 60, 90)
  usedAmount: number;
  availableCredit: number; // creditLimit - usedAmount
  interestRate: number; // % per month for overdue
  interestGraceDays: number; // Days after due before interest starts
  minPaymentPercent: number; // Minimum % of outstanding to pay
  status: CreditLineStatus;
  paymentHistory: IPaymentHistoryEntry[];
  lastPaymentDate?: Date;
  lastPaymentAmount?: number;
  totalInterestCharged: number;
  suspendedAt?: Date;
  suspendedReason?: string;
  closedAt?: Date;
  closedReason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentHistoryEntrySchema = new Schema<IPaymentHistoryEntry>(
  {
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    reference: { type: String, required: true },
    method: {
      type: String,
      enum: ['bank_transfer', 'upi', 'neft', 'rtgs', 'cash', 'adjustment', 'credit_note'],
      required: true,
    },
    appliedTo: [{ type: String }],
    notes: { type: String },
  },
  { _id: false }
);

const creditLineSchema = new Schema<ICreditLine>(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
      index: true,
    },
    creditLimit: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    creditPeriodDays: {
      type: Number,
      required: true,
      min: 1,
      max: 365,
      default: 30,
    },
    usedAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    availableCredit: {
      type: Number,
      required: true,
      min: 0,
      default: function (this: ICreditLine) {
        return this.creditLimit;
      },
    },
    interestRate: {
      type: Number,
      required: true,
      min: 0,
      max: 24, // Max 24% per month
      default: 2.5,
    },
    interestGraceDays: {
      type: Number,
      required: true,
      min: 0,
      max: 30,
      default: 5,
    },
    minPaymentPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 10,
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'closed'],
      default: 'active',
      index: true,
    },
    paymentHistory: {
      type: [paymentHistoryEntrySchema],
      default: [],
    },
    lastPaymentDate: {
      type: Date,
    },
    lastPaymentAmount: {
      type: Number,
    },
    totalInterestCharged: {
      type: Number,
      default: 0,
      min: 0,
    },
    suspendedAt: {
      type: Date,
    },
    suspendedReason: {
      type: String,
    },
    closedAt: {
      type: Date,
    },
    closedReason: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    strict: true,
    strictQuery: true,
    timestamps: true,
    collection: 'creditlines',
  }
);

// Compound indexes for common queries
creditLineSchema.index({ merchantId: 1, status: 1 });
creditLineSchema.index({ merchantId: 1, supplierId: 1 }, { unique: true });
creditLineSchema.index({ supplierId: 1, status: 1 });

// Pre-save hook to recalculate available credit
creditLineSchema.pre('save', function (next) {
  if (this.isModified('creditLimit') || this.isModified('usedAmount')) {
    this.availableCredit = Math.max(0, this.creditLimit - this.usedAmount);
  }
  next();
});

// Instance method: Check if amount can be added to credit line
creditLineSchema.methods.canAddAmount = function (amount: number): boolean {
  return this.status === 'active' && (this.availableCredit >= amount);
};

// Instance method: Check credit availability
creditLineSchema.methods.getCreditAvailability = function (amount?: number): {
  available: boolean;
  availableCredit: number;
  wouldExceedBy: number;
} {
  const availableCredit = Math.max(0, this.creditLimit - this.usedAmount);
  if (amount === undefined) {
    return { available: true, availableCredit, wouldExceedBy: 0 };
  }
  const wouldExceedBy = Math.max(0, amount - availableCredit);
  return { available: wouldExceedBy === 0, availableCredit, wouldExceedBy };
};

// Instance method: Suspend the credit line
creditLineSchema.methods.suspend = function (reason: string): void {
  if (this.status === 'closed') {
    throw new Error('Cannot suspend a closed credit line');
  }
  this.status = 'suspended';
  this.suspendedAt = new Date();
  this.suspendedReason = reason;
};

// Instance method: Reactivate the credit line
creditLineSchema.methods.reactivate = function (): void {
  if (this.status === 'closed') {
    throw new Error('Cannot reactivate a closed credit line');
  }
  this.status = 'active';
  this.suspendedAt = undefined;
  this.suspendedReason = undefined;
};

// Instance method: Close the credit line
creditLineSchema.methods.close = function (reason: string): void {
  if (this.usedAmount > 0) {
    throw new Error('Cannot close credit line with outstanding balance');
  }
  this.status = 'closed';
  this.closedAt = new Date();
  this.closedReason = reason;
};

// Static method: Find credit line by merchant and supplier
creditLineSchema.statics.findByMerchantAndSupplier = async function (
  merchantId: string,
  supplierId: string
): Promise<ICreditLine | null> {
  return this.findOne({
    merchantId: new Types.ObjectId(merchantId),
    supplierId: new Types.ObjectId(supplierId),
  }).exec();
};

// Static method: Get all active credit lines for a merchant
creditLineSchema.statics.findActiveByMerchant = async function (
  merchantId: string
): Promise<ICreditLine[]> {
  return this.find({
    merchantId: new Types.ObjectId(merchantId),
    status: 'active',
  })
    .populate('supplierId', 'name email phone')
    .lean();
};

// Static method: Get credit utilization summary for merchant
creditLineSchema.statics.getUtilizationSummary = async function (
  merchantId: string
): Promise<{
  totalLimit: number;
  totalUsed: number;
  totalAvailable: number;
  utilizationPercent: number;
  linesOverUtilized: number;
}> {
  const result = await this.aggregate([
    {
      $match: {
        merchantId: new Types.ObjectId(merchantId),
        status: { $in: ['active', 'suspended'] },
      },
    },
    {
      $group: {
        _id: null,
        totalLimit: { $sum: '$creditLimit' },
        totalUsed: { $sum: '$usedAmount' },
      },
    },
    {
      $addFields: {
        totalAvailable: { $max: [{ $subtract: ['$totalLimit', '$totalUsed'] }, 0] },
        utilizationPercent: {
          $cond: {
            if: { $gt: ['$totalLimit', 0] },
            then: {
              $multiply: [
                { $divide: ['$totalUsed', '$totalLimit'] },
                100,
              ],
            },
            else: 0,
          },
        },
      },
    },
  ]);

  const overUtilized = await this.countDocuments({
    merchantId: new Types.ObjectId(merchantId),
    status: 'active',
    $expr: { $gt: [{ $divide: ['$usedAmount', '$creditLimit'] }, 0.9] },
  });

  if (result.length === 0) {
    return {
      totalLimit: 0,
      totalUsed: 0,
      totalAvailable: 0,
      utilizationPercent: 0,
      linesOverUtilized: overUtilized,
    };
  }

  return {
    totalLimit: result[0].totalLimit,
    totalUsed: result[0].totalUsed,
    totalAvailable: result[0].totalAvailable,
    utilizationPercent: Math.round(result[0].utilizationPercent * 100) / 100,
    linesOverUtilized: overUtilized,
  };
};

export const CreditLine =
  mongoose.models.CreditLine || mongoose.model<ICreditLine>('CreditLine', creditLineSchema);
