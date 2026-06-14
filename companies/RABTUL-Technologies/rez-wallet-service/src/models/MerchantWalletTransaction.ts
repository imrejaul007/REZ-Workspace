/**
 * MerchantWalletTransaction
 *
 * MW-FIX-001: Extracted from the embedded `transactions` array inside MerchantWallet.
 *
 * PROBLEM: The original design embedded transaction sub-documents directly inside the
 * MerchantWallet document.  MongoDB has a hard 16 MB per-document limit.  At roughly
 * 500 – 2,000 orders/month per active merchant the embedded array would breach that
 * limit within 6 – 24 months, causing ALL write operations on the wallet to fail silently.
 *
 * FIX: Each transaction is stored as an independent document in this collection.
 * The MerchantWallet document retains only balance counters and metadata.
 *
 * MIGRATION: Existing embedded transactions can be back-filled with:
 *   db.merchantwallets.find().forEach(w => {
 *     w.transactions.forEach(t => {
 *       db.merchantwallettransactions.insertOne({
 *         merchantId: w._id, ...t
 *       });
 *     });
 *     db.merchantwallets.updateOne({ _id: w._id }, { $unset: { transactions: 1 } });
 *   });
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

// TODO: Migrate to import from '@rez/shared-types'
// Example: import { IMerchantWalletTransaction } from '@rez/shared-types/entities/wallet';

export interface IMerchantWalletTransaction extends Document {
  merchantId: Types.ObjectId;
  type: 'credit' | 'debit' | 'withdrawal' | 'refund' | 'adjustment';
  amount: number;
  platformFee?: number;
  netAmount?: number;
  orderId?: Types.ObjectId;
  orderNumber?: string;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  withdrawalDetails?: {
    bankAccount?: string;
    ifscCode?: string;
    upiId?: string;
    transactionId?: string;
    processedAt?: Date;
  };
  createdAt: Date;
}

const MerchantWalletTransactionSchema = new Schema<IMerchantWalletTransaction>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'MerchantWallet', required: true, index: true },
    type: {
      type: String,
      enum: ['credit', 'debit', 'withdrawal', 'refund', 'adjustment'],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    platformFee: Number,
    netAmount: Number,
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    orderNumber: String,
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'completed',
    },
    withdrawalDetails: Schema.Types.Mixed,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Indexes for fast paginated queries per merchant
MerchantWalletTransactionSchema.index({ merchantId: 1, createdAt: -1 });
MerchantWalletTransactionSchema.index({ merchantId: 1, type: 1, createdAt: -1 });
// Unique index on orderId — prevents double-credit if two concurrent webhook deliveries
// both pass the findOne idempotency check before either has written the transaction.
// sparse:true excludes documents without orderId (withdrawals, adjustments, etc.).
MerchantWalletTransactionSchema.index({ orderId: 1 }, { sparse: true, unique: true });

export const MerchantWalletTransaction = mongoose.model<IMerchantWalletTransaction>(
  'MerchantWalletTransaction',
  MerchantWalletTransactionSchema,
);
