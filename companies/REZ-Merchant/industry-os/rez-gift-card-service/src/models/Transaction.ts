import mongoose, { Schema, Document } from 'mongoose';

export interface IGiftCardTransaction extends Document {
  transactionId: string;
  cardId: string;
  cardNumber: string;
  type: 'issue' | 'redeem' | 'refund' | 'expire';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  currency: string;
  merchantId: string;
  issuedBy?: string;
  redeemedBy?: string;
  orderId?: string;
  description?: string;
  createdAt: Date;
}

const GiftCardTransactionSchema = new Schema<IGiftCardTransaction>(
  {
    transactionId: { type: String, required: true, unique: true, index: true },
    cardId: { type: String, required: true, index: true },
    cardNumber: { type: String, required: true },
    type: { type: String, enum: ['issue', 'redeem', 'refund', 'expire'], required: true },
    amount: { type: Number, required: true },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    merchantId: { type: String, required: true, index: true },
    issuedBy: { type: String },
    redeemedBy: { type: String },
    orderId: { type: String },
    description: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

GiftCardTransactionSchema.index({ cardId: 1, createdAt: -1 });
GiftCardTransactionSchema.index({ merchantId: 1, createdAt: -1 });

export const GiftCardTransaction = mongoose.model<IGiftCardTransaction>(
  'GiftCardTransaction',
  GiftCardTransactionSchema
);