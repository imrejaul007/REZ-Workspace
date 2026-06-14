import mongoose, { Document, Schema } from 'mongoose';
import { STATUS } from '../config/constants';

export interface IReferral extends Document {
  referralId: string;
  referrerId: string; // Customer who referred
  referredId: string; // Customer who was referred
  programId: string;
  referrerBonusPoints: number;
  referredBonusPoints: number;
  referrerBonusClaimed: boolean;
  referredBonusClaimed: boolean;
  referredHasMetMinSpend: boolean;
  referredSpendAmount: number;
  status: STATUS;
  createdAt: Date;
  updatedAt: Date;
}

const ReferralSchema = new Schema<IReferral>(
  {
    referralId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    referrerId: {
      type: String,
      required: true,
      index: true,
    },
    referredId: {
      type: String,
      required: true,
      index: true,
    },
    programId: {
      type: String,
      required: true,
      index: true,
    },
    referrerBonusPoints: {
      type: Number,
      default: 100,
    },
    referredBonusPoints: {
      type: Number,
      default: 200,
    },
    referrerBonusClaimed: {
      type: Boolean,
      default: false,
    },
    referredBonusClaimed: {
      type: Boolean,
      default: false,
    },
    referredHasMetMinSpend: {
      type: Boolean,
      default: false,
    },
    referredSpendAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values({
        ACTIVE: 'ACTIVE',
        INACTIVE: 'INACTIVE',
        EXPIRED: 'EXPIRED',
        CANCELLED: 'CANCELLED',
      }),
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

ReferralSchema.index({ referrerId: 1, status: 1 });
ReferralSchema.index({ referredId: 1, status: 1 });
ReferralSchema.index({ referredHasMetMinSpend: 1, status: 1 });

export const Referral = mongoose.model<IReferral>('Referral', ReferralSchema);
