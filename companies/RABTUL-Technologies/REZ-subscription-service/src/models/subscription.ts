import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  BillingCycle,
  SubscriptionStatus,
  PlanType,
  UsageType,
  DunningState,
  Address,
  Plan
} from '../types';

// Subscription Schema
export interface ISubscription extends Document {
  // Core identifiers
  subscriptionId: string;
  customerId: string;
  planId: string;

  // Plan details (denormalized for performance)
  plan: Plan;

  // Billing configuration
  billingCycle: BillingCycle;
  billingAnchorDay?: number;
  autoRenew: boolean;

  // Status and dates
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart?: Date;
  trialEnd?: Date;
  cancelledAt?: Date;
  cancellationEffectiveDate?: Date;
  pausedAt?: Date;
  pauseReason?: string;
  resumeDate?: Date;
  expiredAt?: Date;

  // Payment information
  paymentMethodId?: string;
  lastPaymentDate?: Date;
  nextPaymentDate: Date;

  // Financial
  basePrice: number;
  currentTotal: number;
  currency: string;

  // Usage tracking
  usageThisPeriod: number;
  usageIncluded: number;
  usageOverageRate?: number;
  usageType: UsageType;

  // Dunning state
  dunningState: DunningState;
  dunningStartedAt?: Date;
  retryCount: number;
  nextRetryDate?: Date;

  // Grace period
  gracePeriodEnd?: Date;
  isInGracePeriod: boolean;

  // Metadata and tags
  metadata: Record<string, unknown>;
  tags: string[];

  // Billing address
  billingAddress?: Address;

  // Coupon and discounts
  couponCode?: string;
  discountPercent?: number;
  discountAmount?: number;

  // Referral
  referralCode?: string;

  // Cancellation
  cancellationReason?: string;
  cancellationFeedback?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Methods
  calculateNextBillingDate(): Date;
  calculateProration(fromPlan: Plan, toPlan: Plan): number;
  isActive(): boolean;
  isTrialing(): boolean;
  isPastDue(): boolean;
  canTransitionTo(newStatus: SubscriptionStatus): boolean;
}

const AddressSchema = new Schema({
  line1: { type: String, required: true },
  line2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, default: 'IN', length: 2 }
}, { _id: false });

const PlanSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR', length: 3 },
  billingCycle: {
    type: String,
    enum: Object.values(BillingCycle),
    required: true
  },
  features: [{ type: String }],
  usageType: {
    type: String,
    enum: Object.values(UsageType),
    default: UsageType.FLAT_RATE
  },
  usageLimits: {
    included: { type: Number, default: 0, min: 0 },
    max: { type: Number },
    overageRate: { type: Number }
  },
  trialDays: { type: Number, default: 0, min: 0 },
  gracePeriodDays: { type: Number, default: 7, min: 0 },
  maxUsage: { type: Number },
  metadata: { type: Schema.Types.Mixed }
}, { _id: false });

const SubscriptionSchema = new Schema<ISubscription>(
  {
    subscriptionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    customerId: {
      type: String,
      required: true,
      index: true
    },
    planId: {
      type: String,
      required: true
    },
    plan: {
      type: PlanSchema,
      required: true
    },
    billingCycle: {
      type: String,
      enum: Object.values(BillingCycle),
      required: true
    },
    billingAnchorDay: {
      type: Number,
      min: 1,
      max: 28
    },
    autoRenew: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.PENDING,
      index: true
    },
    currentPeriodStart: {
      type: Date,
      required: true
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
      index: true
    },
    trialStart: {
      type: Date
    },
    trialEnd: {
      type: Date,
      index: true
    },
    cancelledAt: {
      type: Date
    },
    cancellationEffectiveDate: {
      type: Date
    },
    pausedAt: {
      type: Date
    },
    pauseReason: {
      type: String
    },
    resumeDate: {
      type: Date
    },
    expiredAt: {
      type: Date
    },
    paymentMethodId: {
      type: String
    },
    lastPaymentDate: {
      type: Date
    },
    nextPaymentDate: {
      type: Date,
      required: true,
      index: true
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    currentTotal: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR',
      length: 3
    },
    usageThisPeriod: {
      type: Number,
      default: 0,
      min: 0
    },
    usageIncluded: {
      type: Number,
      default: 0,
      min: 0
    },
    usageOverageRate: {
      type: Number
    },
    usageType: {
      type: String,
      enum: Object.values(UsageType),
      default: UsageType.FLAT_RATE
    },
    dunningState: {
      type: String,
      enum: Object.values(DunningState),
      default: DunningState.NONE,
      index: true
    },
    dunningStartedAt: {
      type: Date
    },
    retryCount: {
      type: Number,
      default: 0
    },
    nextRetryDate: {
      type: Date
    },
    gracePeriodEnd: {
      type: Date
    },
    isInGracePeriod: {
      type: Boolean,
      default: false
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    tags: [{
      type: String
    }],
    billingAddress: {
      type: AddressSchema
    },
    couponCode: {
      type: String
    },
    discountPercent: {
      type: Number,
      min: 0,
      max: 100
    },
    discountAmount: {
      type: Number,
      min: 0
    },
    referralCode: {
      type: String
    },
    cancellationReason: {
      type: String
    },
    cancellationFeedback: {
      type: String
    }
  },
  {
    timestamps: true,
    collection: 'subscriptions'
  }
);

