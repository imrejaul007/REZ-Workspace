import mongoose, { Document, Schema } from 'mongoose';

export const MembershipDuration = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly'
} as const;

export const MembershipStatus = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  SUSPENDED: 'suspended'
} as const;

export type MembershipDurationType = typeof MembershipDuration[keyof typeof MembershipDuration];
export type MembershipStatusType = typeof MembershipStatus[keyof typeof MembershipStatus];

export interface IMembership extends Document {
  name: string;
  description: string;
  duration: MembershipDurationType;
  durationDays: number;
  price: number;
  allowedClasses: string[];
  maxClassesPerWeek: number;
  personalTrainingSessions: number;
  accessToPool: boolean;
  accessToSauna: boolean;
  accessToGym: boolean;
  memberDiscount: number;
  isActive: boolean;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

const membershipSchema = new Schema<IMembership>({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  duration: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
    required: true
  },
  durationDays: { type: Number, required: true },
  price: { type: Number, required: true, min: 0 },
  allowedClasses: [{ type: String }],
  maxClassesPerWeek: { type: Number, default: -1 }, // -1 = unlimited
  personalTrainingSessions: { type: Number, default: 0 },
  accessToPool: { type: Boolean, default: false },
  accessToSauna: { type: Boolean, default: false },
  accessToGym: { type: Boolean, default: true },
  memberDiscount: { type: Number, default: 0, min: 0, max: 100 },
  isActive: { type: Boolean, default: true },
  features: [{ type: String }]
}, { timestamps: true });

membershipSchema.index({ isActive: 1 });
membershipSchema.index({ price: 1 });

export const Membership = mongoose.model<IMembership>('Membership', membershipSchema);

// Member Membership Model - tracks which members have which memberships
export interface IMemberMembership extends Document {
  memberId: mongoose.Types.ObjectId;
  membershipId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  status: MembershipStatusType;
  autoRenew: boolean;
  lastBillingDate: Date;
  nextBillingDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const memberMembershipSchema = new Schema<IMemberMembership>({
  memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  membershipId: { type: Schema.Types.ObjectId, ref: 'Membership', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'suspended'],
    default: 'active'
  },
  autoRenew: { type: Boolean, default: false },
  lastBillingDate: { type: Date },
  nextBillingDate: { type: Date }
}, { timestamps: true });

memberMembershipSchema.index({ memberId: 1 });
memberMembershipSchema.index({ endDate: 1 });
memberMembershipSchema.index({ status: 1 });

export const MemberMembership = mongoose.model<IMemberMembership>('MemberMembership', memberMembershipSchema);
