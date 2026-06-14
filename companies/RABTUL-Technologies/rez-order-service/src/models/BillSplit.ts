/**
 * Bill Split Model
 * Stores bill split information for group orders
 */

import mongoose, { Schema, Document } from 'mongoose';

// TODO: Migrate to import from '@rez/shared-types'
// Example: import { IBillSplit } from '@rez/shared-types/entities/order';

export interface IBillSplit extends Document {
  orderId: string;
  storeId: string;
  totalAmount: number;
  splits: Array<{
    personId: string;
    personName?: string;
    itemIds: string[];
    itemTotal: number;
    sharePercent: number;
    amount: number;
    settled: boolean;
    settledAt?: Date;
  }>;
  status: 'pending' | 'partial' | 'settled';
  createdAt: Date;
  updatedAt: Date;
}

const BillSplitSchema = new Schema(
  {
    orderId: { type: String, required: true, index: true },
    storeId: { type: String, required: true, index: true },
    totalAmount: { type: Number, required: true },
    splits: [
      {
        personId: { type: String, required: true },
        personName: { type: String },
        itemIds: { type: [String], default: [] },
        itemTotal: { type: Number, default: 0 },
        sharePercent: { type: Number, default: 0 },
        amount: { type: Number, required: true },
        settled: { type: Boolean, default: false },
        settledAt: { type: Date },
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'partial', 'settled'],
      default: 'pending',
    },
  },
  { timestamps: true, collection: 'bill_splits' }
);

// Compound indexes
BillSplitSchema.index({ orderId: 1, status: 1 });
BillSplitSchema.index({ storeId: 1, createdAt: -1 });

export const BillSplit = mongoose.model<IBillSplit>('BillSplit', BillSplitSchema);
