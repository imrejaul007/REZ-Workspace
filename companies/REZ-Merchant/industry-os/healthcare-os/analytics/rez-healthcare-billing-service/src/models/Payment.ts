import mongoose, { Schema, Document } from 'mongoose';
import { Payment as IPayment } from '../types';

export interface PaymentDocument extends Omit<IPayment, '_id'>, Document {}

const PaymentSchema = new Schema<PaymentDocument>(
  {
    paymentId: { type: String, required: true, unique: true, index: true },
    invoiceId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ['cash', 'card', 'upi', 'insurance', 'bank_transfer'],
      required: true
    },
    reference: { type: String },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    processedAt: { type: Date, default: Date.now }
  },
  { timestamps: true, toJSON: { transform: (_, ret) => { ret.id = ret._id.toString(); delete ret.__v; return ret; } } }
);

PaymentSchema.index({ invoiceId: 1 });

export const PaymentModel = mongoose.model<PaymentDocument>('Payment', PaymentSchema);
