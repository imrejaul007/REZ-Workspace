import mongoose, { Schema, Document } from 'mongoose';
import { PlanType, BillingCycle, IPlan } from '../types/index.js';

export interface IPlanDocument extends Omit<IPlan, '_id'>, Document {}

const limitsSchema = new Schema(
  {
    screens: { type: Number },
    campaigns: { type: Number },
    impressions: { type: Number },
    users: { type: Number },
    storage: { type: Number }
  },
  { _id: false }
);

const planSchema = new Schema<IPlanDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    type: {
      type: String,
      enum: Object.values(PlanType),
      required: true,
      index: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    billingCycles: [
      {
        type: String,
        enum: Object.values(BillingCycle)
      }
    ],
    features: [
      {
        type: String
      }
    ],
    limits: {
      type: limitsSchema,
      default: {}
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    collection: 'plans'
  }
);

// Indexes
planSchema.index({ type: 1, isActive: 1 });
planSchema.index({ price: 1 });

// Static method to get default plans
planSchema.statics.getDefaultPlans = async function () {
  const defaultPlans = [
    {
      name: 'Starter',
      type: PlanType.STARTER,
      price: 99,
      billingCycles: [BillingCycle.MONTHLY, BillingCycle.YEARLY],
      features: [
        'Up to 5 screens',
        'Basic analytics',
        'Email support',
        'Standard templates',
        '100K impressions/month'
      ],
      limits: {
        screens: 5,
        campaigns: 10,
        impressions: 100000,
        users: 2,
        storage: 5
      }
    },
    {
      name: 'Professional',
      type: PlanType.PROFESSIONAL,
      price: 299,
      billingCycles: [BillingCycle.MONTHLY, BillingCycle.QUARTERLY, BillingCycle.YEARLY],
      features: [
        'Up to 25 screens',
        'Advanced analytics',
        'Priority support',
        'Custom templates',
        '1M impressions/month',
        'A/B testing',
        'API access'
      ],
      limits: {
        screens: 25,
        campaigns: 50,
        impressions: 1000000,
        users: 10,
        storage: 50
      }
    },
    {
      name: 'Enterprise',
      type: PlanType.ENTERPRISE,
      price: 999,
      billingCycles: [BillingCycle.MONTHLY, BillingCycle.QUARTERLY, BillingCycle.YEARLY],
      features: [
        'Unlimited screens',
        'Full analytics suite',
        '24/7 dedicated support',
        'White-label options',
        'Unlimited impressions',
        'Advanced targeting',
        'Full API access',
        'Custom integrations',
        'SLA guarantee'
      ],
      limits: {
        screens: -1, // unlimited
        campaigns: -1,
        impressions: -1,
        users: -1,
        storage: -1
      }
    }
  ];

  for (const plan of defaultPlans) {
    await this.findOneAndUpdate(
      { name: plan.name },
      plan,
      { upsert: true, new: true }
    );
  }
};

export const Plan = mongoose.model<IPlanDocument>('Plan', planSchema);