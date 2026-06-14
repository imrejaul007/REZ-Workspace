/**
 * Split Bill Model
 *
 * Enables splitting a bill among multiple users with different payment methods.
 * Supports UPI, card, wallet, and cash payment methods.
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

// Payment method types
export type SplitMethod = 'upi' | 'card' | 'wallet' | 'cash';

// Split payment status
export type SplitStatus = 'pending' | 'paid';

// Overall split bill status
export type SplitBillStatus = 'pending' | 'partial' | 'completed';

/**
 * Individual split entry representing one person's portion of the bill
 */
export interface ISplitEntry {
  userId?: string;
  amount: number;
  method: SplitMethod;
  status: SplitStatus;
  paidAt?: Date;
}

/**
 * Split Bill interface
 */
export interface ISplitBill extends Document {
  orderId: Types.ObjectId;
  parentOrderId?: Types.ObjectId;
  splits: ISplitEntry[];
  status: SplitBillStatus;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  getPaidAmount(): number;
  getRemainingAmount(): number;
  isFullyPaid(): boolean;
}

/**
 * Split Bill Model interface with static methods
 */
export interface ISplitBillModel extends mongoose.Model<ISplitBill> {
  findByOrderId(orderId: string): Promise<ISplitBill | null>;
  findByUserId(userId: string): Promise<ISplitBill[]>;
  findPendingByUserId(userId: string): Promise<ISplitBill[]>;
}

/**
 * Schema definition for individual split entries
 */
const SplitEntrySchema = new Schema<ISplitEntry>(
  {
    userId: { type: String },
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      required: true,
      enum: ['upi', 'card', 'wallet', 'cash'],
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'paid'],
      default: 'pending',
    },
    paidAt: { type: Date },
  },
  { _id: false },
);

/**
 * Split Bill Schema
 */
const SplitBillSchema = new Schema<ISplitBill>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    parentOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    splits: {
      type: [SplitEntrySchema],
      required: true,
      validate: {
        validator: function (v: ISplitEntry[]) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'At least one split entry is required',
      },
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'partial', 'completed'],
      default: 'pending',
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: true,
  },
);

// Indexes for efficient queries
SplitBillSchema.index({ orderId: 1 }, { unique: true });
SplitBillSchema.index({ status: 1 });
SplitBillSchema.index({ createdAt: -1 });
SplitBillSchema.index({ 'splits.userId': 1 });
SplitBillSchema.index({ 'splits.status': 1 });

/**
 * Pre-save middleware to update overall status based on split statuses
 */
SplitBillSchema.pre('save', function (next) {
  const paidCount = this.splits.filter((s) => s.status === 'paid').length;
  const totalCount = this.splits.length;

  if (paidCount === 0) {
    this.status = 'pending';
  } else if (paidCount === totalCount) {
    this.status = 'completed';
  } else {
    this.status = 'partial';
  }

  next();
});

/**
 * Instance method to get paid amount
 */
SplitBillSchema.methods.getPaidAmount = function (): number {
  return this.splits
    .filter((s) => s.status === 'paid')
    .reduce((sum, s) => sum + s.amount, 0);
};

/**
 * Instance method to get remaining amount
 */
SplitBillSchema.methods.getRemainingAmount = function (): number {
  return this.totalAmount - this.getPaidAmount();
};

/**
 * Instance method to check if all splits are paid
 */
SplitBillSchema.methods.isFullyPaid = function (): boolean {
  return this.status === 'completed';
};

/**
 * Static method to find split by order ID
 */
SplitBillSchema.statics.findByOrderId = function (
  orderId: string
): Promise<ISplitBill | null> {
  return this.findOne({ orderId: new Types.ObjectId(orderId) }).exec();
};

/**
 * Static method to find splits by user ID
 */
SplitBillSchema.statics.findByUserId = function (
  userId: string
): Promise<ISplitBill[]> {
  return this.find({ 'splits.userId': userId })
    .sort({ createdAt: -1 })
    .exec();
};

/**
 * Static method to find pending splits for a user
 */
SplitBillSchema.statics.findPendingByUserId = function (
  userId: string
): Promise<ISplitBill[]> {
  return this.find({
    'splits.userId': userId,
    'splits.status': 'pending',
  })
    .sort({ createdAt: -1 })
    .exec();
};

export const SplitBill = mongoose.model<ISplitBill, ISplitBillModel>('SplitBill', SplitBillSchema);
