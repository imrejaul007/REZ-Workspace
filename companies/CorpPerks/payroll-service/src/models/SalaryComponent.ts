import mongoose, { Schema, Model } from 'mongoose';
import { ISalaryComponent } from '../types/index.js';

const allowancesSchema = new Schema({
  medical: { type: Number, default: 0 },
  transport: { type: Number, default: 0 },
  communication: { type: Number, default: 0 },
  education: { type: Number, default: 0 },
  food: { type: Number, default: 0 },
  other: { type: Number, default: 0 },
}, { _id: false });

const deductionsSchema = new Schema({
  incomeTax: { type: Number, default: 0 },
  pf: { type: Number, default: 0 },
  esic: { type: Number, default: 0 },
  professionalTax: { type: Number, default: 0 },
  tds: { type: Number, default: 0 },
  other: { type: Number, default: 0 },
}, { _id: false });

const salaryComponentSchema = new Schema<ISalaryComponent>(
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
    basic: {
      type: Number,
      required: true,
      min: 0,
    },
    hra: {
      type: Number,
      required: true,
      min: 0,
    },
    allowances: {
      type: allowancesSchema,
      default: () => ({}),
    },
    deductions: {
      type: deductionsSchema,
      default: () => ({}),
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
    effectiveWorkingDays: {
      type: Number,
      required: true,
      min: 0,
    },
    lossOfPayDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound unique index
salaryComponentSchema.index({ tenantId: 1, employeeId: 1, month: 1, year: 1 }, { unique: true });

// Index for queries
salaryComponentSchema.index({ tenantId: 1, employeeId: 1 });
salaryComponentSchema.index({ tenantId: 1, month: 1, year: 1 });

export const SalaryComponent: Model<ISalaryComponent> = mongoose.model<ISalaryComponent>(
  'SalaryComponent',
  salaryComponentSchema
);
