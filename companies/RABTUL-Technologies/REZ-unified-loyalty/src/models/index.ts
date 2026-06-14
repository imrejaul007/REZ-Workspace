import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Mongoose model for user coin wallets
 */
export interface IUserWallet {
  userId: string;
  balances: {
    coinType: string;
    available: number;
    locked: number;
    expired: number;
    lifetimeEarned: number;
    lifetimeRedeemed: number;
    lastUpdated: Date;
  }[];
  totalValueUSD: number;
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserWalletSchema = new Schema<IUserWallet>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    balances: [{
      coinType: {
        type: String,
        required: true,
        enum: ['REZ', 'PROMO', 'BRANDED', 'PRIVE']
      },
      available: { type: Number, default: 0 },
      locked: { type: Number, default: 0 },
      expired: { type: Number, default: 0 },
      lifetimeEarned: { type: Number, default: 0 },
      lifetimeRedeemed: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now }
    }],
    totalValueUSD: { type: Number, default: 0 },
    lastSyncedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true,
    collection: 'user_wallets'
  }
);

UserWalletSchema.index({ 'balances.coinType': 1 });
UserWalletSchema.index({ updatedAt: 1 });

/**
 * Mongoose model for coin transactions
 */
export interface ITransaction {
  id: string;
  userId: string;
  coinType: string;
  amount: number;
  type: string;
  source: string;
  sourceAppUserId?: string;
  description: string;
  referenceId?: string;
  relatedTransactionId?: string;
  expiresAt?: Date;
  tierAtTransaction: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    coinType: {
      type: String,
      required: true,
      enum: ['REZ', 'PROMO', 'BRANDED', 'PRIVE']
    },
    amount: { type: Number, required: true },
    type: {
      type: String,
      required: true,
      enum: ['EARN', 'REDEEM', 'EXPIRE', 'ADJUST', 'TRANSFER_IN', 'TRANSFER_OUT', 'BONUS', 'REFUND', 'SYNC_IN', 'SYNC_OUT']
    },
    source: {
      type: String,
      required: true,
      enum: ['RABTUL_WALLET', 'REZ_MEDIA_ENGAGEMENT', 'REZ_NOW', 'REZ_APP', 'DOOH', 'KARMA', 'MANUAL', 'SYSTEM']
    },
    sourceAppUserId: { type: String },
    description: { type: String, required: true, maxlength: 500 },
    referenceId: { type: String, index: true },
    relatedTransactionId: { type: String },
    expiresAt: { type: Date, index: true },
    tierAtTransaction: { type: String, enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'] },
    metadata: { type: Schema.Types.Mixed }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'coin_transactions'
  }
);

TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ userId: 1, coinType: 1, createdAt: -1 });
TransactionSchema.index({ expiresAt: 1, type: 1 });
TransactionSchema.index({ source: 1, createdAt: -1 });

/**
 * Mongoose model for user tier status
 */
export interface IUserTier {
  userId: string;
  currentTier: string;
  lifetimeCoins: number;
  currentPeriodCoins: number;
  previousTier: string;
  tierProgress: number;
  nextTier?: string;
  coinsToNextTier: number;
  tierBenefits: Record<string, unknown>;
  tierEnrolledAt: Date;
  tierValidUntil: Date;
  lastTierCalculation: Date;
  tierHistory: {
    tier: string;
    startDate: Date;
    endDate?: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const UserTierSchema = new Schema<IUserTier>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    currentTier: {
      type: String,
      required: true,
      enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
      default: 'BRONZE'
    },
    lifetimeCoins: { type: Number, default: 0 },
    currentPeriodCoins: { type: Number, default: 0 },
    previousTier: { type: String, enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'], default: 'BRONZE' },
    tierProgress: { type: Number, default: 0, min: 0, max: 100 },
    nextTier: { type: String, enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'] },
    coinsToNextTier: { type: Number, default: 0 },
    tierBenefits: { type: Schema.Types.Mixed },
    tierEnrolledAt: { type: Date, default: Date.now },
    tierValidUntil: { type: Date },
    lastTierCalculation: { type: Date, default: Date.now },
    tierHistory: [{
      tier: { type: String, enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'] },
      startDate: { type: Date, default: Date.now },
      endDate: { type: Date }
    }]
  },
  {
    timestamps: true,
    collection: 'user_tiers'
  }
);

UserTierSchema.index({ currentTier: 1 });
UserTierSchema.index({ lifetimeCoins: -1 });
UserTierSchema.index({ tierValidUntil: 1 });

/**
 * Mongoose model for rewards
 */
export interface IReward {
  id: string;
  name: string;
  description: string;
  category: string;
  coinCost: number;
  coinType: string;
  discountValue?: number;
  freeItemId?: string;
  minTier: string;
  maxClaimPerUser: number;
  totalQuantity?: number;
  claimedQuantity: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  terms?: string;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const RewardSchema = new Schema<IReward>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ['DISCOUNT', 'FREE_ITEM', 'CASHBACK', 'EXPERIENCE', 'TIER_UPGRADE', 'PARTNER_OFFER']
    },
    coinCost: { type: Number, required: true, min: 0 },
    coinType: {
      type: String,
      required: true,
      enum: ['REZ', 'PROMO', 'BRANDED', 'PRIVE'],
      default: 'REZ'
    },
    discountValue: { type: Number },
    freeItemId: { type: String },
    minTier: {
      type: String,
      required: true,
      enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
      default: 'BRONZE'
    },
    maxClaimPerUser: { type: Number, default: 999, min: 1 },
    totalQuantity: { type: Number },
    claimedQuantity: { type: Number, default: 0 },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    terms: { type: String },
    imageUrl: { type: String },
    metadata: { type: Schema.Types.Mixed }
  },
  {
    timestamps: true,
    collection: 'rewards'
  }
);

RewardSchema.index({ isActive: 1, validUntil: 1 });
RewardSchema.index({ category: 1, minTier: 1 });
RewardSchema.index({ coinCost: 1 });

/**
 * Mongoose model for user reward claims
 */
export interface IUserReward {
  id: string;
  userId: string;
  rewardId: string;
  status: string;
  claimedAt: Date;
  expiresAt: Date;
  usedAt?: Date;
  code?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const UserRewardSchema = new Schema<IUserReward>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    rewardId: {
      type: String,
      required: true,
      ref: 'Reward',
      index: true
    },
    status: {
      type: String,
      required: true,
      enum: ['AVAILABLE', 'CLAIMED', 'EXPIRED', 'USED'],
      default: 'CLAIMED'
    },
    claimedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
    code: { type: String },
    metadata: { type: Schema.Types.Mixed }
  },
  {
    timestamps: true,
    collection: 'user_rewards'
  }
);

