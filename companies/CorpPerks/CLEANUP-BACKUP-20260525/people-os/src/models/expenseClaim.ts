/**
 * Expense Claim Model
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IExpenseClaim extends Document {
  claimNumber: string;
  employeeId: string;
  organizationId: string;
  claimType: 'travel' | 'meals' | 'accommodation' | 'communication' | 'equipment' | 'training' | 'other';
  amount: number;
  currency: string;
  expenseDate: Date;
  description: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'reimbursed';
  submittedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  reimbursedAt?: Date;
  paymentReference?: string;
  receipts: {
    filename: string;
    url: string;
    uploadedAt: Date;
  }[];
  projectCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseClaimSchema = new Schema<IExpenseClaim>({
  claimNumber: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true, index: true },
  organizationId: { type: String, required: true, index: true },
  claimType: {
    type: String,
    enum: ['travel', 'meals', 'accommodation', 'communication', 'equipment', 'training', 'other'],
    required: true,
  },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  expenseDate: { type: Date, required: true },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected', 'reimbursed'],
    default: 'draft',
  },
  submittedAt: Date,
  approvedBy: String,
  approvedAt: Date,
  rejectedBy: String,
  rejectedAt: Date,
  rejectionReason: String,
  reimbursedAt: Date,
  paymentReference: String,
  receipts: [{
    filename: { type: String, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  }],
  projectCode: String,
}, { timestamps: true });

ExpenseClaimSchema.index({ claimNumber: 1 }, { unique: true });
ExpenseClaimSchema.index({ employeeId: 1, status: 1 });
ExpenseClaimSchema.index({ organizationId: 1, status: 1 });

export const ExpenseClaim = mongoose.model<IExpenseClaim>('ExpenseClaim', ExpenseClaimSchema);
