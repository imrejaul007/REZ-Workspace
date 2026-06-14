import mongoose, { Schema, Document } from 'mongoose';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type PaymentMethod = 'bank_transfer' | 'paypal' | 'upi';

export interface IPayment extends Document {
  paymentId: string;
  affiliateId: string;
  commissionIds: string[];
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  recipientDetails: {
    name: string;
    email: string;
    accountNumber?: string;
    bankName?: string;
    ifscCode?: string;
    upiId?: string;
  };
  transactionDetails: {
    transactionId?: string;
    referenceNumber?: string;
    initiatedAt?: Date;
    completedAt?: Date;
    failureReason?: string;
  };
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    paymentId: { type: String, required: true, unique: true, index: true },
    affiliateId: { type: String, required: true, index: true },
    commissionIds: [{ type: String }],
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    method: {
      type: String,
      enum: ['bank_transfer', 'paypal', 'upi'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    recipientDetails: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      accountNumber: { type: String },
      bankName: { type: String },
      ifscCode: { type: String },
      upiId: { type: String },
    },
    transactionDetails: {
      transactionId: { type: String },
      referenceNumber: { type: String },
      initiatedAt: { type: Date },
      completedAt: { type: Date },
      failureReason: { type: String },
    },
    metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Indexes
PaymentSchema.index({ affiliateId: 1, status: 1 });
PaymentSchema.index({ status: 1, createdAt: -1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);