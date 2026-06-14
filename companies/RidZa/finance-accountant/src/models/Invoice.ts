import mongoose, { Schema, Document } from 'mongoose';
import { InvoiceType, InvoiceStatus } from '../types/index.js';

export interface IInvoice extends Document {
  invoiceId: string;
  tenantId: string;
  type: InvoiceType;
  amount: number;
  party: string;
  ledger: string;
  description?: string;
  dueDate?: Date;
  items?: Array<{
    description: string;
    quantity: number;
    rate: number;
    tax?: number;
  }>;
  status: InvoiceStatus;
  tallySync: boolean;
  tallySyncDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  rate: { type: Number, required: true, min: 0 },
  tax: { type: Number, min: 0, max: 100 }
}, { _id: false });

const InvoiceSchema = new Schema<IInvoice>({
  invoiceId: { type: String, required: true, unique: true, index: true },
  tenantId: { type: String, required: true, index: true },
  type: { type: String, required: true, enum: ['sales', 'purchase', 'credit', 'debit'] },
  amount: { type: Number, required: true, min: 0 },
  party: { type: String, required: true },
  ledger: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date },
  items: [InvoiceItemSchema],
  status: {
    type: String,
    enum: ['draft', 'pending', 'paid', 'cancelled'],
    default: 'pending'
  },
  tallySync: { type: Boolean, default: false },
  tallySyncDate: { type: Date }
}, {
  timestamps: true
});

// Compound indexes for common queries
InvoiceSchema.index({ tenantId: 1, status: 1 });
InvoiceSchema.index({ tenantId: 1, type: 1 });
InvoiceSchema.index({ tenantId: 1, dueDate: 1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
