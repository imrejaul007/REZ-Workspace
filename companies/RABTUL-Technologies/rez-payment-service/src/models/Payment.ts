/**
 * Canonical reference: @rez/shared-types/entities/payment
 * MIGRATED: Using enums and types from @rez/shared-types (aligned, Feb 2026)
 *
 * Canonical enums (source of truth):
 *   - PaymentStatus (11 values): pending, processing, completed, failed, cancelled, expired, refund_initiated, refund_processing, refunded, refund_failed, partially_refunded
 *   - PaymentMethod (4 values): upi, card, wallet, netbanking
 *   - PaymentGateway (3 values): stripe, razorpay, paypal
 */
import mongoose, { Document, Schema } from 'mongoose';
import type { IPayment as SharedIPayment, IPaymentUserDetails, PaymentMetadata } from '@rez/shared-types';
import { PaymentStatus, PaymentMethod, PaymentGateway } from '@rez/shared-types';

// Get all PaymentStatus values as string array for schema enum
const PAYMENT_STATUS_VALUES: string[] = Object.values(PaymentStatus);
const PAYMENT_METHOD_VALUES: string[] = Object.values(PaymentMethod);
const PAYMENT_GATEWAY_VALUES: string[] = Object.values(PaymentGateway);
// MIGRATED: Using IPayment, PaymentStatus, PaymentMethod, PaymentGateway from @rez/shared-types

export interface IPayment extends Document {
  paymentId: string;
  orderId: string;
  user: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  // Using PaymentMethod from @rez/shared-types
  paymentMethod: PaymentMethod;
  // Using PaymentGateway from @rez/shared-types
  gateway?: PaymentGateway;
  purpose: string;
  // Using PaymentStatus from @rez/shared-types
  status: PaymentStatus;
  // Using IPaymentUserDetails from @rez/shared-types
  userDetails: IPaymentUserDetails;
  // Using PaymentMetadata from @rez/shared-types
  metadata: PaymentMetadata;
  gatewayResponse?: {
    gateway: string;
    transactionId?: string;
    paymentUrl?: string;
    qrCode?: string;
    upiId?: string;
    expiryTime?: Date;
    timestamp: Date;
    [key: string];
  };
  failureReason?: string;
  walletCredited?: boolean;
  walletCreditedAt?: Date;
  /** F-01 FIX: Tracks whether a recovery scan has already attempted to re-credit this payment.
   *  Prevents infinite recovery loops if the wallet service is permanently down. */
  walletCreditRecoveryAttempted?: boolean;
  walletCreditRecoveryAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  expiresAt?: Date;
  refundedAmount?: number;
  paymentMeta?: {
    refundDispute?: {
      reportedAt: Date;
      expected: number;
      actual: number;
    };
    [key: string];
  };
  createdAt: Date;
  updatedAt: Date;
  /** Internal property for tracking original status during save for FSM validation */
  _original?: { status: PaymentStatus };
}

// BUG-002 FIX: Import from shared constant for consistency
// Previously had duplicate definition that could drift from webhook routes
import { PAYMENT_MODEL_TRANSITIONS } from '../config/paymentTransitions';

const VALID_TRANSITIONS = PAYMENT_MODEL_TRANSITIONS;

