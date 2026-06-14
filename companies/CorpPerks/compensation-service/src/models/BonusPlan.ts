import mongoose, { Schema, Document } from 'mongoose';
import { IBonusPlan, IBonusEligibility } from '../types/index.js';

export interface BonusPlanDocument extends Omit<IBonusPlan, '_id'>, Document {}
export interface BonusEligibilityDocument extends Omit<IBonusEligibility, '_id'>, Document {}

const tierSchema = new Schema(
  {
    minRating: { type: Number, required: true, min: 1, max: 5 },
    maxRating: { type: Number, required: true, min: 1, max: 5 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const bonusPlanCriteriaSchema = new Schema(
  {
    minPerformanceRating: { type: Number, min: 1, max: 5 },
    eligibilityType: {
      type: String,
      enum: ['all', 'performance_based', 'tiered'],
      default: 'all',
    },
    tiers: { type: [tierSchema], default: undefined },
    minTenureMonths: { type: Number, min: 0 },
  },
  { _id: false }
);

const bonusPlanSchema = new Schema<BonusPlanDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    type: {
      type: String,
      enum: ['annual', 'quarterly', 'performance', 'signing', 'retention'],
      required: true,
    },
    criteria: {
      type: bonusPlanCriteriaSchema,
      default: () => ({}),
    },
    payoutDate: {
      type: Date,
      required: true,
    },
    budget: {
      type: Number,
      default: null,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'completed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id?.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
bonusPlanSchema.index({ type: 1 });
bonusPlanSchema.index({ status: 1 });
bonusPlanSchema.index({ payoutDate: 1 });

export const BonusPlan = mongoose.model<BonusPlanDocument>('BonusPlan', bonusPlanSchema);

const bonusEligibilitySchema = new Schema<BonusEligibilityDocument>(
  {
    employeeId: {
      type: String,
      required: true,
      trim: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'BonusPlan',
      required: true,
    },
    calculatedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['eligible', 'pending', 'paid', 'not_eligible'],
      default: 'eligible',
    },
    paidAt: {
      type: Date,
      default: null,
    },
    paidBy: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id?.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
bonusEligibilitySchema.index({ employeeId: 1 });
bonusEligibilitySchema.index({ planId: 1 });
bonusEligibilitySchema.index({ status: 1 });
bonusEligibilitySchema.index({ employeeId: 1, planId: 1 }, { unique: true });

export const BonusEligibility = mongoose.model<BonusEligibilityDocument>('BonusEligibility', bonusEligibilitySchema);
