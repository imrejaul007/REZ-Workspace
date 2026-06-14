import mongoose, { Document, Schema } from 'mongoose';
import { LoyaltyTransaction } from '../types';

export interface ILoyaltyTransaction extends Document {
  transactionId: string;
  accountId: string;
  userId: string;
  merchantId: string;
  vertical: string;
  type: 'earn' | 'redeem' | 'expire' | 'transfer' | 'bonus';
  points: number;
  source: string;
  sourceId?: string;
  description: string;
  expiresAt?: Date;
  createdAt: Date;
}

const LoyaltyTransactionSchema = new Schema<ILoyaltyTransaction>({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  accountId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  merchantId: {
    type: String,
    required: true,
    index: true
  },
  vertical: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['earn', 'redeem', 'expire', 'transfer', 'bonus'],
    required: true,
    index: true
  },
  points: {
    type: Number,
    required: true
  },
  source: {
    type: String,
    required: true
  },
  sourceId: {
    type: String,
    sparse: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    sparse: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false,
  collection: 'loyalty_transactions'
});

// Compound indexes for common queries
LoyaltyTransactionSchema.index({ accountId: 1, createdAt: -1 }); // Account transaction history
LoyaltyTransactionSchema.index({ merchantId: 1, createdAt: -1 }); // Merchant transactions
LoyaltyTransactionSchema.index({ userId: 1, createdAt: -1 }); // User transaction history
LoyaltyTransactionSchema.index({ sourceId: 1, type: 1 }); // Source-based lookup

// TTL index for automatic expiration (optional, managed by cron as well)
LoyaltyTransactionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to get account summary
LoyaltyTransactionSchema.statics.getAccountSummary = async function(accountId: string) {
  const result = await this.aggregate([
    { $match: { accountId } },
    {
      $group: {
        _id: '$type',
        totalPoints: { $sum: '$points' },
        count: { $sum: 1 }
      }
    }
  ]);

  return result.reduce((acc: any, item) => {
    acc[`${item._id}Points`] = item.totalPoints;
    acc[`${item._id}Count`] = item.count;
    return acc;
  }, {});
};

// Static method to get top verticals for an account
LoyaltyTransactionSchema.statics.getTopVerticals = async function(accountId: string, limit: number = 5) {
  return this.aggregate([
    { $match: { accountId, type: 'earn' } },
    {
      $group: {
        _id: '$vertical',
        totalEarned: { $sum: '$points' },
        count: { $sum: 1 }
      }
    },
    { $sort: { totalEarned: -1 } },
    { $limit: limit }
  ]);
};

export const LoyaltyTransactionModel = mongoose.model<ILoyaltyTransaction>('LoyaltyTransaction', LoyaltyTransactionSchema);

export default LoyaltyTransactionModel;