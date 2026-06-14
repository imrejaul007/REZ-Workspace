import mongoose, { Document, Schema } from 'mongoose';

export interface IMember extends Document {
  memberId: string;
  userId: string;
  companyId: string;
  currentTierId: string;
  totalPoints: number;
  lifetimePoints: number;
  pointsToNextTier: number;
  memberSince: Date;
  lastActivity: Date;
  upgradeCount: number;
  downgradeCount: number;
  totalBenefits: number;
  usedBenefits: number;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<IMember>(
  {
    memberId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    currentTierId: { type: String, required: true },
    totalPoints: { type: Number, default: 0 },
    lifetimePoints: { type: Number, default: 0 },
    pointsToNextTier: { type: Number, default: 0 },
    memberSince: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now },
    upgradeCount: { type: Number, default: 0 },
    downgradeCount: { type: Number, default: 0 },
    totalBenefits: { type: Number, default: 0 },
    usedBenefits: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' }
  },
  { timestamps: true }
);

MemberSchema.index({ userId: 1, companyId: 1 });
MemberSchema.index({ totalPoints: -1 });
MemberSchema.index({ status: 1 });

export const Member = mongoose.model<IMember>('Member', MemberSchema);