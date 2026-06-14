import mongoose, { Document, Schema } from 'mongoose';
import { CustomerTier } from './CheckIn';

export interface ILoyaltyPoints extends Document {
  loyaltyId: string;
  customerId: string;
  customerPhone: string;
  customerName: string;
  totalPoints: number;
  availablePoints: number;
  lifetimeVisits: number;
  tier: CustomerTier;
  birthday: Date | null;
  referralCode: string;
  referredBy: string | null;
  referralCount: number;
  tierHistory: Array<{ tier: CustomerTier; updatedAt: Date }>;
  lastCheckIn: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const LoyaltyPointsSchema = new Schema<ILoyaltyPoints>(
  {
    loyaltyId: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, required: true, unique: true, index: true },
    customerPhone: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    totalPoints: { type: Number, default: 0 },
    availablePoints: { type: Number, default: 0 },
    lifetimeVisits: { type: Number, default: 0 },
    tier: { type: String, enum: Object.values(CustomerTier), default: CustomerTier.SILVER },
    birthday: { type: Date, default: null },
    referralCode: { type: String, required: true, unique: true },
    referredBy: { type: String, default: null },
    referralCount: { type: Number, default: 0 },
    tierHistory: [
      {
        tier: { type: String, enum: Object.values(CustomerTier) },
        updatedAt: { type: Date },
      },
    ],
    lastCheckIn: { type: Date, default: null },
  },
  { timestamps: true }
);

// Index for referral code lookup
LoyaltyPointsSchema.index({ referralCode: 1 }, { unique: true });

export const LoyaltyPoints = mongoose.model<ILoyaltyPoints>('LoyaltyPoints', LoyaltyPointsSchema);
