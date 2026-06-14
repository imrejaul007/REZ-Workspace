import mongoose, { Schema, Document } from 'mongoose';
import { InvoiceStatus, IInvoice } from '../types/index.js';

export interface IInvoiceDocument extends Omit<IInvoice, '_id'>, Document {}

const lineItemSchema = new Schema(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true }
  },
  { _id: false }
);

const invoiceSchema = new Schema<IInvoiceDocument>(
  {
    subscriptionId: {
      type: String,
      required: true,
      index: true
    },
    publisherId: {
      type: String,
      required: true,
      index: true
    },
    planId: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    status: {
      type: String,
      enum: Object.values(InvoiceStatus),
      default: InvoiceStatus.PENDING,
      index: true
    },
    billingPeriodStart: {
      type: Date,
      required: true
    },
    billingPeriodEnd: {
      type: Date,
      required: true
    },
    dueDate: {
      type: Date,
      required: true,
      index: true
    },
    paidDate: {
      type: Date
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true
    },
    lineItems: [lineItemSchema],
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    collection: 'invoices'
  }
);

// Indexes
invoiceSchema.index({ publisherId: 1, status: 1 });
invoiceSchema.index({ subscriptionId: 1, createdAt: -1 });
invoiceSchema.index({ dueDate: 1, status: 1 });
invoiceSchema.index({ createdAt: -1 });

// Pre-save hook to generate invoice number
invoiceSchema.pre('save', async function (next) {
  if (this.isNew && !this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments();
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const sequence = String(count + 1).padStart(6, '0');
    this.invoiceNumber = `INV-${year}${month}-${sequence}`;
  }
  next();
});

// Virtual for days overdue
invoiceSchema.virtual('daysOverdue').get(function () {
  if (this.status === InvoiceStatus.PAID || this.status === InvoiceStatus.CANCELLED) {
    return 0;
  }
  const now = new Date();
  const due = new Date(this.dueDate);
  const diff = now.getTime() - due.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

export const Invoice = mongoose.model<IInvoiceDocument>('Invoice', invoiceSchema);