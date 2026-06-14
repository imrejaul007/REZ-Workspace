import mongoose, { Schema, Document, Model } from 'mongoose';
import { IInvoice, InvoiceItem } from '../types/index.js';

export interface InvoiceDocument extends Omit<IInvoice, '_id'>, Document {}

const invoiceItemSchema = new Schema<InvoiceItem>(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const invoiceSchema = new Schema<InvoiceDocument>(
  {
    invoiceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
    },
    clientId: {
      type: String,
      required: true,
      index: true,
    },
    dealId: { type: String, index: true },
    proposalId: { type: String, index: true },
    items: [invoiceItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: ['INR', 'USD'],
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'],
      default: 'draft',
      index: true,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    sentAt: { type: Date },
    paidDate: { type: Date },
    paymentMethod: { type: String },
    paymentReference: { type: String },
    notes: { type: String },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes
invoiceSchema.index({ tenantId: 1, clientId: 1 });
invoiceSchema.index({ tenantId: 1, dealId: 1 });
invoiceSchema.index({ tenantId: 1, status: 1 });
invoiceSchema.index({ tenantId: 1, dueDate: 1 });
invoiceSchema.index({ tenantId: 1, invoiceNumber: 1 });

// Generate invoice ID and number before saving
invoiceSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await mongoose.model('Invoice').countDocuments({ tenantId: this.tenantId });

    if (!this.invoiceId) {
      this.invoiceId = `INV-${String(count + 1).padStart(5, '0')}`;
    }

    if (!this.invoiceNumber) {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      this.invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;
    }

    // Auto-mark as overdue if past due date
    if (this.status === 'sent' && new Date() > this.dueDate) {
      this.status = 'overdue';
    }
  }
  next();
});

// Index for overdue invoices
invoiceSchema.index({ status: 1, dueDate: 1 });

export const Invoice: Model<InvoiceDocument> = mongoose.model<InvoiceDocument>('Invoice', invoiceSchema);
