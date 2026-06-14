import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  paymentId: string;
  invoiceId: string;
  billingId: string;
  userId: string;
  companyId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  method: 'card' | 'upi' | 'netbanking' | 'wallet' | 'bank_transfer';
  provider: string;
  providerTransactionId?: string;
  initiatedAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    paymentId: { type: String, required: true, unique: true, index: true },
    invoiceId: { type: String, required: true, index: true },
    billingId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'refunded'], default: 'pending' },
    method: { type: String, enum: ['card', 'upi', 'netbanking', 'wallet', 'bank_transfer'], required: true },
    provider: { type: String, required: true },
    providerTransactionId: { type: String },
    initiatedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    failedAt: { type: Date },
    failureReason: { type: String },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

PaymentSchema.index({ invoiceId: 1 });
PaymentSchema.index({ billingId: 1, status: 1 });
PaymentSchema.index({ userId: 1, createdAt: -1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);