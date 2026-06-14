import mongoose, { Schema, Document, Types } from 'mongoose';

// TODO: Migrate to import from '@rez/shared-types'
// Example: import { IReferralConversion } from '@rez/shared-types/entities/wallet';

export interface IReferralConversion extends Document {
  referrerId: Types.ObjectId;
  refereeId: Types.ObjectId;
  status: 'pending' | 'qualified' | 'rewarded' | 'rejected';
  qualifyingAction: 'first_order' | 'first_payment' | 'account_verified';
  qualifyingActionId?: Types.ObjectId;
  rewardAmount: number;
  rewardCoinType: string;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
  qualifiedAt?: Date;
  rewardedAt?: Date;
}

const ReferralConversionSchema = new Schema<IReferralConversion>(
  {
    referrerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refereeId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'qualified', 'rewarded', 'rejected'],
      required: true,
      default: 'pending',
      index: true,
    },
    qualifyingAction: {
      type: String,
      enum: ['first_order', 'first_payment', 'account_verified'],
      required: true,
    },
    qualifyingActionId: { type: Schema.Types.ObjectId },
    rewardAmount: { type: Number, required: true, min: 0 },
    rewardCoinType: { type: String, required: true },
    idempotencyKey: { type: String, sparse: true },
  },
  { timestamps: true },
);

// Compound unique index: one reward per referrer-referee pair
ReferralConversionSchema.index({ referrerId: 1, refereeId: 1 }, { unique: true });

// Index for finding referrer's conversions
ReferralConversionSchema.index({ referrerId: 1, status: 1 });

// Index for finding referee's referral record
ReferralConversionSchema.index({ refereeId: 1, status: 1 });

// Index for idempotency (sparse since some records may not have this)
ReferralConversionSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

export const ReferralConversion = mongoose.model<IReferralConversion>(
  'ReferralConversion',
  ReferralConversionSchema,
);
