import mongoose, { Document, Schema } from 'mongoose';

export interface IRedemption extends Document {
  redemptionId: string;
  rewardId: string;
  userId: string;
  programId?: string;
  pointsSpent: number;
  cashSpent?: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed' | 'expired';
  deliveryMethod?: 'digital' | 'physical' | 'instant';
  deliveryStatus?: 'pending' | 'sent' | 'delivered' | 'failed';
  deliveryDetails?: {
    email?: string;
    address?: string;
    voucherCode?: string;
    redeemUrl?: string;
  };
  redeemedAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const redemptionSchema = new Schema<IRedemption>({
  redemptionId: { type: String, required: true, unique: true },
  rewardId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  programId: String,
  pointsSpent: { type: Number, required: true },
  cashSpent: Number,
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled', 'failed', 'expired'],
    default: 'pending'
  },
  deliveryMethod: {
    type: String,
    enum: ['digital', 'physical', 'instant']
  },
  deliveryStatus: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed']
  },
  deliveryDetails: {
    email: String,
    address: String,
    voucherCode: String,
    redeemUrl: String
  },
  redeemedAt: { type: Date, default: Date.now },
  completedAt: Date,
  expiresAt: Date,
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

redemptionSchema.index({ redemptionId: 1 });
redemptionSchema.index({ rewardId: 1 });
redemptionSchema.index({ userId: 1 });
redemptionSchema.index({ status: 1, redeemedAt: -1 });
redemptionSchema.index({ programId: 1 });

export const Redemption = mongoose.model<IRedemption>('Redemption', redemptionSchema);