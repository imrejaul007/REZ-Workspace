import mongoose, { Schema, Document, Model } from 'mongoose';
import { Plan, PlanType, BillingCycle, UsageType } from '../types';

export interface IPlan extends Document {
  planId: string;
  name: string;
  description?: string;
  planType: PlanType;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  features: string[];
  usageType: UsageType;
  usageLimits: {
    included: number;
    max?: number;
    overageRate?: number;
  };
  trialDays: number;
  gracePeriodDays: number;
  maxUsage?: number;
  isActive: boolean;
  isPublic: boolean;
  sortOrder: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>(
  {
    planId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    planType: {
      type: String,
      enum: Object.values(PlanType),
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR',
      length: 3
    },
    billingCycle: {
      type: String,
      enum: Object.values(BillingCycle),
      required: true
    },
    features: [{
      type: String
    }],
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
    trialDays: {
      type: Number,
      default: 0,
      min: 0
    },
    gracePeriodDays: {
      type: Number,
      default: 7,
      min: 0
    },
    maxUsage: {
      type: Number
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    isPublic: {
      type: Boolean,
      default: true
    },
    sortOrder: {
      type: Number,
      default: 0
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
PlanSchema.index({ planType: 1, billingCycle: 1, isActive: 1 });
PlanSchema.index({ isActive: 1, sortOrder: 1 });
PlanSchema.index({ price: 1, billingCycle: 1 });

// Method to check if plan supports usage
PlanSchema.methods.supportsUsage = function(): boolean {
  return this.usageType !== UsageType.FLAT_RATE || this.usageLimits.included > 0;
};

// Method to get effective price
PlanSchema.methods.getEffectivePrice = function(
  discountPercent?: number,
  discountAmount?: number
): number {
  let price = this.price;

  if (discountPercent && discountPercent > 0) {
    price = price * (1 - discountPercent / 100);
  }

  if (discountAmount && discountAmount > 0) {
    price = Math.max(0, price - discountAmount);
  }

  return Math.round(price * 100) / 100;
};

// Method to calculate overage
PlanSchema.methods.calculateOverage = function(usage: number): number {
  if (usage <= this.usageLimits.included) {
    return 0;
  }

  const overageQuantity = usage - this.usageLimits.included;
  const overageRate = this.usageLimits.overageRate || 0;

  return overageQuantity * overageRate;
};

// Static method to get public plans
PlanSchema.statics.getPublicPlans = function(billingCycle?: BillingCycle) {
  const query: Record<string, unknown> = { isActive: true, isPublic: true };
  if (billingCycle) {
    query.billingCycle = billingCycle;
  }
  return this.find(query).sort({ sortOrder: 1, price: 1 });
};

// Static method to find by ID
PlanSchema.statics.findByPlanId = function(planId: string): Promise<IPlan | null> {
  return this.findOne({ planId, isActive: true });
};

// Static method to seed default plans
PlanSchema.statics.seedDefaultPlans = async function(): Promise<void> {
  const defaultPlans: Partial<Plan>[] = [
    {
      planId: 'free',
      name: 'Free',
      description: 'Basic free plan with limited features',
      planType: PlanType.FREE,
      price: 0,
      billingCycle: BillingCycle.MONTHLY,
      features: ['Basic features', 'Limited API calls'],
      usageType: UsageType.FLAT_RATE,
      usageLimits: { included: 100, max: 100 },
      trialDays: 0,
      gracePeriodDays: 0,
      isActive: true,
      isPublic: true,
      sortOrder: 0
    },
    {
      planId: 'starter',
      name: 'Starter',
      description: 'Perfect for small businesses',
      planType: PlanType.STARTER,
      price: 999,
      billingCycle: BillingCycle.MONTHLY,
      features: [
        'All Free features',
        '5000 API calls/month',
        'Email support',
        'Basic analytics'
      ],
      usageType: UsageType.PER_UNIT,
      usageLimits: { included: 5000, overageRate: 0.20 },
      trialDays: 14,
      gracePeriodDays: 7,
      isActive: true,
      isPublic: true,
      sortOrder: 1
    },
    {
      planId: 'professional',
      name: 'Professional',
      description: 'For growing businesses',
      planType: PlanType.PROFESSIONAL,
      price: 2999,
      billingCycle: BillingCycle.MONTHLY,
      features: [
        'All Starter features',
        '25000 API calls/month',
        'Priority support',
        'Advanced analytics',
        'Custom integrations'
      ],
      usageType: UsageType.PER_UNIT,
      usageLimits: { included: 25000, overageRate: 0.15 },
      trialDays: 14,
      gracePeriodDays: 14,
      isActive: true,
      isPublic: true,
      sortOrder: 2
    },
    {
      planId: 'enterprise',
      name: 'Enterprise',
      description: 'For large organizations',
      planType: PlanType.ENTERPRISE,
      price: 9999,
      billingCycle: BillingCycle.MONTHLY,
      features: [
        'All Professional features',
        'Unlimited API calls',
        'Dedicated support',
        'Custom SLA',
        'White-label options'
      ],
      usageType: UsageType.FLAT_RATE,
      usageLimits: { included: 100000 },
      trialDays: 30,
      gracePeriodDays: 30,
      isActive: true,
      isPublic: true,
      sortOrder: 3
    }
  ];

  for (const planData of defaultPlans) {
    await this.findOneAndUpdate(
      { planId: planData.planId },
      planData,
      { upsert: true, new: true }
    );
  }
};

export const Plan: Model<IPlan> = mongoose.model<IPlan>('Plan', PlanSchema);
