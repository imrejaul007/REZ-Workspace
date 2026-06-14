import mongoose, { Schema, Types, Document } from 'mongoose';

/**
 * Supplier Ledger model for B2B accounting.
 * Maintains a running balance of all transactions with a supplier.
 * Uses FIFO payment allocation for outstanding invoices.
 */

export type LedgerEntryType = 'debit' | 'credit';
export type LedgerReferenceType = 'po' | 'payment' | 'credit_note' | 'interest' | 'adjustment';

export interface ILedgerEntry extends Document {
  merchantId: Types.ObjectId;
  supplierId: Types.ObjectId;
  entryType: LedgerEntryType;
  amount: number;
  balance: number; // Running balance after this entry
  reference: LedgerReferenceType;
  referenceId?: Types.ObjectId; // PO or payment ID
  referenceNumber: string; // PO number or payment ref
  description: string;
  dueDate?: Date;
  isOverdue: boolean;
  daysOverdue: number;
  interestApplied: boolean;
  interestAmount: number;
  allocatedAmount: number; // Amount allocated from this entry (for debits)
  unallocatedAmount: number; // Remaining unallocated amount
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ledgerEntrySchema = new Schema<ILedgerEntry>(
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
    entryType: {
      type: String,
      enum: ['debit', 'credit'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    reference: {
      type: String,
      enum: ['po', 'payment', 'credit_note', 'interest', 'adjustment'],
      required: true,
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      sparse: true,
    },
    referenceNumber: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    dueDate: {
      type: Date,
    },
    isOverdue: {
      type: Boolean,
      default: false,
      index: true,
    },
    daysOverdue: {
      type: Number,
      default: 0,
      min: 0,
    },
    interestApplied: {
      type: Boolean,
      default: false,
    },
    interestAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    allocatedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    unallocatedAmount: {
      type: Number,
      default: function (this: ILedgerEntry) {
        return this.entryType === 'debit' ? this.amount : 0;
      },
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    strict: true,
    strictQuery: true,
    timestamps: true,
    collection: 'supplierledger',
  }
);

// Indexes for common queries
ledgerEntrySchema.index({ merchantId: 1, supplierId: 1, createdAt: -1 });
ledgerEntrySchema.index({ merchantId: 1, supplierId: 1, isOverdue: 1 });
ledgerEntrySchema.index({ supplierId: 1, dueDate: 1, isOverdue: 1 });
ledgerEntrySchema.index({ merchantId: 1, supplierId: 1, unallocatedAmount: 1 });
ledgerEntrySchema.index({ reference: 1, referenceId: 1 });
ledgerEntrySchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 * 3 }); // 3 year retention

// Compound index for FIFO queries
ledgerEntrySchema.index({ supplierId: 1, entryType: 1, dueDate: 1, unallocatedAmount: 1 });

// Pre-save hook to calculate overdue status
ledgerEntrySchema.pre('save', function (next) {
  if (this.dueDate && this.entryType === 'debit') {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dueDate = new Date(this.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = now.getTime() - dueDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    this.isOverdue = diffDays > 0;
    this.daysOverdue = Math.max(0, diffDays);
  }
  next();
});

// Instance method: Get unallocated amount
ledgerEntrySchema.methods.getUnallocatedAmount = function (): number {
  if (this.entryType !== 'debit') return 0;
  return Math.max(0, this.amount - this.allocatedAmount);
};

// Instance method: Check if fully allocated
ledgerEntrySchema.methods.isFullyAllocated = function (): boolean {
  if (this.entryType !== 'debit') return true;
  return this.allocatedAmount >= this.amount;
};

// Instance method: Allocate payment to this entry
ledgerEntrySchema.methods.allocate = function (amount: number): number {
  if (this.entryType !== 'debit') return 0;

  const unallocated = this.getUnallocatedAmount();
  const toAllocate = Math.min(amount, unallocated);
  this.allocatedAmount += toAllocate;
  return toAllocate;
};

// Static method: Get current balance for a supplier
ledgerEntrySchema.statics.getCurrentBalance = async function (
  merchantId: string,
  supplierId: string
): Promise<number> {
  const result = await this.aggregate([
    {
      $match: {
        merchantId: new Types.ObjectId(merchantId),
        supplierId: new Types.ObjectId(supplierId),
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $limit: 1,
    },
    {
      $project: {
        balance: 1,
      },
    },
  ]);

  return result.length > 0 ? result[0].balance : 0;
};

// Static method: Get unallocated debit entries (FIFO order)
ledgerEntrySchema.statics.getUnallocatedEntries = async function (
  merchantId: string,
  supplierId: string
): Promise<ILedgerEntry[]> {
  return this.find({
    merchantId: new Types.ObjectId(merchantId),
    supplierId: new Types.ObjectId(supplierId),
    entryType: 'debit',
    unallocatedAmount: { $gt: 0 },
  })
    .sort({ dueDate: 1, createdAt: 1 })
    .lean();
};

// Static method: Get overdue entries
ledgerEntrySchema.statics.getOverdueEntries = async function (
  merchantId: string,
  supplierId: string
): Promise<ILedgerEntry[]> {
  return this.find({
    merchantId: new Types.ObjectId(merchantId),
    supplierId: new Types.ObjectId(supplierId),
    isOverdue: true,
    unallocatedAmount: { $gt: 0 },
  })
    .sort({ dueDate: 1, createdAt: 1 })
    .lean();
};

// Static method: Get aging buckets for a supplier
ledgerEntrySchema.statics.getAgingReport = async function (
  merchantId: string,
  supplierId: string
): Promise<{
  current: number;
  '1-30': number;
  '31-60': number;
  '61-90': number;
  '90+': number;
  total: number;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const entries = await this.find({
    merchantId: new Types.ObjectId(merchantId),
    supplierId: new Types.ObjectId(supplierId),
    entryType: 'debit',
    unallocatedAmount: { $gt: 0 },
  }).lean();

  const aging = {
    current: 0,
    '1-30': 0,
    '31-60': 0,
    '61-90': 0,
    '90+': 0,
    total: 0,
  };

  for (const entry of entries) {
    if (!entry.dueDate) {
      aging.current += entry.unallocatedAmount;
      continue;
    }

    const dueDate = new Date(entry.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      aging.current += entry.unallocatedAmount;
    } else if (diffDays <= 30) {
      aging['1-30'] += entry.unallocatedAmount;
    } else if (diffDays <= 60) {
      aging['31-60'] += entry.unallocatedAmount;
    } else if (diffDays <= 90) {
      aging['61-90'] += entry.unallocatedAmount;
    } else {
      aging['90+'] += entry.unallocatedAmount;
    }
  }

  aging.total = aging.current + aging['1-30'] + aging['31-60'] + aging['61-90'] + aging['90+'];

  return aging;
};

// Static method: Get transactions for a date range
ledgerEntrySchema.statics.getTransactionsByDateRange = async function (
  merchantId: string,
  supplierId: string,
  startDate: Date,
  endDate: Date
): Promise<ILedgerEntry[]> {
  return this.find({
    merchantId: new Types.ObjectId(merchantId),
    supplierId: new Types.ObjectId(supplierId),
    createdAt: { $gte: startDate, $lte: endDate },
  })
    .sort({ createdAt: -1 })
    .lean();
};

// Static method: Verify ledger balance integrity
ledgerEntrySchema.statics.verifyBalanceIntegrity = async function (
  merchantId: string,
  supplierId: string
): Promise<{
  isValid: boolean;
  calculatedBalance: number;
  storedBalance: number;
  discrepancy: number;
}> {
  const result = await this.aggregate([
    {
      $match: {
        merchantId: new Types.ObjectId(merchantId),
        supplierId: new Types.ObjectId(supplierId),
      },
    },
    {
      $sort: { createdAt: 1 },
    },
    {
      $group: {
        _id: null,
        totalDebits: { $sum: { $cond: [{ $eq: ['$entryType', 'debit'] }, '$amount', 0] } },
        totalCredits: { $sum: { $cond: [{ $eq: ['$entryType', 'credit'] }, '$amount', 0] } },
        lastBalance: { $last: '$balance' },
      },
    },
  ]);

  if (result.length === 0) {
    return { isValid: true, calculatedBalance: 0, storedBalance: 0, discrepancy: 0 };
  }

  const calculatedBalance = result[0].totalDebits - result[0].totalCredits;
  const storedBalance = result[0].lastBalance || 0;
  const discrepancy = Math.abs(calculatedBalance - storedBalance);

  return {
    isValid: discrepancy < 0.01, // Allow for floating point errors
    calculatedBalance,
    storedBalance,
    discrepancy,
  };
};

export const SupplierLedger =
  mongoose.models.SupplierLedger || mongoose.model<ILedgerEntry>('SupplierLedger', ledgerEntrySchema);
