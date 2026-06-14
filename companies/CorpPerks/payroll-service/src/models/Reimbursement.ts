import mongoose, { Schema, Model } from 'mongoose';
import { IReimbursement, ReimbursementType, ReimbursementStatus } from '../types/index.js';

const reimbursementSchema = new Schema<IReimbursement>(
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
    type: {
      type: String,
      required: true,
      enum: ['travel', 'medical', 'meal', 'phone', 'internet', 'equipment', 'training', 'other'] as ReimbursementType[],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    expenseDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'paid'] as ReimbursementStatus[],
      default: 'pending',
    },
    receipt: {
      type: String, // Base64 encoded or URL
    },
    receiptUrl: {
      type: String,
    },
    approvedBy: {
      type: String,
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    paidAt: {
      type: Date,
    },
    category: {
      type: String,
    },
    projectCode: {
      type: String,
    },
  },
  { timestamps: true }
);

// Indexes
reimbursementSchema.index({ tenantId: 1, employeeId: 1 });
reimbursementSchema.index({ tenantId: 1, status: 1 });
reimbursementSchema.index({ tenantId: 1, type: 1 });
reimbursementSchema.index({ tenantId: 1, expenseDate: 1 });
reimbursementSchema.index({ employeeId: 1, expenseDate: 1 });

export const Reimbursement: Model<IReimbursement> = mongoose.model<IReimbursement>(
  'Reimbursement',
  reimbursementSchema
);
