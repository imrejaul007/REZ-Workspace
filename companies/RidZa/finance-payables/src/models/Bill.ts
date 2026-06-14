/**
 * Bill MongoDB Model
 */
import mongoose, { Schema, Document } from 'mongoose';
import { Bill } from '../types';

export interface IBill extends Omit<Bill, '_id'>, Document {}

const LineItemSchema = new Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  unitPrice: { type: Number, required: true, min: 0 },
  tax: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
}, { _id: false });

const BillSchema = new Schema<IBill>({
  billId: { type: String, required: true, unique: true, index: true },
  tenantId: { type: String, required: true, index: true },
  vendorId: { type: String, required: true, index: true },
  invoiceNumber: { type: String, required: true, trim: true },
  invoiceDate: { type: Date, required: true },
  dueDate: { type: Date, required: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  taxAmount: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'scheduled', 'paid', 'overdue', 'cancelled'],
    default: 'pending',
    index: true
  },
  category: { type: String, trim: true },
  description: { type: String },
  lineItems: [LineItemSchema],
  attachments: [{ type: String }],
  scheduledPaymentDate: { type: Date },
  paidDate: { type: Date },
  paidAmount: { type: Number, min: 0 },
  paymentReference: { type: String },
  paymentMethod: { type: String },
  notes: { type: String },
}, {
  timestamps: true,
  collection: 'bills'
});

// Compound indexes
BillSchema.index({ tenantId: 1, billId: 1 }, { unique: true });
BillSchema.index({ tenantId: 1, vendorId: 1 });
BillSchema.index({ tenantId: 1, status: 1 });
BillSchema.index({ tenantId: 1, dueDate: 1 });
BillSchema.index({ tenantId: 1, invoiceNumber: 1 });

// Virtual for checking overdue
BillSchema.virtual('isOverdue').get(function() {
  return this.status === 'pending' && new Date() > this.dueDate;
});

// Ensure virtuals are included in JSON output
BillSchema.set('toJSON', { virtuals: true });
BillSchema.set('toObject', { virtuals: true });

export const BillModel = mongoose.model<IBill>('Bill', BillSchema);
