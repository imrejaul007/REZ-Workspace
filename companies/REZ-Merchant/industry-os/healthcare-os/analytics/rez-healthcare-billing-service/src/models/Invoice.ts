import mongoose, { Schema, Document } from 'mongoose';
import { Invoice as IInvoice, InvoiceStatus } from '../types';

export interface InvoiceDocument extends Omit<IInvoice, '_id'>, Document {}

const InvoiceItemSchema = new Schema({
  description: String,
  quantity: Number,
  unitPrice: Number,
  total: Number
}, { _id: false });

const InvoiceSchema = new Schema<InvoiceDocument>(
  {
    invoiceId: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    appointmentId: { type: String, index: true },
    items: [InvoiceItemSchema],
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'pending', 'paid', 'partial', 'overdue', 'cancelled'],
      default: 'pending',
      index: true
    },
    dueDate: { type: Date, required: true },
    paidAt: { type: Date },
    notes: { type: String }
  },
  { timestamps: true, toJSON: { transform: (_, ret) => { ret.id = ret._id.toString(); delete ret.__v; return ret; } } }
);

InvoiceSchema.index({ patientId: 1, createdAt: -1 });
InvoiceSchema.index({ status: 1, dueDate: 1 });

export const InvoiceModel = mongoose.model<InvoiceDocument>('Invoice', InvoiceSchema);
