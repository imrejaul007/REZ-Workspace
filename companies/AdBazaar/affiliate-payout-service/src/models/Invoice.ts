import mongoose, { Schema, Document } from 'mongoose';

export type InvoiceStatus = 'draft' | 'pending' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface IInvoice extends Document {
  invoiceId: string;
  payoutId?: string;
  affiliateId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  tax: number;
  totalAmount: number;
  status: InvoiceStatus;
  period: {
    start: Date;
    end: Date;
  };
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  dueDate: Date;
  paidAt?: Date;
  paymentDetails?: {
    transactionId?: string;
    paymentMethod?: string;
    paidAmount?: number;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceId: { type: String, required: true, unique: true, index: true },
    payoutId: { type: String, index: true },
    affiliateId: { type: String, required: true, index: true },
    invoiceNumber: { type: String, required: true, unique: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['draft', 'pending', 'sent', 'paid', 'overdue', 'cancelled'],
      default: 'draft',
      index: true,
    },
    period: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    lineItems: [{
      description: { type: String, required: true },
      quantity: { type: Number, required: true },
      unitPrice: { type: Number, required: true },
      amount: { type: Number, required: true },
    }],
    dueDate: { type: Date, required: true },
    paidAt: { type: Date },
    paymentDetails: {
      transactionId: { type: String },
      paymentMethod: { type: String },
      paidAmount: { type: Number },
    },
    notes: { type: String },
  },
  { timestamps: true }
);

InvoiceSchema.index({ affiliateId: 1, status: 1 });
InvoiceSchema.index({ status: 1, dueDate: 1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);