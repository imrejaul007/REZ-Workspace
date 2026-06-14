import mongoose, { Schema, Document } from 'mongoose';
import { IEcosystemTransaction, TransactionType, TransactionStatus, PaymentMethod } from '../types';

export interface ITransactionDocument extends Omit<IEcosystemTransaction, 'transactionId' | 'createdAt' | 'updatedAt'>, Document {
  transactionId: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransactionDocument>(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    adId: {
      type: String,
      required: true,
      index: true,
    },
    campaignId: {
      type: String,
      index: true,
    },
    advertiserId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    businessId: {
      type: String,
      index: true,
    },
    type: {
      type: String,
      enum: ['booking_deposit', 'order', 'appointment', 'subscription', 'tip'] as TransactionType[],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['initiated', 'pending_payment', 'completed', 'failed', 'cancelled', 'refunded'] as TransactionStatus[],
      default: 'initiated',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['wallet', 'upi', 'card', 'netbanking'] as PaymentMethod[],
    },
    paymentReference: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for common queries
TransactionSchema.index({ advertiserId: 1, createdAt: -1 });
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ adId: 1, createdAt: -1 });
TransactionSchema.index({ campaignId: 1, createdAt: -1 });
TransactionSchema.index({ status: 1, createdAt: -1 });
TransactionSchema.index({ type: 1, status: 1 });

// Static methods
TransactionSchema.statics.findByTransactionId = function(transactionId: string) {
  return this.findOne({ transactionId });
};

TransactionSchema.statics.findByUserId = function(userId: string, options?: { page?: number; limit?: number; status?: TransactionStatus }) {
  const { page = 1, limit = 20, status } = options || {};
  const query = { userId };
  if (status) query.status = status;

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

TransactionSchema.statics.findByAdId = function(adId: string, options?: { page?: number; limit?: number; status?: TransactionStatus }) {
  const { page = 1, limit = 20, status } = options || {};
  const query = { adId };
  if (status) query.status = status;

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

TransactionSchema.statics.countByStatus = function(transactionId: string | string[]) {
  return this.aggregate([
    { $match: { transactionId: { $in: Array.isArray(transactionId) ? transactionId : [transactionId] } } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
      },
    },
  ]);
};

export const Transaction = mongoose.model<ITransactionDocument>('Transaction', TransactionSchema);