import mongoose, { Document, Schema } from 'mongoose';

export interface IReferral extends Document {
  referralId: string;
  referrerId: string;
  referrerUserId: string;
  refereeId: string;
  refereeUserId: string;
  companyId: string;
  referralCode: string;
  campaignId?: string;
  status: 'pending' | 'completed' | 'rewarded' | 'cancelled';
  source: 'link' | 'code' | 'qr' | 'email' | 'social';
  conversionType?: string;
  convertedAt?: Date;
  rewardAmount: number;
  rewardType: 'points' | 'cash' | 'credit' | 'discount';
  rewardCreditedAt?: Date;
  referralTier: string;
  referredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReferralSchema = new Schema<IReferral>(
  {
    referralId: { type: String, required: true, unique: true, index: true },
    referrerId: { type: String, required: true, index: true },
    referrerUserId: { type: String, required: true, index: true },
    refereeId: { type: String, required: true, index: true },
    refereeUserId: { type: String, required: true },
    companyId: { type: String, required: true, index: true },
    referralCode: { type: String, required: true, index: true },
    campaignId: { type: String, index: true },
    status: { type: String, enum: ['pending', 'completed', 'rewarded', 'cancelled'], default: 'pending' },
    source: { type: String, enum: ['link', 'code', 'qr', 'email', 'social'], required: true },
    conversionType: { type: String },
    convertedAt: { type: Date },
    rewardAmount: { type: Number, default: 0 },
    rewardType: { type: String, enum: ['points', 'cash', 'credit', 'discount'], default: 'points' },
    rewardCreditedAt: { type: Date },
    referralTier: { type: String, default: 'standard' },
    referredAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

ReferralSchema.index({ referrerId: 1, status: 1 });
ReferralSchema.index({ refereeId: 1, status: 1 });
ReferralSchema.index({ referralCode: 1 });
ReferralSchema.index({ companyId: 1, status: 1 });

export const Referral = mongoose.model<IReferral>('Referral', ReferralSchema);