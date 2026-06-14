import mongoose, { Schema, Model } from 'mongoose';
import { IPayrollRun, PayrollRunStatus } from '../types/index.js';

const payrollRunSchema = new Schema<IPayrollRun>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
      min: 2020,
      max: 2099,
    },
    status: {
      type: String,
      enum: ['draft', 'processing', 'completed', 'failed', 'cancelled'] as PayrollRunStatus[],
      default: 'draft',
    },
    totalEmployees: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    processedEmployees: {
      type: Number,
      default: 0,
    },
    failedEmployees: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    processedBy: {
      type: String,
      required: true,
    },
    errorMessage: {
      type: String,
    },
    payslips: [{
      type: Schema.Types.ObjectId,
      ref: 'Payslip',
    }],
  },
  { timestamps: true }
);

// Compound index for unique payroll run per month/year/tenant
payrollRunSchema.index({ tenantId: 1, month: 1, year: 1 }, { unique: true });

// Index for filtering
payrollRunSchema.index({ tenantId: 1, status: 1 });
payrollRunSchema.index({ tenantId: 1, 'year': 1, 'month': 1 });

export const PayrollRun: Model<IPayrollRun> = mongoose.model<IPayrollRun>('PayrollRun', payrollRunSchema);
