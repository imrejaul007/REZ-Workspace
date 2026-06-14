/**
 * Gym Membership Model
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IMembership extends Document {
  membershipId: string;
  userId: string;
  gymId: string;
  tier: 'basic' | 'standard' | 'premium' | 'vip' | 'corporate';
  status: 'active' | 'expired' | 'frozen' | 'cancelled' | 'pending';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  freezeStartDate?: string;
  freezeEndDate?: string;
  totalPaid: number;
  benefits: string[];
  maxClassesPerWeek?: number;
  personalTrainingSessions: number;
  personalTrainingUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

const MembershipSchema = new Schema<IMembership>({
  membershipId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  gymId: { type: String, required: true, index: true },
  tier: {
    type: String,
    enum: ['basic', 'standard', 'premium', 'vip', 'corporate'],
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'frozen', 'cancelled', 'pending'],
    default: 'pending',
    index: true,
  },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true, index: true },
  autoRenew: { type: Boolean, default: false },
  freezeStartDate: String,
  freezeEndDate: String,
  totalPaid: { type: Number, default: 0 },
  benefits: [String],
  maxClassesPerWeek: Number,
  personalTrainingSessions: { type: Number, default: 0 },
  personalTrainingUsed: { type: Number, default: 0 },
}, { timestamps: true });

MembershipSchema.index({ userId: 1, gymId: 1, status: 1 });
MembershipSchema.index({ endDate: 1, status: 1 });

export const Membership = mongoose.model<IMembership>('GymMembership', MembershipSchema);
