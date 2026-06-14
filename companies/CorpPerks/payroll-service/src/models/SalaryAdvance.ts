import mongoose, { Schema, Model } from 'mongoose';
import { ISalaryAdvance, AdvanceStatus } from '../types/index.js';

const salaryAdvanceSchema = new Schema<ISalaryAdvance>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    employeeId: {
      type: String,
      required: true,
      index: true,
    },
    employeeName: {
      type: String,
      required: true,
    },
    requestedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    approvedAmount: {
      type: Number,
      default: 0,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'deducted', 'cancelled'] as AdvanceStatus[],
      default: 'pending',
    },
    requestedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    approvedBy: {
      type: String,
    },
    approvedAt: {
      type: Date,
    },
    expectedDeductionMonth: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    expectedDeductionYear: {
      type: Number,
      required: true,
      min: 2020,
      max: 2099,
    },
    actualDeductionMonth: {
      type: Number,
      min: 1,
      max: 12,
    },
    actualDeductionYear: {
      type: Number,
      min: 2020,
      max: 2099,
    },
    rejectionReason: {
      type: String,
    },
  },
  { timestamps: true }
);

// Indexes
salaryAdvanceSchema.index({ tenantId: 1, employeeId: 1 });
salaryAdvanceSchema.index({ tenantId: 1, status: 1 });
salaryAdvanceSchema.index({ tenantId: 1, expectedDeductionMonth: 1, expectedDeductionYear: 1 });

export const SalaryAdvance: Model<ISalaryAdvance> = mongoose.model<ISalaryAdvance>(
  'SalaryAdvance',
  salaryAdvanceSchema
);
