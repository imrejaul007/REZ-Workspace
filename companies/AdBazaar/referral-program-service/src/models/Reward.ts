import mongoose, { Document, Schema } from 'mongoose';

export interface IReward extends Document {
  rewardId: string;
  referralId: string;
  referrerId: string;
  companyId: string;
  rewardType: 'signup' | 'purchase' | 'milestone' | 'tier_upgrade' | 'custom';
  pointsAmount?: number;
  cashAmount?: number;
  creditAmount?: number;
  discountPercent?: number;
  discountCode?: string;
  status: 'pending' | 'issued' | 'claimed' | 'expired' | 'reversed';
  validFrom: Date;
  validUntil: Date;
  claimedAt?: Date;
  issuedAt: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const RewardSchema = new Schema<IReward>(
  {
    rewardId: { type: String, required: true, unique: true, index: true },
    referralId: { type: String, required: true, index: true },
    referrerId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    rewardType: { type: String, enum: ['signup', 'purchase', 'milestone', 'tier_upgrade', 'custom'], required: true },
    pointsAmount: { type: Number },
    cashAmount: { type: Number },
    creditAmount: { type: Number },
    discountPercent: { type: Number },
    discountCode: { type: String },
    status: { type: String, enum: ['pending', 'issued', 'claimed', 'expired', 'reversed'], default: 'pending' },
    validFrom: { type: Date, default: Date.now },
    validUntil: { type: Date },
    claimedAt: { type: Date },
    issuedAt: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

RewardSchema.index({ referralId: 1 });
RewardSchema.index({ referrerId: 1, status: 1 });
RewardSchema.index({ validUntil: 1, status: 1 });

export const Reward = mongoose.model<IReward>('Reward', RewardSchema);