import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { TierConfig, RewardType } from '../types';

const TierConfigSchema = new Schema<TierConfig>({
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    required: true,
  },
  name: { type: String, required: true },
  minPoints: { type: Number, required: true, min: 0 },
  pointsMultiplier: { type: Number, default: 1, min: 0 },
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  freeDeliveryThreshold: { type: Number, default: 0, min: 0 },
  birthdayBonus: { type: Number, default: 0, min: 0 },
  anniversaryBonus: { type: Number, default: 0, min: 0 },
  perks: [{ type: String }],
}, { _id: false });

export interface ILoyaltyProgram {
  id: string;
  name: string;
  description?: string;
  pointsPerRupee: number;
  rupeesPerPoint: number;
  pointsExpirationDays?: number;
  minRedemptionPoints: number;
  welcomePoints: number;
  referralPoints: number;
  tiers: TierConfig[];
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILoyaltyProgramDocument extends Omit<ILoyaltyProgram, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const LoyaltyProgramSchema = new Schema<ILoyaltyProgramDocument>({
  id: { type: String, default: () => uuidv4(), unique: true, index: true },
  name: { type: String, required: true, maxlength: 100 },
  description: { type: String, maxlength: 500 },
  pointsPerRupee: { type: Number, default: 1, min: 0 },
  rupeesPerPoint: { type: Number, default: 0.25, min: 0 },
  pointsExpirationDays: { type: Number, min: 1 },
  minRedemptionPoints: { type: Number, default: 100, min: 1 },
  welcomePoints: { type: Number, default: 0, min: 0 },
  referralPoints: { type: Number, default: 0, min: 0 },
  tiers: [TierConfigSchema],
  isActive: { type: Boolean, default: true },
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
}, {
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

export const LoyaltyProgram = mongoose.model<ILoyaltyProgramDocument>('LoyaltyProgram', LoyaltyProgramSchema);

export default LoyaltyProgram;
