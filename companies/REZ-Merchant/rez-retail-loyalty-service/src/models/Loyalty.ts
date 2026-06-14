import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ILoyaltyProgram extends Document {
  name: string;
  description: string;
  type: 'points' | 'tiered' | 'cashback';
  earningRules: {
    perRupee: number;
    bonusEvents: { event: string; multiplier: number }[];
  };
  redemptionRules: {
    pointsValue: number;
    minRedemption: number;
    maxRedemptionPerTransaction: number;
  };
  tiers: {
    name: string;
    minPoints: number;
    benefits: string[];
    discountPercentage: number;
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILoyaltyAccount extends Document {
  customerId: Types.ObjectId;
  programId: Types.ObjectId;
  points: number;
  lifetimePoints: number;
  tier: string;
  tierProgress: number;
  enrolledAt: Date;
  lastActivityAt: Date;
}

export interface ILoyaltyTransaction extends Document {
  accountId: Types.ObjectId;
  customerId: Types.ObjectId;
  type: 'earn' | 'redeem' | 'expire' | 'adjust';
  points: number;
  balance: number;
  source: 'purchase' | 'manual' | 'promotion' | 'expiry';
  referenceId?: Types.ObjectId;
  referenceType?: string;
  description: string;
  createdAt: Date;
}

export interface IReward extends Document {
  programId: Types.ObjectId;
  name: string;
  description: string;
  pointsCost: number;
  type: 'discount' | 'product' | 'voucher' | 'experience';
  value: number;
  validityDays: number;
  stock: number;
  isActive: boolean;
}

// Program Schema
const LoyaltyProgramSchema = new Schema<ILoyaltyProgram>({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  type: { type: String, enum: ['points', 'tiered', 'cashback'], default: 'points' },
  earningRules: {
    perRupee: { type: Number, default: 1 },
    bonusEvents: [{
      event: String,
      multiplier: Number
    }]
  },
  redemptionRules: {
    pointsValue: { type: Number, default: 0.01 },
    minRedemption: { type: Number, default: 100 },
    maxRedemptionPerTransaction: { type: Number, default: 1000 }
  },
  tiers: [{
    name: String,
    minPoints: Number,
    benefits: [String],
    discountPercentage: Number
  }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Account Schema
const LoyaltyAccountSchema = new Schema<ILoyaltyAccount>({
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, unique: true },
  programId: { type: Schema.Types.ObjectId, ref: 'LoyaltyProgram', required: true },
  points: { type: Number, default: 0 },
  lifetimePoints: { type: Number, default: 0 },
  tier: { type: String, default: 'bronze' },
  tierProgress: { type: Number, default: 0 },
  enrolledAt: { type: Date, default: Date.now },
  lastActivityAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Transaction Schema
const LoyaltyTransactionSchema = new Schema<ILoyaltyTransaction>({
  accountId: { type: Schema.Types.ObjectId, ref: 'LoyaltyAccount', required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  type: { type: String, enum: ['earn', 'redeem', 'expire', 'adjust'], required: true },
  points: { type: Number, required: true },
  balance: { type: Number, required: true },
  source: { type: String, enum: ['purchase', 'manual', 'promotion', 'expiry'], default: 'manual' },
  referenceId: Schema.Types.ObjectId,
  referenceType: String,
  description: { type: String, default: '' }
}, { timestamps: true });

// Reward Schema
const RewardSchema = new Schema<IReward>({
  programId: { type: Schema.Types.ObjectId, ref: 'LoyaltyProgram', required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  pointsCost: { type: Number, required: true },
  type: { type: String, enum: ['discount', 'product', 'voucher', 'experience'], default: 'discount' },
  value: { type: Number, default: 0 },
  validityDays: { type: Number, default: 30 },
  stock: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const LoyaltyProgram = mongoose.model<ILoyaltyProgram>('LoyaltyProgram', LoyaltyProgramSchema);
export const LoyaltyAccount = mongoose.model<ILoyaltyAccount>('LoyaltyAccount', LoyaltyAccountSchema);
export const LoyaltyTransaction = mongoose.model<ILoyaltyTransaction>('LoyaltyTransaction', LoyaltyTransactionSchema);
export const Reward = mongoose.model<IReward>('Reward', RewardSchema);