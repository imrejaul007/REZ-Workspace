import mongoose, { Document, Schema } from 'mongoose';
import { TierName, TIER_THRESHOLDS, TIER_MULTIPLIERS } from '../config/constants';

export interface ILoyaltyProgram extends Document {
  programId: string;
  name: string;
  restaurantId: string;
  isActive: boolean;
  pointsPerRupee: number;
  tierThresholds: typeof TIER_THRESHOLDS;
  tierMultipliers: typeof TIER_MULTIPLIERS;
  birthdayBonusEnabled: boolean;
  birthdayBonusPoints: number;
  referralEnabled: boolean;
  referralBonusPoints: number;
  referredUserBonusPoints: number;
  pointsExpiryMonths: number;
  minRedemptionPoints: number;
  maxRedemptionPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

const LoyaltyProgramSchema = new Schema<ILoyaltyProgram>(
  {
    programId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    restaurantId: {
      type: String,
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    pointsPerRupee: {
      type: Number,
      default: 1,
    },
    tierThresholds: {
      type: Object,
      default: TIER_THRESHOLDS,
    },
    tierMultipliers: {
      type: Object,
      default: TIER_MULTIPLIERS,
    },
    birthdayBonusEnabled: {
      type: Boolean,
      default: true,
    },
    birthdayBonusPoints: {
      type: Number,
      default: 500,
    },
    referralEnabled: {
      type: Boolean,
      default: true,
    },
    referralBonusPoints: {
      type: Number,
      default: 100,
    },
    referredUserBonusPoints: {
      type: Number,
      default: 200,
    },
    pointsExpiryMonths: {
      type: Number,
      default: 12,
    },
    minRedemptionPoints: {
      type: Number,
      default: 100,
    },
    maxRedemptionPoints: {
      type: Number,
      default: 10000,
    },
  },
  {
    timestamps: true,
  }
);

LoyaltyProgramSchema.index({ restaurantId: 1, isActive: 1 });

export const LoyaltyProgram = mongoose.model<ILoyaltyProgram>('LoyaltyProgram', LoyaltyProgramSchema);
