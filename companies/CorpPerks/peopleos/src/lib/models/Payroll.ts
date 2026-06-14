import mongoose, { Schema, Document } from 'mongoose';

export interface IPayroll extends Document {
  employeeId: string;
  companyId: string;
  month: string;
  year: number;
  basicSalary: number;
  hra: number;
  allowances: number;
  deductions: number;
  tax: number;
  pf: number;
  esi: number;
  gross: number;
  net: number;
  bonus?: number;
  incentives?: number;
  status: 'pending' | 'processed' | 'paid';
  paidAt?: Date;
  bankRef?: string;
  createdAt: Date;
}

const PayrollSchema = new Schema<IPayroll>({
  employeeId: { type: String, required: true, index: true },
  companyId: { type: String, required: true, index: true },
  month: { type: String, required: true },
  year: { type: Number, required: true },
  basicSalary: { type: Number, required: true },
  hra: { type: Number, default: 0 },
  allowances: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  pf: { type: Number, default: 0 },
  esi: { type: Number, default: 0 },
  gross: { type: Number, required: true },
  net: { type: Number, required: true },
  bonus: Number,
  incentives: Number,
  status: { type: String, enum: ['pending', 'processed', 'paid'], default: 'pending' },
  paidAt: Date,
  bankRef: String,
}, { timestamps: true });

PayrollSchema.index({ companyId: 1, year: -1, month: -1 });

export const Payroll = mongoose.models.Payroll || mongoose.model<IPayroll>('Payroll', PayrollSchema);
