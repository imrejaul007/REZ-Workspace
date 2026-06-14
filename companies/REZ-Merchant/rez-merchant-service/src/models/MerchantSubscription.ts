import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * =====================================================================
 * MerchantSubscription — STUB for future implementation
 * =====================================================================
 *
 * This model represents the merchant's platform subscription (free/pro/enterprise).
 * It is NOT the same as the existing Subscription model, which represents
 * subscriptions that merchants create for their own customers.
 *
 * Canonical reference: @rez/shared-types MerchantSubscriptionPlan
 *
 * Future implementation should:
 *   - Integrate with a payment gateway (Stripe, Razorpay) for recurring billing
 *   - Implement plan upgrade/downgrade with prorated billing
 *   - Add webhook handlers for payment success/failure events
 *   - Add a cron job to check for expired subscriptions and downgrade to free
 *   - Gate merchant features based on planId + features array
 *   - Support trial-to-paid conversion flow
 *
 * Status: STUB — schema only, no service logic yet
 * =====================================================================
 */

export interface IMerchantSubscription extends Document {
  _id: Types.ObjectId;
  /** The merchant this subscription belongs to */
  merchantId: Types.ObjectId;
  /** Plan identifier: free, pro, enterprise */
  planId: 'free' | 'pro' | 'enterprise';
  /** Human-readable plan name */
  planName: string;
  /** Subscription lifecycle status */
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  /** When the subscription started */
  startDate: Date;
  /** When the subscription ends (null for free tier) */
  endDate?: Date;
  /** When the trial period ends (null if not on trial) */
  trialEndsAt?: Date;
  /** Billing frequency */
  billingCycle: 'monthly' | 'yearly';
  /** List of feature flags enabled for this plan */
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MerchantSubscriptionSchema = new Schema<IMerchantSubscription>(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
      unique: true, // One active subscription per merchant
    },
    planId: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      required: true,
      default: 'free',
    },
    planName: {
      type: String,
      required: true,
      default: 'Free',
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired', 'trial'],
      required: true,
      default: 'active',
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    trialEndsAt: {
      type: Date,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
    features: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'merchantsubscriptions',
  },
);

// Indexes for common queries
MerchantSubscriptionSchema.index({ status: 1 });
MerchantSubscriptionSchema.index({ planId: 1, status: 1 });
MerchantSubscriptionSchema.index({ endDate: 1 }, { sparse: true }); // For expiry checks
MerchantSubscriptionSchema.index({ trialEndsAt: 1 }, { sparse: true }); // For trial conversion

export const MerchantSubscription =
  mongoose.models.MerchantSubscription ||
  mongoose.model<IMerchantSubscription>('MerchantSubscription', MerchantSubscriptionSchema);
