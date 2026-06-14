/**
 * CorporateBenefit Model
 * Defines benefit packages that companies can offer to employees
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

// Re-export enums for convenience
export enum BenefitType {
  MEAL = 'meal',
  TRAVEL = 'travel',
  GIFT = 'gift',
  WELLNESS = 'wellness',
  FLEX = 'flex',
  LEARNING = 'learning',
}

export enum BenefitPeriodType {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export enum BenefitStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

/**
 * Benefit allocation rules
 */
export interface IBenefitRule {
  minAmount: number;
  maxAmount: number;
  requiresApproval: boolean;
  autoApprovalLimit: number;
  rolloverEnabled: boolean;
  rolloverMaxAmount: number;
}

/**
 * Corporate Benefit Package
 */
export interface ICorporateBenefit extends Document {
  _id: Types.ObjectId;

  // Company reference
  companyId: Types.ObjectId;

  // Benefit details
  name: string;
  description: string;
  benefitType: BenefitType;

  // Allocation
  amount: number;
  periodType: BenefitPeriodType;

  // Rules
  rules: IBenefitRule;

  // Eligibility
  eligibilityCriteria: {
    departments: string[];
    levels: string[];
    employmentTypes: ('full_time' | 'part_time' | 'contractor')[];
  };

  // Settings
  isActive: boolean;
  startDate: Date;
  endDate?: Date;

  // Stats
  enrolledEmployees: number;
  totalAllocated: number;
  totalUtilized: number;

  // Metadata
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const BenefitRuleSchema = new Schema<IBenefitRule>(
  {
    minAmount: { type: Number, default: 0 },
    maxAmount: { type: Number, default: 0 },
    requiresApproval: { type: Boolean, default: false },
    autoApprovalLimit: { type: Number, default: 5000 },
    rolloverEnabled: { type: Boolean, default: false },
    rolloverMaxAmount: { type: Number, default: 0 },
  },
  { _id: false },
);

const CorporateBenefitSchema = new Schema<ICorporateBenefit>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 1000 },

    benefitType: {
      type: String,
      enum: Object.values(BenefitType),
      required: true,
    },

    amount: { type: Number, required: true, min: 0 },
    periodType: {
      type: String,
      enum: Object.values(BenefitPeriodType),
      default: BenefitPeriodType.MONTHLY,
    },

    rules: {
      type: BenefitRuleSchema,
      default: () => ({
        minAmount: 0,
        maxAmount: 0,
        requiresApproval: false,
        autoApprovalLimit: 5000,
        rolloverEnabled: false,
        rolloverMaxAmount: 0,
      }),
    },

    eligibilityCriteria: {
      departments: [{ type: String }],
      levels: [{ type: String }],
      employmentTypes: [{
        type: String,
        enum: ['full_time', 'part_time', 'contractor'],
      }],
    },

    isActive: { type: Boolean, default: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },

    enrolledEmployees: { type: Number, default: 0 },
    totalAllocated: { type: Number, default: 0 },
    totalUtilized: { type: Number, default: 0 },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    collection: 'corporate_benefits',
  },
);

// Indexes
CorporateBenefitSchema.index({ companyId: 1, benefitType: 1 });
CorporateBenefitSchema.index({ companyId: 1, isActive: 1 });
CorporateBenefitSchema.index({ startDate: 1, endDate: 1 });

export const CorporateBenefit = mongoose.model<ICorporateBenefit>(
  'CorporateBenefit',
  CorporateBenefitSchema,
);
