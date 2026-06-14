import mongoose, { Schema, Document } from 'mongoose';

export type CoopFundStatus = 'active' | 'paused' | 'expired' | 'depleted';
export type CoopFundType = 'standard' | 'accelerated' | 'tiered';

export interface ICoopFund extends Document {
  fundId: string;
  advertiserId: string;
  name: string;
  type: CoopFundType;
  status: CoopFundStatus;
  totalBudget: number;
  allocatedBudget: number;
  spentBudget: number;
  availableBudget: number;
  currency: string;
  rules: {
    minSpend: number;
    maxContribution: number;
    contributionPercent: number;
    eligibleCategories: string[];
    excludedProducts: string[];
    startDate: Date;
    endDate: Date;
  };
  partnerEligibility: {
    tiers: string[];
    minimumPerformance: number;
    approvedPartners: string[];
  };
  tracking: {
    totalClaims: number;
    approvedClaims: number;
    rejectedClaims: number;
    totalSpent: number;
    avgClaimValue: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CoopFundSchema = new Schema<ICoopFund>(
  {
    fundId: { type: String, required: true, unique: true, index: true },
    advertiserId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['standard', 'accelerated', 'tiered'],
      default: 'standard',
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'expired', 'depleted'],
      default: 'active',
      index: true,
    },
    totalBudget: { type: Number, required: true, min: 0 },
    allocatedBudget: { type: Number, default: 0 },
    spentBudget: { type: Number, default: 0 },
    availableBudget: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    rules: {
      minSpend: { type: Number, default: 1000 },
      maxContribution: { type: Number, default: 50000 },
      contributionPercent: { type: Number, default: 50 },
      eligibleCategories: [{ type: String }],
      excludedProducts: [{ type: String }],
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },
    partnerEligibility: {
      tiers: [{ type: String }],
      minimumPerformance: { type: Number, default: 0 },
      approvedPartners: [{ type: String }],
    },
    tracking: {
      totalClaims: { type: Number, default: 0 },
      approvedClaims: { type: Number, default: 0 },
      rejectedClaims: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
      avgClaimValue: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

CoopFundSchema.index({ advertiserId: 1, status: 1 });
CoopFundSchema.index({ 'rules.startDate': 1, 'rules.endDate': 1 });

export const CoopFund = mongoose.model<ICoopFund>('CoopFund', CoopFundSchema);