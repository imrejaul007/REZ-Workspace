import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IPointsTransaction {
  id: string;
  customerId: string;
  type: 'earned' | 'redeemed' | 'expired' | 'adjusted' | 'bonus';
  points: number;
  balance: number;
  orderId?: string;
  rewardId?: string;
  description?: string;
  expiresAt?: Date;
  isExpired: boolean;
  createdAt: Date;
}

export interface ICustomerLoyalty {
  id: string;
  customerId: string;
  programId: string;
  currentTier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  totalPoints: number;
  availablePoints: number;
  lifetimePoints: number;
  pointsEarned: number;
  pointsRedeemed: number;
  tierProgress: number;
  nextTier?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | null;
  pointsToNextTier: number;
  birthdayPointsClaimed: boolean;
  anniversaryPointsClaimed: boolean;
  lastActivityDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomerLoyaltyDocument extends Omit<ICustomerLoyalty, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const PointsTransactionSchema = new Schema<IPointsTransaction>({
  id: { type: String, default: () => uuidv4() },
  customerId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ['earned', 'redeemed', 'expired', 'adjusted', 'bonus'],
    required: true,
  },
  points: { type: Number, required: true },
  balance: { type: Number, required: true },
  orderId: { type: String },
  rewardId: { type: String },
  description: { type: String },
  expiresAt: { type: Date },
  isExpired: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const CustomerLoyaltySchema = new Schema<ICustomerLoyaltyDocument>({
  id: { type: String, default: () => uuidv4(), unique: true, index: true },
  customerId: { type: String, required: true, unique: true, index: true },
  programId: { type: String, required: true, index: true },
  currentTier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    default: 'bronze',
  },
  totalPoints: { type: Number, default: 0, min: 0 },
  availablePoints: { type: Number, default: 0, min: 0 },
  lifetimePoints: { type: Number, default: 0, min: 0 },
  pointsEarned: { type: Number, default: 0, min: 0 },
  pointsRedeemed: { type: Number, default: 0, min: 0 },
  tierProgress: { type: Number, default: 0, min: 0, max: 100 },
  nextTier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond', null],
    default: 'silver',
  },
  pointsToNextTier: { type: Number, default: 0, min: 0 },
  birthdayPointsClaimed: { type: Boolean, default: false },
  anniversaryPointsClaimed: { type: Boolean, default: false },
  lastActivityDate: { type: Date },
}, {
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

// Indexes
CustomerLoyaltySchema.index({ currentTier: 1 });
CustomerLoyaltySchema.index({ availablePoints: -1 });
CustomerLoyaltySchema.index({ lastActivityDate: -1 });

export const CustomerLoyalty = mongoose.model<ICustomerLoyaltyDocument>('CustomerLoyalty', CustomerLoyaltySchema);
export const PointsTransaction = mongoose.model<IPointsTransaction>('PointsTransaction', PointsTransactionSchema);

export default CustomerLoyalty;
