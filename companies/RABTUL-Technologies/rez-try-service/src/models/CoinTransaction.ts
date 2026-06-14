/**
 * Coin Transaction Model
 */
import mongoose, { Schema, Document } from 'mongoose';
import { CoinTransaction } from '../types';

export interface ICoinTransaction extends CoinTransaction, Document {}

const CoinTransactionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: ['earned', 'redeemed', 'expired', 'bonus'],
      required: true,
    },
    source: {
      type: String,
      enum: ['trial_completion', 'review', 'campaign', 'referral', 'bundle_purchase', 'manual'],
      required: true,
    },
    referenceId: { type: String, index: true },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

CoinTransactionSchema.index({ userId: 1, createdAt: -1 });

export const CoinTransactionModel = mongoose.model<ICoinTransaction>('CoinTransaction', CoinTransactionSchema);
