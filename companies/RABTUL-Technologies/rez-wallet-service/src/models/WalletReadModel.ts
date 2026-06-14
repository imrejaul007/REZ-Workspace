import mongoose, { Schema } from 'mongoose';

/**
 * CQRS Read Model for Wallet
 *
 * This is an OPTIMIZED read projection that denormalizes wallet data
 * for fast reads. Updated asynchronously from the write model.
 */

// TODO: Migrate to import from '@rez/shared-types'
// Example: import { IWalletReadModel } from '@rez/shared-types/entities/wallet';

export interface IWalletReadModel extends mongoose.Document {
  userId: string;
  // Denormalized balance for fast reads
  balance: {
    total: number;
    available: number;
    pending: number;
    cashback: number;
  };
  // Pre-computed statistics
  statistics: {
    totalEarned: number;
    totalSpent: number;
    totalCashback: number;
    transactionCount: number;
  };
  // Optimized indexes for common queries
  lastUpdated: Date;
  version: number; // For optimistic locking
}

const WalletReadModelSchema = new Schema<IWalletReadModel>({
  userId: { type: String, required: true, unique: true, index: true },
  balance: {
    total: { type: Number, default: 0 },
    available: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    cashback: { type: Number, default: 0 },
  },
  statistics: {
    totalEarned: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    totalCashback: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
  },
  lastUpdated: { type: Date, default: Date.now },
  version: { type: Number, default: 1 },
});

// Compound index for user's wallet lookup
WalletReadModelSchema.index({ userId: 1 });
// Index for leaderboard queries (sorted by balance)
WalletReadModelSchema.index({ 'balance.total': -1 });

export const WalletReadModel = mongoose.model<IWalletReadModel>('WalletReadModel', WalletReadModelSchema);
