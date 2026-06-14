import { Schema, model, Types } from 'mongoose';

const ReferralSchema = new Schema(
  {
    referrerId: { type: Types.ObjectId, ref: 'User', required: true },
    referredId: { type: Types.ObjectId, ref: 'User', required: true },
    merchantId: { type: Types.ObjectId, ref: 'Merchant', required: true },
    referralCode: { type: String, required: true, unique: true },
    referrerReward: {
      points: { type: Number, default: 100 },
      awardedAt: { type: Date },
    },
    referredReward: {
      points: { type: Number, default: 50 },
      awardedAt: { type: Date },
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'expired'],
      default: 'pending',
    },
    referralSource: { type: String },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }, // 30 days
  },
  { timestamps: true }
);

// Indexes for efficient queries
ReferralSchema.index({ referralCode: 1 });
ReferralSchema.index({ referrerId: 1 });
ReferralSchema.index({ referredId: 1 });
ReferralSchema.index({ merchantId: 1 });
ReferralSchema.index({ status: 1 });
ReferralSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// TTL index to auto-expire completed referrals older than 1 year
ReferralSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 31536000, partialFilterExpression: { status: 'completed' } });

export const Referral = mongoose.models.Referral || mongoose.model('Referral', ReferralSchema, 'referrals');

// TypeScript interface for type safety
export interface IReferral extends Document {
  referrerId: Types.ObjectId;
  referredId: Types.ObjectId;
  merchantId: Types.ObjectId;
  referralCode: string;
  referrerReward: {
    points: number;
    awardedAt?: Date;
  };
  referredReward: {
    points: number;
    awardedAt?: Date;
  };
  status: 'pending' | 'completed' | 'expired';
  referralSource?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
