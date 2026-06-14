import mongoose, { Schema, Document } from 'mongoose';

// TODO: Migrate to import from '@rez/shared-types'
// Example: import { ICreditScore } from '@rez/shared-types/entities/payment';

export interface ICreditScore extends Document {
  userId: string;
  phone: string;

  paymentHistory: number;
  walletStability: number;
  spendingRegularity: number;
  engagementScore: number;

  compositeScore: number;

  riskTier: 'LOW' | 'MEDIUM' | 'HIGH';
  creditLimit: number;
  interestRate: number;

  creditUsed: number;
  creditAvailable: number;

  lastCalculated: Date;
  nextCalculation: Date;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const creditScoreSchema = new Schema<ICreditScore>({
  userId: { type: String, required: true, unique: true, index: true },
  phone: { type: String, required: true, index: true },

  paymentHistory: { type: Number, default: 0, min: 0, max: 100 },
  walletStability: { type: Number, default: 0, min: 0, max: 100 },
  spendingRegularity: { type: Number, default: 0, min: 0, max: 100 },
  engagementScore: { type: Number, default: 0, min: 0, max: 100 },

  compositeScore: { type: Number, default: 0, min: 300, max: 850 },

  riskTier: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'HIGH'
  },
  creditLimit: { type: Number, default: 0 },
  interestRate: { type: Number, default: 3 },

  creditUsed: { type: Number, default: 0 },
  creditAvailable: { type: Number, default: 0 },

  lastCalculated: Date,
  nextCalculation: Date,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

creditScoreSchema.index({ compositeScore: -1 });
creditScoreSchema.index({ riskTier: 1 });

export const CreditScore = mongoose.model<ICreditScore>('CreditScore', creditScoreSchema);
