import mongoose, { Document, Schema } from 'mongoose';

export interface IUpgrade extends Document {
  upgradeId: string;
  memberId: string;
  userId: string;
  fromTierId: string;
  toTierId: string;
  fromTierName: string;
  toTierName: string;
  pointsAtUpgrade: number;
  reason: string;
  triggeredBy: 'points' | 'manual' | 'campaign' | 'system';
  approvedBy?: string;
  notes?: string;
  effectiveDate: Date;
  expiresAt?: Date;
  isReversed: boolean;
  reversedAt?: Date;
  reversedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UpgradeSchema = new Schema<IUpgrade>(
  {
    upgradeId: { type: String, required: true, unique: true, index: true },
    memberId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    fromTierId: { type: String, required: true },
    toTierId: { type: String, required: true },
    fromTierName: { type: String, required: true },
    toTierName: { type: String, required: true },
    pointsAtUpgrade: { type: Number, required: true },
    reason: { type: String, required: true },
    triggeredBy: { type: String, enum: ['points', 'manual', 'campaign', 'system'], required: true },
    approvedBy: { type: String },
    notes: { type: String },
    effectiveDate: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    isReversed: { type: Boolean, default: false },
    reversedAt: { type: Date },
    reversedReason: { type: String }
  },
  { timestamps: true }
);

UpgradeSchema.index({ memberId: 1, createdAt: -1 });
UpgradeSchema.index({ userId: 1 });
UpgradeSchema.index({ triggeredBy: 1 });

export const Upgrade = mongoose.model<IUpgrade>('Upgrade', UpgradeSchema);