// Indexes for common queries
SubscriptionSchema.index({ customerId: 1, status: 1 });
SubscriptionSchema.index({ 'plan.billingCycle': 1, status: 1 });
SubscriptionSchema.index({ nextPaymentDate: 1, status: 1 });
SubscriptionSchema.index({ trialEnd: 1, status: 1 });
SubscriptionSchema.index({ createdAt: -1 });
SubscriptionSchema.index({ dunningState: 1, nextRetryDate: 1 });

// Virtual for days remaining in current period
SubscriptionSchema.virtual('daysRemainingInPeriod').get(function() {
  const now = new Date();
  const end = new Date(this.currentPeriodEnd);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Virtual for MRR contribution
SubscriptionSchema.virtual('mrrContribution').get(function() {
  return this.currentTotal;
});

// Method to calculate next billing date based on billing cycle
SubscriptionSchema.methods.calculateNextBillingDate = function(): Date {
  const now = new Date();
  let nextDate = new Date(this.currentPeriodEnd);

  switch (this.billingCycle) {
    case BillingCycle.DAILY:
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case BillingCycle.WEEKLY:
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case BillingCycle.MONTHLY:
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case BillingCycle.QUARTERLY:
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case BillingCycle.YEARLY:
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }

  return nextDate;
};

// Method to calculate proration
SubscriptionSchema.methods.calculateProration = function(fromPlan: Plan, toPlan: Plan): number {
  const now = new Date();
  const periodStart = new Date(this.currentPeriodStart);
  const periodEnd = new Date(this.currentPeriodEnd);

  const totalDays = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
  const daysElapsed = (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
  const daysRemaining = totalDays - daysElapsed;

  const unusedCredit = (fromPlan.price / totalDays) * daysRemaining;
  const newPlanCost = (toPlan.price / totalDays) * daysRemaining;

  return Math.max(0, newPlanCost - unusedCredit);
};

// Method to check if subscription is active
SubscriptionSchema.methods.isActive = function(): boolean {
  return this.status === SubscriptionStatus.ACTIVE;
};

// Method to check if subscription is in trial
SubscriptionSchema.methods.isTrialing = function(): boolean {
  if (this.status !== SubscriptionStatus.TRIALING) return false;
  if (!this.trialEnd) return false;
  return new Date() < this.trialEnd;
};

// Method to check if subscription is past due
SubscriptionSchema.methods.isPastDue = function(): boolean {
  return this.status === SubscriptionStatus.PAST_DUE;
};

// Method to validate status transitions
SubscriptionSchema.methods.canTransitionTo = function(newStatus: SubscriptionStatus): boolean {
  const validTransitions: Record<SubscriptionStatus, SubscriptionStatus[]> = {
    [SubscriptionStatus.PENDING]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING, SubscriptionStatus.CANCELLED],
    [SubscriptionStatus.TRIALING]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELLED, SubscriptionStatus.EXPIRED],
    [SubscriptionStatus.ACTIVE]: [SubscriptionStatus.PAUSED, SubscriptionStatus.PAST_DUE, SubscriptionStatus.CANCELLED, SubscriptionStatus.EXPIRED],
    [SubscriptionStatus.PAST_DUE]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAUSED, SubscriptionStatus.CANCELLED, SubscriptionStatus.EXPIRED],
    [SubscriptionStatus.PAUSED]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELLED],
    [SubscriptionStatus.CANCELLED]: [SubscriptionStatus.ACTIVE],
    [SubscriptionStatus.EXPIRED]: [SubscriptionStatus.ACTIVE]
  };

  return validTransitions[this.status]?.includes(newStatus) ?? false;
};

// Pre-save hook for validation
SubscriptionSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.canTransitionTo(this.status)) {
    next(new Error(`Invalid status transition from ${this.status}`));
  }
  next();
});

// Static method to find active subscriptions by customer
SubscriptionSchema.statics.findByCustomer = function(customerId: string) {
  return this.find({ customerId }).sort({ createdAt: -1 });
};

// Static method to find subscriptions due for billing
SubscriptionSchema.statics.findDueForBilling = function(date: Date) {
  return this.find({
    status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
    nextPaymentDate: { $lte: date },
    autoRenew: true
  });
};

// Static method to find trial subscriptions ending soon
SubscriptionSchema.statics.findTrialsEndingSoon = function(daysBeforeEnd: number) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysBeforeEnd);

  return this.find({
    status: SubscriptionStatus.TRIALING,
    trialEnd: { $lte: futureDate, $gt: new Date() }
  });
};

// Static method to find past due subscriptions
SubscriptionSchema.statics.findPastDue = function() {
  return this.find({
    status: SubscriptionStatus.PAST_DUE,
    isInGracePeriod: true
  });
};

// Static method to find subscriptions in dunning
SubscriptionSchema.statics.findInDunning = function() {
  return this.find({
    dunningState: { $ne: DunningState.NONE },
    status: { $in: [SubscriptionStatus.PAST_DUE, SubscriptionStatus.ACTIVE] }
  });
};

// Export model
export const Subscription: Model<ISubscription> = mongoose.model<ISubscription>(
  'Subscription',
  SubscriptionSchema
);