UserRewardSchema.index({ userId: 1, status: 1 });
UserRewardSchema.index({ expiresAt: 1, status: 1 });
UserRewardSchema.index({ userId: 1, rewardId: 1 });

/**
 * Mongoose model for cross-app sync records
 */
export interface ISyncRecord {
  id: string;
  userId: string;
  source: string;
  target: string;
  coinType: string;
  amount: number;
  direction: 'IN' | 'OUT';
  status: 'PENDING' | 'SYNCED' | 'FAILED' | 'ROLLED_BACK';
  syncedAt?: Date;
  error?: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const SyncRecordSchema = new Schema<ISyncRecord>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    source: {
      type: String,
      required: true,
      enum: ['RABTUL_WALLET', 'REZ_MEDIA_ENGAGEMENT', 'REZ_NOW', 'REZ_APP', 'DOOH', 'KARMA', 'MANUAL', 'SYSTEM']
    },
    target: {
      type: String,
      required: true,
      enum: ['RABTUL_WALLET', 'REZ_MEDIA_ENGAGEMENT', 'REZ_NOW', 'REZ_APP', 'DOOH', 'KARMA', 'MANUAL', 'SYSTEM']
    },
    coinType: {
      type: String,
      required: true,
      enum: ['REZ', 'PROMO', 'BRANDED', 'PRIVE']
    },
    amount: { type: Number, required: true },
    direction: {
      type: String,
      required: true,
      enum: ['IN', 'OUT']
    },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'SYNCED', 'FAILED', 'ROLLED_BACK'],
      default: 'PENDING'
    },
    syncedAt: { type: Date },
    error: { type: String },
    retryCount: { type: Number, default: 0 }
  },
  {
    timestamps: true,
    collection: 'sync_records'
  }
);

SyncRecordSchema.index({ userId: 1, status: 1 });
SyncRecordSchema.index({ status: 1, createdAt: 1 });
SyncRecordSchema.index({ direction: 1, source: 1, target: 1 });

/**
 * Mongoose model for special events (birthdays, anniversaries)
 */
export interface ISpecialEvent {
  userId: string;
  eventType: 'BIRTHDAY' | 'ANNIVERSARY' | 'MEMBERSHIP_DAY';
  eventDate: Date;
  bonusCoinsAwarded: number;
  rewardClaimed: boolean;
  rewardId?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SpecialEventSchema = new Schema<ISpecialEvent>(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    eventType: {
      type: String,
      required: true,
      enum: ['BIRTHDAY', 'ANNIVERSARY', 'MEMBERSHIP_DAY']
    },
    eventDate: { type: Date, required: true },
    bonusCoinsAwarded: { type: Number, default: 0 },
    rewardClaimed: { type: Boolean, default: false },
    rewardId: { type: String },
    processedAt: { type: Date }
  },
  {
    timestamps: true,
    collection: 'special_events'
  }
);

SpecialEventSchema.index({ eventType: 1, eventDate: 1 });
SpecialEventSchema.index({ userId: 1, eventType: 1, eventDate: 1 });

// Export models
export const UserWallet: Model<IUserWallet> = mongoose.model<IUserWallet>('UserWallet', UserWalletSchema);
export const Transaction: Model<ITransaction> = mongoose.model<ITransaction>('Transaction', TransactionSchema);
export const UserTier: Model<IUserTier> = mongoose.model<IUserTier>('UserTier', UserTierSchema);
export const Reward: Model<IReward> = mongoose.model<IReward>('Reward', RewardSchema);
export const UserReward: Model<IUserReward> = mongoose.model<IUserReward>('UserReward', UserRewardSchema);
export const SyncRecord: Model<ISyncRecord> = mongoose.model<ISyncRecord>('SyncRecord', SyncRecordSchema);
export const SpecialEvent: Model<ISpecialEvent> = mongoose.model<ISpecialEvent>('SpecialEvent', SpecialEventSchema);
