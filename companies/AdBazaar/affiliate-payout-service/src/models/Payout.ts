import mongoose, { Schema, Document } from 'mongoose';

export type PayoutStatus = 'pending' | 'calculating' | 'ready' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type PayoutMethod = 'bank_transfer' | 'paypal' | 'upi' | 'razorpay';

export interface IPayout extends Document {
  payoutId: string;
  affiliateId: string;
  commissionIds: string[];
  amount: number;
  currency: string;
  method: PayoutMethod;
  status: PayoutStatus;
  fee: number;
  netAmount: number;
  period: {
    start: Date;
    end: Date;
  };
  recipient: {
    name: string;
    email: string;
    accountNumber?: string;
    bankName?: string;
    ifscCode?: string;
    upiId?: string;
  };
  processing: {
    initiatedAt?: Date;
    completedAt?: Date;
    transactionId?: string;
    failureReason?: string;
    retryCount: number;
    lastRetryAt?: Date;
  };
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const PayoutSchema = new Schema<IPayout>(
  {
    payoutId: { type: String, required: true, unique: true, index: true },
    affiliateId: { type: String, required: true, index: true },
    commissionIds: [{ type: String }],
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    method: {
      type: String,
      enum: ['bank_transfer', 'paypal', 'upi', 'razorpay'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'calculating', 'ready', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    fee: { type: Number, default: 0 },
    netAmount: { type: Number, required: true, min: 0 },
    period: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    recipient: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      accountNumber: { type: String },
      bankName: { type: String },
      ifscCode: { type: String },
      upiId: { type: String },
    },
    processing: {
      initiatedAt: { type: Date },
      completedAt: { type: Date },
      transactionId: { type: String },
      failureReason: { type: String },
      retryCount: { type: Number, default: 0 },
      lastRetryAt: { type: Date },
    },
    metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

PayoutSchema.index({ affiliateId: 1, status: 1 });
PayoutSchema.index({ status: 1, createdAt: -1 });

export const Payout = mongoose.model<IPayout>('Payout', PayoutSchema);