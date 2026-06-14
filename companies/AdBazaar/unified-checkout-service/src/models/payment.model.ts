import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  paymentId: string;
  checkoutId: string;
  userId: string;
  amount: number;
  currency: string;
  method: 'upi' | 'card' | 'wallet' | 'netbanking' | 'cod';
  provider?: string;
  providerTransactionId?: string;
  status: 'pending' | 'processing' | 'captured' | 'failed' | 'refunded' | 'partially_refunded';
  metadata?: Record<string, unknown>;
  failureReason?: string;
  refundedAmount?: number;
  capturedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>({
  paymentId: { type: String, required: true, unique: true },
  checkoutId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
  method: {
    type: String,
    enum: ['upi', 'card', 'wallet', 'netbanking', 'cod'],
    required: true
  },
  provider: String,
  providerTransactionId: String,
  status: {
    type: String,
    enum: ['pending', 'processing', 'captured', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
  failureReason: String,
  refundedAmount: { type: Number, default: 0 },
  capturedAt: Date
}, { timestamps: true });

paymentSchema.index({ paymentId: 1 });
paymentSchema.index({ checkoutId: 1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ status: 1 });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);