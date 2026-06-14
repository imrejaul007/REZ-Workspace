/**
 * CorporateEmployee Model
 * Links users to companies with enrollment and benefit tracking
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

export enum EnrollmentStatus {
  PENDING = 'pending',
  ENROLLED = 'enrolled',
  SUSPENDED = 'suspended',
  TERMINATED = 'terminated',
}

export enum CorpRole {
  CORP_ADMIN = 'corp_admin',
  CORP_HR = 'corp_hr',
  CORP_FINANCE = 'corp_finance',
  CORP_MANAGER = 'corp_manager',
  CORP_EMPLOYEE = 'corp_employee',
}

/**
 * Benefit enrollment record
 */
export interface IBenefitEnrollment {
  benefitId: Types.ObjectId;
  benefitType: string;
  allocatedAmount: number;
  utilizedAmount: number;
  remainingAmount: number;
  enrolledAt: Date;
  lastResetDate: Date;
  rolloverAmount: number;
  isActive: boolean;
}

/**
 * Corporate Employee - links user to company with roles and enrollments
 */
export interface ICorporateEmployee extends Document {
  _id: Types.ObjectId;

  // User reference
  userId: Types.ObjectId;

  // Company reference
  companyId: Types.ObjectId;

  // Employment details
  employeeId: string;           // Company employee ID
  department: string;
  level: string;
  designation: string;
  employmentType: 'full_time' | 'part_time' | 'contractor';

  // Reporting
  managerId?: Types.ObjectId;  // Reference to another CorporateEmployee

  // Roles
  corpRole: CorpRole;

  // Enrollment
  enrollmentStatus: EnrollmentStatus;
  enrolledAt?: Date;
  terminatedAt?: Date;

  // Benefits
  benefits: IBenefitEnrollment[];

  // Spending limits
  spendingLimits: {
    dailyLimit: number;
    monthlyLimit: number;
    transactionLimit: number;
  };

  // GST details
  gstIn?: string;
  pan?: string;

  // Stats
  stats: {
    totalOrders: number;
    totalSpend: number;
    totalSavings: number;
    lastOrderAt?: Date;
  };

  // Metadata
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const BenefitEnrollmentSchema = new Schema<IBenefitEnrollment>(
  {
    benefitId: { type: Schema.Types.ObjectId, ref: 'CorporateBenefit', required: true },
    benefitType: { type: String, required: true },
    allocatedAmount: { type: Number, default: 0 },
    utilizedAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    enrolledAt: { type: Date, default: Date.now },
    lastResetDate: { type: Date, default: Date.now },
    rolloverAmount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false },
);

const SpendingLimitsSchema = new Schema<{ dailyLimit: number; monthlyLimit: number; transactionLimit: number }>(
  {
    dailyLimit: { type: Number, default: 10000 },
    monthlyLimit: { type: Number, default: 50000 },
    transactionLimit: { type: Number, default: 5000 },
  },
  { _id: false },
);

const CorporateEmployeeSchema = new Schema<ICorporateEmployee>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },

    employeeId: { type: String, required: true },
    department: { type: String, required: true },
    level: { type: String, default: 'L1' },
    designation: { type: String },
    employmentType: {
      type: String,
      enum: ['full_time', 'part_time', 'contractor'],
      default: 'full_time',
    },

    managerId: { type: Schema.Types.ObjectId, ref: 'CorporateEmployee' },

    corpRole: {
      type: String,
      enum: Object.values(CorpRole),
      default: CorpRole.CORP_EMPLOYEE,
    },

    enrollmentStatus: {
      type: String,
      enum: Object.values(EnrollmentStatus),
      default: EnrollmentStatus.PENDING,
    },
    enrolledAt: { type: Date },
    terminatedAt: { type: Date },

    benefits: { type: [BenefitEnrollmentSchema], default: [] },

    spendingLimits: {
      type: SpendingLimitsSchema,
      default: () => ({
        dailyLimit: 10000,
        monthlyLimit: 50000,
        transactionLimit: 5000,
      }),
    },

    gstIn: { type: String },
    pan: { type: String },

    stats: {
      totalOrders: { type: Number, default: 0 },
      totalSpend: { type: Number, default: 0 },
      totalSavings: { type: Number, default: 0 },
      lastOrderAt: { type: Date },
    },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    collection: 'corporate_employees',
  },
);

// Unique constraint on user+company
CorporateEmployeeSchema.index({ userId: 1, companyId: 1 }, { unique: true });
CorporateEmployeeSchema.index({ companyId: 1, department: 1 });
CorporateEmployeeSchema.index({ companyId: 1, enrollmentStatus: 1 });
CorporateEmployeeSchema.index({ companyId: 1, corpRole: 1 });

export const CorporateEmployee = mongoose.model<ICorporateEmployee>(
  'CorporateEmployee',
  CorporateEmployeeSchema,
);
