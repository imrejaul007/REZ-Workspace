import mongoose, { Schema, Model } from 'mongoose';
import { IPayslip, PayslipStatus } from '../types/index.js';

const allowancesEmbeddedSchema = new Schema({
  medical: { type: Number, default: 0 },
  transport: { type: Number, default: 0 },
  communication: { type: Number, default: 0 },
  education: { type: Number, default: 0 },
  food: { type: Number, default: 0 },
  other: { type: Number, default: 0 },
}, { _id: false });

const reimbursementEmbeddedSchema = new Schema({
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'paid'], default: 'pending' },
}, { _id: false });

const payslipSchema = new Schema<IPayslip>(
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
    employeeEmail: {
      type: String,
      required: true,
    },
    payrollRunId: {
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
      enum: ['generated', 'approved', 'paid', 'on_hold'] as PayslipStatus[],
      default: 'generated',
    },
    earnings: {
      basic: { type: Number, required: true, min: 0 },
      hra: { type: Number, required: true, min: 0 },
      allowances: {
        type: allowancesEmbeddedSchema,
        default: () => ({}),
      },
      totalEarnings: { type: Number, required: true, min: 0 },
    },
    deductions: {
      pf: { type: Number, default: 0 },
      esic: { type: Number, default: 0 },
      professionalTax: { type: Number, default: 0 },
      incomeTax: { type: Number, default: 0 },
      otherDeductions: { type: Number, default: 0 },
      totalDeductions: { type: Number, required: true, min: 0 },
    },
    grossSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    totalDeductions: {
      type: Number,
      required: true,
      min: 0,
    },
    netSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    takeHome: {
      type: Number,
      required: true,
      min: 0,
    },
    workingDays: {
      type: Number,
      required: true,
      default: 22,
    },
    effectiveWorkingDays: {
      type: Number,
      required: true,
      default: 22,
    },
    lossOfPayDays: {
      type: Number,
      default: 0,
    },
    reimbursements: {
      type: [reimbursementEmbeddedSchema],
      default: [],
    },
    paymentDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
    },
    transactionId: {
      type: String,
    },
    leaveDeductions: {
      type: Number,
      default: 0,
    },
    bonus: {
      type: Number,
      default: 0,
    },
    incentives: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Compound indexes
payslipSchema.index({ tenantId: 1, employeeId: 1, month: 1, year: 1 });
payslipSchema.index({ tenantId: 1, payrollRunId: 1 });
payslipSchema.index({ tenantId: 1, status: 1 });
payslipSchema.index({ tenantId: 1, month: 1, year: 1, status: 1 });

// Unique constraint for one payslip per employee per month/year
payslipSchema.index({ tenantId: 1, employeeId: 1, month: 1, year: 1 }, { unique: true });

export const Payslip: Model<IPayslip> = mongoose.model<IPayslip>('Payslip', payslipSchema);