const PaymentSchema = new Schema<IPayment>(
  {
    paymentId: { type: String, required: true, unique: true },
    orderId: { type: String, required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'INR', uppercase: true },
    paymentMethod: {
      type: String, required: true,
      enum: PAYMENT_METHOD_VALUES,
    },
    // Canonical: @rez/shared-types/enums PaymentMethod (HOW customer pays)
    gateway: {
      type: String,
      enum: PAYMENT_GATEWAY_VALUES,
      // WHO processes the payment (optional, determined by payment orchestrator)
    },
    purpose: {
      type: String, required: true, default: 'order_payment',
      enum: ['wallet_topup', 'order_payment', 'event_booking', 'financial_service', 'other'],
    },
    status: {
      type: String, required: true, default: PaymentStatus.PENDING,
      enum: PAYMENT_STATUS_VALUES,
    },
    userDetails: {
      name: String,
      email: String,
      phone: String,
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
    gatewayResponse: Schema.Types.Mixed,
    failureReason: String,
    walletCredited: { type: Boolean, default: false },
    walletCreditedAt: Date,
    completedAt: Date,
    failedAt: Date,
    expiresAt: Date,
    // HIGH BE-PAY-001 FIX: Enforce 2 decimal place precision on refundedAmount (paise precision)
    // Ensures floats like 99.999 cannot cause rounding mismatch in refund full/partial detection.
    // MEDIUM FIX: Validate that refundedAmount never exceeds original amount.
    refundedAmount: {
      type: Number,
      default: 0,
      set: (v: number) => Math.round(v * 100) / 100, // Round to 2 decimal places (paise)
    },
    // FIX: Optimistic locking version field
    // Prevents concurrent updates from causing data loss
    // Must be incremented on every update
    version: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// Track original status so the transition guard can validate changes
PaymentSchema.post('init', function () {
  (this as IPayment)._original = { status: (this as IPayment).status };
});

// State machine pre-save + refund validation
PaymentSchema.pre('save', function (next) {
  const doc = this as IPayment;
  // FIX: Increment version on every update (optimistic locking)
  if (!this.isNew) {
    doc.version = (doc.version || 0) + 1;
  }
  // FSM validation
  if (this.isModified('status') && !this.isNew) {
    const prev = doc._original?.status;
    if (prev) {
      const allowed = VALID_TRANSITIONS[prev] || [];
      if (!allowed.includes(doc.status)) {
        return next(new Error(`Invalid payment transition: ${prev} → ${doc.status}`));
      }
    }
    // Sync _original so chained saves on the same document are validated correctly
    if (doc._original) {
      doc._original.status = doc.status;
    }
  }
  // MEDIUM FIX: Validate refundedAmount never exceeds amount (catch data corruption)
  if (doc.refundedAmount && doc.refundedAmount > doc.amount) {
    return next(new Error(`Refund amount (${doc.refundedAmount}) exceeds payment amount (${doc.amount})`));
  }
  next();
});

// Block TTL on completed payments
PaymentSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { status: { $nin: ['completed'] } } },
);
PaymentSchema.index({ user: 1, status: 1 });
// SCHEMA FIX: Add compound index for user + status + createdAt query pattern
PaymentSchema.index({ user: 1, status: 1, createdAt: -1 });
PaymentSchema.index({ status: 1, createdAt: 1 });
PaymentSchema.index({ 'metadata.razorpayOrderId': 1 }, { sparse: true, background: true });
PaymentSchema.index({ 'metadata.merchantId': 1, status: 1, completedAt: -1 }, { sparse: true, background: true });
// F-01 FIX: Compound index for lost-coins recovery scan — queries completed payments
// where walletCredited=true but walletCreditRecoveryAttempted=false (not yet scanned).
PaymentSchema.index({ status: 1, walletCredited: 1, walletCreditRecoveryAttempted: 1, completedAt: 1 });
PaymentSchema.index({ status: 1, updatedAt: 1 });
// unique: true — prevents duplicate payment initiations for the same orchestrator key.
// sparse: true — entries without this field are excluded (backward compatible with legacy payments).
PaymentSchema.index({ 'metadata.orchestratorIdempotencyKey': 1 }, { sparse: true, unique: true });
// CRIT FIX: Add individual query indexes for status, userId, and orderId.
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ user: 1 });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ user: 1, createdAt: -1 });

// PERFORMANCE FIX: Add indexes for gateway and paymentMethod queries (from Agent 17 audit)
PaymentSchema.index({ gateway: 1 });
PaymentSchema.index({ paymentMethod: 1 });
// Compound index for user payments by method
PaymentSchema.index({ user: 1, paymentMethod: 1, createdAt: -1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);

// Re-export PaymentStatus for use in service files
export { PaymentStatus };
