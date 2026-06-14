import mongoose, { Schema, Document } from 'mongoose';

// Plan types
export type PlanType = 'monthly' | 'quarterly' | 'yearly';

// Subscription status types
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired';

// Benefits by plan
export const PLAN_BENEFITS: Record<PlanType, string[]> = {
  monthly: [
    'Free delivery on orders above ₹199',
    '5% instant discount on all orders',
    'Early access to flash sales',
    'Priority customer support'
  ],
  quarterly: [
    'Free delivery on all orders',
    '10% instant discount on all orders',
    'Early access to flash sales',
    'Priority customer support',
    'Exclusive quarterly offers',
    '1 month free subscription'
  ],
  yearly: [
    'FREE delivery on all orders',
    '15% instant discount on all orders',
    'Early access to flash sales',
    'Dedicated priority support',
    'Exclusive monthly offers',
    '3 months FREE subscription',
    'Birthday special rewards',
    'Premium member-only products'
  ]
};

// Plan prices (in INR)
export const PLAN_PRICES: Record<PlanType, number> = {
  monthly: 99,
  quarterly: 249,
  yearly: 799
};

// Plan durations (in days)
export const PLAN_DURATIONS: Record<PlanType, number> = {
  monthly: 30,
  quarterly: 90,
  yearly: 365
};

// Interface for Subscription document
export interface ISubscription extends Document {
  subscriptionId: string;
  userId: string;
  plan: PlanType;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  benefits: string[];
  price: number;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Subscription schema
const subscriptionSchema = new Schema<ISubscription>(
  {
    subscriptionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    plan: {
      type: String,
      required: true,
      enum: ['monthly', 'quarterly', 'yearly']
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'paused', 'cancelled', 'expired'],
      default: 'active'
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: true
    },
    autoRenew: {
      type: Boolean,
      default: true
    },
    benefits: {
      type: [String],
      default: []
    },
    price: {
      type: Number,
      required: true
    },
    paymentId: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'subscriptions'
  }
);

// Compound index for user queries
subscriptionSchema.index({ userId: 1, status: 1 });

// Index for end date based queries
subscriptionSchema.index({ endDate: 1 });

// Pre-save hook to generate subscription ID
subscriptionSchema.pre('save', function (next) {
  if (!this.subscriptionId) {
    this.subscriptionId = `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

// Static method to create a new subscription
subscriptionSchema.statics.createSubscription = async function (
  userId: string,
  plan: PlanType,
  paymentId?: string
): Promise<ISubscription> {
  const benefits = PLAN_BENEFITS[plan];
  const price = PLAN_PRICES[plan];
  const duration = PLAN_DURATIONS[plan];

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + duration);

  const subscription = new this({
    userId,
    plan,
    status: 'active',
    startDate,
    endDate,
    autoRenew: true,
    benefits,
    price,
    paymentId
  });

  await subscription.save();
  return subscription;
};

// Instance method to pause subscription
subscriptionSchema.methods.pause = async function (): Promise<ISubscription> {
  if (this.status !== 'active') {
    throw new Error('Only active subscriptions can be paused');
  }
  this.status = 'paused';
  await this.save();
  return this;
};

// Instance method to resume subscription
subscriptionSchema.methods.resume = async function (): Promise<ISubscription> {
  if (this.status !== 'paused') {
    throw new Error('Only paused subscriptions can be resumed');
  }
  this.status = 'active';
  await this.save();
  return this;
};

// Instance method to cancel subscription
subscriptionSchema.methods.cancel = async function (): Promise<ISubscription> {
  if (this.status === 'cancelled') {
    throw new Error('Subscription is already cancelled');
  }
  this.status = 'cancelled';
  this.autoRenew = false;
  await this.save();
  return this;
};

// Instance method to renew subscription
subscriptionSchema.methods.renew = async function (paymentId?: string): Promise<ISubscription> {
  if (this.status === 'cancelled') {
    throw new Error('Cannot renew a cancelled subscription');
  }

  const duration = PLAN_DURATIONS[this.plan];
  const now = new Date();

  // If subscription has ended, start fresh; otherwise extend
  if (this.endDate <= now) {
    this.startDate = now;
  }
  this.endDate = new Date(this.endDate);
  this.endDate.setDate(this.endDate.getDate() + duration);

  this.status = 'active';
  if (paymentId) {
    this.paymentId = paymentId;
  }
  await this.save();
  return this;
};

// Export the model
export const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema);

// Export utility functions
export { generateSubscriptionId, calculateEndDate };

function generateSubscriptionId(): string {
  return `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

function calculateEndDate(plan: PlanType, startDate?: Date): Date {
  const start = startDate || new Date();
  const duration = PLAN_DURATIONS[plan];
  const endDate = new Date(start);
  endDate.setDate(endDate.getDate() + duration);
  return endDate;
}