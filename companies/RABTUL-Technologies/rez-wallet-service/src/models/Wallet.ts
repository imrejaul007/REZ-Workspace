/**
 * Canonical types: @rez/shared-types/entities/wallet
 * MIGRATED: Importing IWallet from @rez/shared-types (aligned, Feb 2026)
 *
 * Canonical CoinType enum (6 values):
 * - promo: promotional coins
 * - branded: merchant-specific branded coins
 * - prive: premium tier coins
 * - cashback: cashback reward coins
 * - referral: referral bonus coins
 * - rez: primary rez coins
 */
import mongoose, { Schema, Document, Types } from 'mongoose';
import { CoinType } from '../types/wallet';

// Local sub-interfaces aligned with @rez/shared-types structure
export interface IBrandedCoin {
  merchantId: Types.ObjectId;
  merchantName: string;
  merchantLogo?: string;
  merchantColor?: string;
  amount: number;
  earnedDate: Date;
  lastUsed?: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface ICoinBalance {
  type: CoinType;
  amount: number;
  isActive: boolean;
  expiryDate?: Date;
  brandedDetails?: { merchantId: Types.ObjectId; merchantName: string };
}

// ISavingsInsights aligned with @rez/shared-types IWalletSavingsInsights
export interface ISavingsInsights {
  totalSaved: number;
  thisMonth: number;
  avgPerVisit: number;
  lastCalculated: Date;
}

// ILimits aligned with @rez/shared-types IWalletLimits
export interface ILimits {
  maxBalance: number;
  minWithdrawal: number;
  dailySpendLimit: number;
  dailySpent: number;
  lastResetDate: Date;
}

// Local IWallet extends Document for Mongoose; aligned with SharedIWallet from @rez/shared-types
export interface IWallet extends Document {
  user: Types.ObjectId;
  balance: {
    total: number;
    available: number;
    pending: number;
    cashback: number;
  };
  coins: ICoinBalance[];
  brandedCoins: IBrandedCoin[];
  currency: string;
  statistics: {
    totalEarned: number;
    totalSpent: number;
    totalCashback: number;
    transactionCount: number;
    // DM-H4 fix: added missing fields to match backend Wallet.ts and rez-shared types
    totalRefunds: number;
    totalTopups: number;
    totalWithdrawals: number;
  };
  savingsInsights: ISavingsInsights;
  limits: ILimits;
  isActive: boolean;
  isFrozen?: boolean;
  // DB-HEALTH-008: Soft delete field
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balance: {
      total: { type: Number, default: 0, min: 0 },
      available: { type: Number, default: 0, min: 0 },
      pending: { type: Number, default: 0, min: 0 },
      cashback: { type: Number, default: 0, min: 0 },
    },
    coins: [
      {
        // C2-FIX: Added 'cashback' and 'referral' coin types to match backend schema
        type: { type: String, enum: ['rez', 'prive', 'branded', 'promo', 'cashback', 'referral'], required: true },
        amount: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
        expiryDate: Date,
        brandedDetails: {
          merchantId: { type: Schema.Types.ObjectId, ref: 'Store' },
          merchantName: String,
        },
      },
    ],
    brandedCoins: [
      {
        merchantId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
        merchantName: { type: String, required: true },
        amount: { type: Number, default: 0 },
        earnedDate: { type: Date, default: Date.now },
        expiresAt: { type: Date }, // 6-month expiry per spec; set at earn time
        isActive: { type: Boolean, default: true },
      },
    ],
    // H13-FIX: Added enum constraint to prevent mixed currency values across services.
    // Default stays 'REZ_COIN' (wallet-service standard); 'RC' added for backend compat.
    currency: { type: String, enum: ['REZ_COIN', 'RC', 'NC', 'INR'], default: 'REZ_COIN' },
    statistics: {
      totalEarned: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
      totalCashback: { type: Number, default: 0 },
      transactionCount: { type: Number, default: 0 },
      // DM-H4 fix: added missing fields to match backend Wallet.ts and rez-shared types
      totalRefunds: { type: Number, default: 0 },
      totalTopups: { type: Number, default: 0 },
      totalWithdrawals: { type: Number, default: 0 },
    },
    savingsInsights: {
      totalSaved: { type: Number, default: 0 },
      thisMonth: { type: Number, default: 0 },
      avgPerVisit: { type: Number, default: 0 },
      lastCalculated: { type: Date, default: Date.now },
    },
    // MA-M2 fix: Added limits subdocument to match monolith Wallet schema.
    // dailySpendLimit enforcement in debitCoins() + debitInPriorityOrder().
    limits: {
      maxBalance: { type: Number, default: 100000, min: 0 },
      minWithdrawal: { type: Number, default: 100, min: 0 },
      dailySpendLimit: { type: Number, default: 10000, min: 0 },
      dailySpent: { type: Number, default: 0, min: 0 },
      lastResetDate: { type: Date, default: Date.now },
    },
    isActive: { type: Boolean, default: true },
    isFrozen: { type: Boolean, default: false },
    // DB-HEALTH-008: Soft delete field
    deletedAt: Date,
  },
  { timestamps: true },
);

// MEDIUM FIX: Currency Enum Normalization
// Normalize 'RC' to 'REZ_COIN' for backward compatibility.
// This ensures consistent currency representation across the service.
WalletSchema.pre('save', function (next) {
  if (this.currency === 'RC') {
    this.currency = 'REZ_COIN';
  }
  next();
});

WalletSchema.index({ user: 1 }, { unique: true });
// SCHEMA FIX: Add compound index for active wallet queries
WalletSchema.index({ user: 1, isActive: 1 });
WalletSchema.index({ isActive: 1 });
WalletSchema.index({ isFrozen: 1 });
WalletSchema.index({ createdAt: -1 });

// PERFORMANCE FIX: Add currency index for multi-currency wallet queries
WalletSchema.index({ currency: 1 });

// PERFORMANCE FIX: Add transactionCount index for analytics queries
WalletSchema.index({ 'statistics.transactionCount': -1 });

// PERFORMANCE FIX: Add compound index for active non-frozen wallets
WalletSchema.index({ isActive: 1, isFrozen: 1 });

// DB-HEALTH-007: Index for balance-based sorting and leaderboard queries
WalletSchema.index({ 'balance.total': -1 });
WalletSchema.index({ isActive: 1, 'balance.total': -1 });

// DB-HEALTH-008: Soft delete index for wallet queries
WalletSchema.index({ deletedAt: 1 });

// SCHEMA FIX: Validate balance invariants on save
WalletSchema.pre('save', function (next) {
  const { available, pending, total, cashback } = this.balance;

  // Validate that available, pending, and cashback are non-negative
  if (available < 0) {
    return next(new Error('Available balance cannot be negative'));
  }
  if (pending < 0) {
    return next(new Error('Pending balance cannot be negative'));
  }
  if (cashback < 0) {
    return next(new Error('Cashback cannot be negative'));
  }

  // Validate that total >= available
  if (total < available) {
    return next(new Error(`Total balance (${total}) cannot be less than available (${available})`));
  }

  next();
});

export const Wallet = mongoose.model<IWallet>('Wallet', WalletSchema);
