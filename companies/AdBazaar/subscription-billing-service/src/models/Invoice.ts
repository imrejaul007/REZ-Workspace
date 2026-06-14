import mongoose, { Document, Schema } from 'mongoose';

export interface IInvoice extends Document {
  invoiceId: string;
  billingId: string;
  userId: string;
  companyId: string;
  invoiceNumber: string;
  amount: number;
  tax: number;
  total: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  dueDate: Date;
  paidAt?: Date;
  paymentMethod?: string;
  transactionId?: string;
  items: { description: string; quantity: number; unitPrice: number; total: number }[];
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceId: { type: String, required: true, unique: true, index: true },
    billingId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    invoiceNumber: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded', 'cancelled'], default: 'pending' },
    dueDate: { type: Date, required: true },
    paidAt: { type: Date },
    paymentMethod: { type: String },
    transactionId: { type: String },
    items: [{
      description: { type: String },
      quantity: { type: Number },
      unitPrice: { type: Number },
      total: { type: Number }
    }]
  },
  { timestamps: true }
);

InvoiceSchema.index({ billingId: 1, createdAt: -1 });
InvoiceSchema.index({ userId: 1, status: 1 });
InvoiceSchema.index({ dueDate: 1, status: 1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);