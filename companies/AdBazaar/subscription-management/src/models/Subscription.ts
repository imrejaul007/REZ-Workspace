import mongoose, { Schema, Document } from 'mongoose';
import {
  SubscriptionStatus,
  BillingCycle,
  ISubscription
} from '../types/index.js';

export interface ISubscriptionDocument extends Omit<ISubscription, '_id'>, Document {}

const subscriptionSchema = new Schema<ISubscriptionDocument>(
  {
    publisherId: {
      type: String,
      required: true,
      index: true
    },
    planId: {
      type: String,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.ACTIVE,
      index: true
    },
    billingCycle: {
      type: String,
      enum: Object.values(BillingCycle),
      default: BillingCycle.MONTHLY
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true,
      index: true
    },
    nextBillingDate: {
      type: Date,
      index: true
    },
    trialEndDate: {
      type: Date
    },
    autoRenew: {
      type: Boolean,
      default: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    collection: 'subscriptions'
  }
);

// Indexes for common queries
subscriptionSchema.index({ publisherId: 1, status: 1 });
subscriptionSchema.index({ planId: 1, status: 1 });
subscriptionSchema.index({ nextBillingDate: 1, status: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ createdAt: -1 });

// Virtual for checking if subscription is active
subscriptionSchema.virtual('isActive').get(function () {
  return this.status === SubscriptionStatus.ACTIVE;
});

// Virtual for days remaining
subscriptionSchema.virtual('daysRemaining').get(function () {
  const now = new Date();
  const end = new Date(this.endDate);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Method to check if subscription is expired
subscriptionSchema.methods.isExpired = function (): boolean {
  return new Date() > new Date(this.endDate);
};

// Method to check if trial is over
subscriptionSchema.methods.isTrialOver = function (): boolean {
  if (!this.trialEndDate) return false;
  return new Date() > new Date(this.trialEndDate);
};

export const Subscription = mongoose.model<ISubscriptionDocument>(
  'Subscription',
  subscriptionSchema
);