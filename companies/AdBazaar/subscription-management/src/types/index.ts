import { z } from 'zod';

// Subscription Status
export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  PENDING = 'pending',
  TRIAL = 'trial'
}

// Plan Types
export enum PlanType {
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
  CUSTOM = 'custom'
}

// Billing Cycle
export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

// Invoice Status
export enum InvoiceStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

// Event Types
export enum SubscriptionEventType {
  CREATED = 'created',
  RENEWED = 'renewed',
  CANCELLED = 'cancelled',
  UPGRADED = 'upgraded',
  DOWNGRADED = 'downgraded',
  PAUSED = 'paused',
  RESUMED = 'resumed',
  EXPIRED = 'expired',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_SUCCESS = 'payment_success',
  TRIAL_STARTED = 'trial_started',
  TRIAL_ENDED = 'trial_ended'
}

// Zod Schemas
export const CreateSubscriptionSchema = z.object({
  publisherId: z.string().min(1, 'Publisher ID is required'),
  planId: z.string().min(1, 'Plan ID is required'),
  billingCycle: z.nativeEnum(BillingCycle).default(BillingCycle.MONTHLY),
  startDate: z.string().datetime().optional(),
  trialDays: z.number().int().min(0).max(90).default(0),
  metadata: z.record(z.any()).optional()
});

export const UpdateSubscriptionSchema = z.object({
  status: z.nativeEnum(SubscriptionStatus).optional(),
  billingCycle: z.nativeEnum(BillingCycle).optional(),
  autoRenew: z.boolean().optional(),
  metadata: z.record(z.any()).optional()
});

export const UpgradeDowngradeSchema = z.object({
  newPlanId: z.string().min(1, 'New Plan ID is required'),
  effectiveDate: z.enum(['immediate', 'end_of_cycle']).default('end_of_cycle'),
  preserveCredits: z.boolean().default(true)
});

export const PlanSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(PlanType),
  price: z.number().positive(),
  billingCycles: z.array(z.nativeEnum(BillingCycle)),
  features: z.array(z.string()),
  limits: z.object({
    screens: z.number().int().positive().optional(),
    campaigns: z.number().int().positive().optional(),
    impressions: z.number().int().positive().optional(),
    users: z.number().int().positive().optional(),
    storage: z.number().int().positive().optional()
  }),
  isActive: z.boolean().default(true),
  metadata: z.record(z.any()).optional()
});

// Types
export interface ISubscription {
  _id: string;
  publisherId: string;
  planId: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startDate: Date;
  endDate: Date;
  nextBillingDate: Date;
  trialEndDate?: Date;
  autoRenew: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPlan {
  _id: string;
  name: string;
  type: PlanType;
  price: number;
  billingCycles: BillingCycle[];
  features: string[];
  limits: {
    screens?: number;
    campaigns?: number;
    impressions?: number;
    users?: number;
    storage?: number;
  };
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInvoice {
  _id: string;
  subscriptionId: string;
  publisherId: string;
  planId: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  dueDate: Date;
  paidDate?: Date;
  invoiceNumber: string;
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscriptionEvent {
  _id: string;
  subscriptionId: string;
  publisherId: string;
  type: SubscriptionEventType;
  data: Record<string, any>;
  timestamp: Date;
}

export interface SubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  cancelledSubscriptions: number;
  expiredSubscriptions: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  churnRate: number;
  growthRate: number;
  byPlan: {
    planId: string;
    planName: string;
    count: number;
    revenue: number;
  }[];
  byStatus: {
    status: SubscriptionStatus;
    count: number;
  }[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
