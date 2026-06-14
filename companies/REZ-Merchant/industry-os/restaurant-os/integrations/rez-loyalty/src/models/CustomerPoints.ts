import mongoose, { Document, Schema } from 'mongoose';
import { TierName, TIER_THRESHOLDS } from '../config/constants';
import { IPointsTransaction } from './PointsTransaction';

export interface ICustomerPoints extends Document {
  customerId: string;
  programId: string;
  currentPoints: number;
  lifetimePoints: number;
  tier: TierName;
  tierProgress: number; // Progress to next tier (0-100%)
  nextTier: TierName | null;
  pointsToNextTier: number;
  lastActivityDate: Date;
  birthdayBonusClaimed: boolean;
  birthdayBonusYear: number;
  referralCount: number;
  referralUserIds: string[];
  restaurantPoints: Map<string, number>; // Pooled points per restaurant
  activePoints: number; // Points not yet expired
  expiringPointsSoon: number; // Points expiring within 30 days
  createdAt: Date;
  updatedAt: Date;
}

const CustomerPointsSchema = new Schema<ICustomerPoints>(
  {
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    programId: {
      type: String,
      required: true,
      index: true,
    },
    currentPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    lifetimePoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    tier: {
      type: String,
      enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
      default: 'BRONZE',
    },
    tierProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    nextTier: {
      type: String,
      enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', null],
      default: 'SILVER',
    },
    pointsToNextTier: {
      type: Number,
      default: 1000,
    },
    lastActivityDate: {
      type: Date,
      default: Date.now,
    },
    birthdayBonusClaimed: {
      type: Boolean,
      default: false,
    },
    birthdayBonusYear: {
      type: Number,
      default: 0,
    },
    referralCount: {
      type: Number,
      default: 0,
    },
    referralUserIds: [
      {
        type: String,
      },
    ],
    restaurantPoints: {
      type: Map,
      of: Number,
      default: {},
    },
    activePoints: {
      type: Number,
      default: 0,
    },
    expiringPointsSoon: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

CustomerPointsSchema.index({ customerId: 1, programId: 1 }, { unique: true });
CustomerPointsSchema.index({ tier: 1 });
CustomerPointsSchema.index({ lastActivityDate: 1 });

// Virtual for populating transactions
CustomerPointsSchema.virtual('transactions', {
  ref: 'PointsTransaction',
  localField: 'customerId',
  foreignField: 'customerId',
});

export const CustomerPoints = mongoose.model<ICustomerPoints>('CustomerPoints', CustomerPointsSchema);
