/**
 * REZ Go Checkout Recovery Model
 *
 * Handles cart transfer when checkout fails:
 * - Move to counter
 * - Auto-recovery
 * - Staff rescue
 */

import mongoose, { Document, Schema } from 'mongoose';

export type RecoveryStatus = 'pending' | 'transferred' | 'completed' | 'expired' | 'cancelled';
export type RecoveryReason = 'payment_failed' | 'scan_mismatch' | 'fraud_suspicion' | 'network_timeout' | 'user_request' | 'age_restricted' | 'inventory_mismatch' | 'system_error';

export interface IRecoveryTransfer extends Document {
  transferId: string;
  sessionId: string;
  userId: string;
  storeId: string;
  merchantId: string;
  status: RecoveryStatus;
  reason: RecoveryReason;
  cashierId?: string;
  cartSnapshot: {
    items: {
      productId: string;
      barcode: string;
      name: string;
      price: number;
      quantity: number;
      mrp?: number;
    }[];
    subtotal: number;
    tax: number;
    total: number;
    cashbackEarned: number;
  };
  posTransactionId?: string;
  finalAmount?: number;
  paymentMethod?: string;
  notes?: string;
  initiatedAt: Date;
  transferredAt?: Date;
  completedAt?: Date;
  expiresAt: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const RecoveryTransferSchema = new Schema<IRecoveryTransfer>(
  {
    transferId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    sessionId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    storeId: { type: String, required: true, index: true },
    merchantId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'transferred', 'completed', 'expired', 'cancelled'],
      default: 'pending',
    },
    reason: {
      type: String,
      enum: [
        'payment_failed',
        'scan_mismatch',
        'fraud_suspicion',
        'network_timeout',
        'user_request',
        'age_restricted',
        'inventory_mismatch',
        'system_error',
      ],
      required: true,
    },
    cashierId: { type: String },
    cartSnapshot: {
      items: [
        {
          productId: String,
          barcode: String,
          name: String,
          price: Number,
          quantity: Number,
          mrp: Number,
        },
      ],
      subtotal: Number,
      tax: Number,
      total: Number,
      cashbackEarned: Number,
    },
    posTransactionId: { type: String },
    finalAmount: { type: Number },
    paymentMethod: { type: String },
    notes: { type: String },
    initiatedAt: { type: Date, default: Date.now },
    transferredAt: { type: Date },
    completedAt: { type: Date },
    expiresAt: { type: Date, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

RecoveryTransferSchema.index({ status: 1, expiresAt: 1 });
RecoveryTransferSchema.index({ storeId: 1, status: 1 });
RecoveryTransferSchema.index({ sessionId: 1, status: 1 });

export const RecoveryTransfer = mongoose.model<IRecoveryTransfer>(
  'RecoveryTransfer',
  RecoveryTransferSchema
);
