import mongoose, { Document, Schema } from 'mongoose';

// TODO: Migrate to import from '@rez/shared-types'
// Example: import { IPaymentAuditLog } from '@rez/shared-types/entities/payment';

// SD-01: Renamed from TransactionAuditLog to PaymentAuditLog to avoid MongoDB
// model/collection collision with rezbackend's TransactionAuditLog model which
// writes to the 'transactionauditlogs' collection with an incompatible schema.
// This model now owns the 'paymentauditlogs' collection exclusively.

export interface IPaymentAuditLog extends Document {
  action: string;
  paymentId: string;
  userId?: string;
  merchantId?: string;
  amount?: number;
  previousStatus?: string;
  newStatus?: string;
  gatewayResponse?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const PaymentAuditLogSchema = new Schema<IPaymentAuditLog>(
  {
    action: { type: String, required: true, enum: ['initiate', 'capture', 'refund', 'verify', 'reconcile', 'manual_update', 'expire', 'fail', 'refund_confirmed', 'refund_failed'] },
    paymentId: { type: String, required: true, index: true },
    userId: String,
    merchantId: String,
    amount: Number,
    previousStatus: String,
    newStatus: String,
    gatewayResponse: Schema.Types.Mixed,
    metadata: Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Append-only: no updates allowed
PaymentAuditLogSchema.pre('updateOne', function () {
  throw new Error('Audit logs are append-only');
});
PaymentAuditLogSchema.pre('findOneAndUpdate', function () {
  throw new Error('Audit logs are append-only');
});

PaymentAuditLogSchema.index({ createdAt: -1 });
PaymentAuditLogSchema.index({ userId: 1, createdAt: -1 });

export const PaymentAuditLog = mongoose.model<IPaymentAuditLog>('PaymentAuditLog', PaymentAuditLogSchema, 'paymentauditlogs');

// Back-compat alias so existing imports of TransactionAuditLog continue to
// resolve without a global rename in one go. Callers should migrate to
// PaymentAuditLog directly.
export const TransactionAuditLog = PaymentAuditLog;
