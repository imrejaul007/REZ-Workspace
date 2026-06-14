/**
 * Payroll Model
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IPayroll extends Document {
  payrollId: string;
  merchantId: string;
  restaurantId: string;
  employeeId: string;
  periodStart: Date;
  periodEnd: Date;
  regularHours: number;
  overtimeHours: number;
  regularPay: number;
  overtimePay: number;
  grossPay: number;
  deductions: {
    tax: number;
    insurance?: number;
    other?: number;
  };
  netPay: number;
  status: 'pending' | 'approved' | 'paid';
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const payrollSchema = new Schema<IPayroll>({
  payrollId: { type: String, required: true, unique: true },
  merchantId: { type: String, required: true, index: true },
  restaurantId: { type: String, required: true, index: true },
  employeeId: { type: String, required: true, index: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  regularHours: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  regularPay: { type: Number, default: 0 },
  overtimePay: { type: Number, default: 0 },
  grossPay: { type: Number, default: 0 },
  deductions: {
    tax: { type: Number, default: 0 },
    insurance: Number,
    other: Number,
  },
  netPay: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid'],
    default: 'pending'
  },
  paidAt: Date,
  notes: String,
}, { timestamps: true });

payrollSchema.index({ merchantId: 1, restaurantId: 1, periodStart: 1 });
payrollSchema.index({ employeeId: 1, periodStart: 1 });

export const Payroll = mongoose.model<IPayroll>('Payroll', payrollSchema);
