import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

export const InvoiceLineItemSchema = z.object({
  description: z.string(),
  quantity: z.number().default(1),
  unitPrice: z.number(),
  amount: z.number(),
  hsnCode: z.string().optional(),
  deliverableId: z.string().optional()
});

export const InvoiceSchema = z.object({
  paymentId: z.string(),
  invoiceNumber: z.string(),
  influencerId: z.string(),
  brandId: z.string(),
  invoiceDate: z.date(),
  dueDate: z.date(),
  billingAddress: z.object({
    name: z.string(),
    address: z.string(),
    city: z.string(),
    state: z.string(),
    pincode: z.string(),
    gstin: z.string().optional()
  }).optional(),
  lineItems: z.array(InvoiceLineItemSchema),
  subtotal: z.number(),
  taxBreakdown: z.array(z.object({
    type: z.string(),
    rate: z.number(),
    amount: z.number()
  })).optional(),
  totalTax: z.number().optional(),
  totalAmount: z.number(),
  currency: z.string().default('INR'),
  status: z.enum(['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled']).default('draft'),
  paidAt: z.date().optional(),
  paymentReference: z.string().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  createdAt: z.date().optional()
});

export type IInvoice = z.infer<typeof InvoiceSchema>;

const invoiceSchema = new Schema({
  paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
  invoiceNumber: { type: String, required: true, unique: true },
  influencerId: { type: Schema.Types.ObjectId, required: true, index: true },
  brandId: { type: Schema.Types.ObjectId, required: true, index: true },
  invoiceDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  billingAddress: {
    name: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    gstin: String
  },
  lineItems: [{
    description: String,
    quantity: { type: Number, default: 1 },
    unitPrice: Number,
    amount: Number,
    hsnCode: String,
    deliverableId: Schema.Types.ObjectId
  }],
  subtotal: { type: Number, required: true },
  taxBreakdown: [{
    type: String,
    rate: Number,
    amount: Number
  }],
  totalTax: { type: Number },
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  paidAt: { type: Date },
  paymentReference: { type: String },
  notes: { type: String },
  terms: { type: String }
}, {
  timestamps: true
});

invoiceSchema.index({ influencerId: 1, status: 1 });
invoiceSchema.index({ brandId: 1, status: 1 });
invoiceSchema.index({ dueDate: 1 });

export const Invoice = mongoose.model<IInvoice & Document>('Invoice', invoiceSchema);