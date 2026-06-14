import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

export const PaymentLineItemSchema = z.object({
  description: z.string(),
  quantity: z.number().default(1),
  unitPrice: z.number(),
  amount: z.number(),
  deliverableId: z.string().optional(),
  milestone: z.string().optional()
});

export const PaymentSchema = z.object({
  influencerId: z.string(),
  campaignId: z.string().optional(),
  contractId: z.string().optional(),
  brandId: z.string(),
  invoiceNumber: z.string().optional(),
  type: z.enum(['fixed', 'milestone', 'performance', 'retainer']).default('fixed'),
  status: z.enum(['pending', 'approved', 'processing', 'completed', 'failed', 'cancelled', 'refunded']).default('pending'),
  currency: z.string().default('INR'),
  amount: z.number(),
  tax: z.object({
    rate: z.number().optional(),
    amount: z.number().optional(),
    type: z.enum(['gst', 'tds', 'both']).optional()
  }).optional(),
  lineItems: z.array(PaymentLineItemSchema),
  totalAmount: z.number(),
  paymentMethod: z.enum(['bank_transfer', 'upi', 'paytm', 'razorpay', 'wallet']).optional(),
  paymentReference: z.string().optional(),
  paymentDate: z.date().optional(),
  dueDate: z.date().optional(),
  approvedBy: z.string().optional(),
  approvedAt: z.date().optional(),
  processedBy: z.string().optional(),
  processedAt: z.date().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export type IPayment = z.infer<typeof PaymentSchema>;
export type IPaymentLineItem = z.infer<typeof PaymentLineItemSchema>;

const paymentSchema = new Schema({
  influencerId: { type: Schema.Types.ObjectId, required: true, index: true },
  campaignId: { type: Schema.Types.ObjectId, index: true },
  contractId: { type: Schema.Types.ObjectId, index: true },
  brandId: { type: Schema.Types.ObjectId, required: true, index: true },
  invoiceNumber: { type: String, unique: true, sparse: true },
  type: {
    type: String,
    enum: ['fixed', 'milestone', 'performance', 'retainer'],
    default: 'fixed'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  currency: { type: String, default: 'INR' },
  amount: { type: Number, required: true },
  tax: {
    rate: Number,
    amount: Number,
    type: {
      type: String,
      enum: ['gst', 'tds', 'both']
    }
  },
  lineItems: [{
    description: String,
    quantity: { type: Number, default: 1 },
    unitPrice: Number,
    amount: Number,
    deliverableId: Schema.Types.ObjectId,
    milestone: String
  }],
  totalAmount: { type: Number, required: true },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'upi', 'paytm', 'razorpay', 'wallet']
  },
  paymentReference: { type: String },
  paymentDate: { type: Date },
  dueDate: { type: Date, index: true },
  approvedBy: { type: String },
  approvedAt: { type: Date },
  processedBy: { type: String },
  processedAt: { type: Date },
  notes: { type: String },
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true
});

paymentSchema.index({ influencerId: 1, status: 1 });
paymentSchema.index({ brandId: 1, status: 1 });
paymentSchema.index({ dueDate: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });

// Generate invoice number before saving
paymentSchema.pre('save', function(next) {
  if (!this.invoiceNumber) {
    const date = new Date();
    const prefix = `INV${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.invoiceNumber = `${prefix}${random}`;
  }
  next();
});

export const Payment = mongoose.model<IPayment & Document>('Payment', paymentSchema);