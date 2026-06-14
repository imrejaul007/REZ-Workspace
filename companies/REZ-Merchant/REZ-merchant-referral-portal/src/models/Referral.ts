import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReferrer extends Document {
  userId: Types.ObjectId;
  referralCode: string;
  totalReferrals: number;
  successfulReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  withdrawnAmount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReferral extends Document {
  referrerId: Types.ObjectId;
  refereeId: Types.ObjectId;
  referralCode: string;
  status: 'pending' | 'registered' | 'activated' | 'completed' | 'expired' | 'rejected';
  rewardAmount: number;
  rewardType: 'cash' | 'credit' | 'discount';
  referredAt: Date;
  registeredAt?: Date;
  activatedAt?: Date;
  completedAt?: Date;
  expiryDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReferralReward extends Document {
  referralId: Types.ObjectId;
  referrerId: Types.ObjectId;
  type: 'signup' | 'first_order' | 'milestone';
  amount: number;
  status: 'pending' | 'credited' | 'withdrawn' | 'cancelled';
  creditedAt?: Date;
  withdrawnAt?: Date;
  createdAt: Date;
}

const ReferrerSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  referralCode: { type: String, required: true, unique: true, index: true },
  totalReferrals: { type: Number, default: 0 },
  successfulReferrals: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  pendingEarnings: { type: Number, default: 0 },
  withdrawnAmount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const ReferralSchema = new Schema({
  referrerId: { type: Schema.Types.ObjectId, ref: 'Referrer', required: true, index: true },
  refereeId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  referralCode: { type: String, required: true, index: true },
  status: { type: String, enum: ['pending', 'registered', 'activated', 'completed', 'expired', 'rejected'], default: 'pending' },
  rewardAmount: { type: Number, default: 0 },
  rewardType: { type: String, enum: ['cash', 'credit', 'discount'], default: 'credit' },
  referredAt: { type: Date, default: Date.now },
  registeredAt: Date,
  activatedAt: Date,
  completedAt: Date,
  expiryDate: { type: Date, required: true },
  notes: String,
}, { timestamps: true });

ReferralSchema.index({ referralCode: 1, status: 1 });
ReferralSchema.index({ refereeId: 1 });

const ReferralRewardSchema = new Schema({
  referralId: { type: Schema.Types.ObjectId, ref: 'Referral', required: true, index: true },
  referrerId: { type: Schema.Types.ObjectId, ref: 'Referrer', required: true, index: true },
  type: { type: String, enum: ['signup', 'first_order', 'milestone'], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'credited', 'withdrawn', 'cancelled'], default: 'pending' },
  creditedAt: Date,
  withdrawnAt: Date,
}, { timestamps: true });

export const Referrer = mongoose.models.Referrer || mongoose.model<IReferrer>('Referrer', ReferrerSchema);
export const Referral = mongoose.models.Referral || mongoose.model<IReferral>('Referral', ReferralSchema);
export const ReferralReward = mongoose.models.ReferralReward || mongoose.model<IReferralReward>('ReferralReward', ReferralRewardSchema);
