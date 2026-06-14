import mongoose, { Schema, Document } from 'mongoose';

export type TransactionType = 'payout' | 'refund' | 'adjustment' | 'bonus' | 'fee';
export type TransactionStatus = 'pending' | 'success' | 'failed' | 'reversed';

export interface ITransaction extends Document {
  transactionId: string;
  payoutId: string;
  affiliateId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  balance: number;
  description: string;
  gateway: {
    name: string;
    transactionRef?: string;
    responseCode?: string;
    responseMessage?: string;
  };
  timestamps: {
    initiated: Date;
    processed?: Date;
    settled?: Date;
  };
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    transactionId: { type: String, required: true, unique: true, index: true },
    payoutId: { type: String, required: true, index: true },
    affiliateId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['payout', 'refund', 'adjustment', 'bonus', 'fee'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'reversed'],
      default: 'pending',
      index: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    balance: { type: Number, required: true },
    description: { type: String, required: true },
    gateway: {
      name: { type: String, required: true },
      transactionRef: { type: String },
      responseCode: { type: String },
      responseMessage: { type: String },
    },
    timestamps: {
      initiated: { type: Date, required: true },
      processed: { type: Date },
      settled: { type: Date },
    },
    metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

TransactionSchema.index({ affiliateId: 1, status: 1 });
TransactionSchema.index({ payoutId: 1 });
TransactionSchema.index({ 'timestamps.initiated': -1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);