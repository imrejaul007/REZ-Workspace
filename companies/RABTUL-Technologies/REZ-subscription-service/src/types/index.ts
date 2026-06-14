import { z } from 'zod';

// Billing Cycle Enum
export enum BillingCycle {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

// Subscription Status Enum
export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  PENDING = 'pending'
}

// Plan Type Enum
export enum PlanType {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
  CUSTOM = 'custom'
}

// Usage Type Enum
export enum UsageType {
  PER_UNIT = 'per_unit',
  TIERED = 'tiered',
  FLAT_RATE = 'flat_rate'
}

// Dunning State Enum
export enum DunningState {
  NONE = 'none',
  FIRST_NOTICE = 'first_notice',
  SECOND_NOTICE = 'second_notice',
  FINAL_NOTICE = 'final_notice',
  SUSPENDED = 'suspended'
}

// Zod Schemas
export const AddressSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().length(2).default('IN')
});

export type Address = z.infer<typeof AddressSchema>;

export const PlanSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  currency: z.string().length(3).default('INR'),
  billingCycle: z.nativeEnum(BillingCycle),
  features: z.array(z.string()).default([]),
  usageType: z.nativeEnum(UsageType).default(UsageType.FLAT_RATE),
  usageLimits: z.object({
    included: z.number().nonnegative().default(0),
    max: z.number().positive().optional(),
    overageRate: z.number().nonnegative().optional()
  }).optional(),
  trialDays: z.number().int().nonnegative().default(0),
  gracePeriodDays: z.number().int().nonnegative().default(7),
  maxUsage: z.number().positive().optional(),
  metadata: z.record(z.unknown()).optional()
});

export type Plan = z.infer<typeof PlanSchema>;

export const SubscriptionCreateSchema = z.object({
  customerId: z.string().min(1),
  planId: z.string().min(1),
  billingCycle: z.nativeEnum(BillingCycle).optional(),
  startDate: z.string().datetime().optional(),
  trialEndDate: z.string().datetime().optional(),
  billingAnchorDay: z.number().int().min(1).max(28).optional(),
  autoRenew: z.boolean().default(true),
  paymentMethodId: z.string().optional(),
  billingAddress: AddressSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
  couponCode: z.string().optional(),
  referralCode: z.string().optional()
});

export const SubscriptionUpdateSchema = z.object({
  planId: z.string().optional(),
  billingCycle: z.nativeEnum(BillingCycle).optional(),
  autoRenew: z.boolean().optional(),
  paymentMethodId: z.string().optional(),
  billingAddress: AddressSchema.optional(),
  metadata: z.record(z.unknown()).optional()
});

export const UsageRecordSchema = z.object({
  subscriptionId: z.string().min(1),
  quantity: z.number().positive(),
  timestamp: z.string().datetime().optional(),
  idempotencyKey: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

export const PauseSubscriptionSchema = z.object({
  reason: z.string().optional(),
  resumeDate: z.string().datetime().optional()
});

export const CancelSubscriptionSchema = z.object({
  reason: z.string().optional(),
  immediate: z.boolean().default(false),
  cancellationEffectiveDate: z.enum(['now', 'period_end', 'specific_date']).default('now'),
  specificDate: z.string().datetime().optional(),
  feedback: z.string().optional()
});

export const UpgradeDowngradeSchema = z.object({
  newPlanId: z.string().min(1),
  effectiveDate: z.enum(['immediate', 'period_end']).default('immediate'),
  billingCycle: z.nativeEnum(BillingCycle).optional()
});

// Type Exports
export type SubscriptionCreate = z.infer<typeof SubscriptionCreateSchema>;
export type SubscriptionUpdate = z.infer<typeof SubscriptionUpdateSchema>;
export type UsageRecord = z.infer<typeof UsageRecordSchema>;
export type PauseSubscription = z.infer<typeof PauseSubscriptionSchema>;
export type CancelSubscription = z.infer<typeof CancelSubscriptionSchema>;
export type UpgradeDowngrade = z.infer<typeof UpgradeDowngradeSchema>;

// Invoice Status
export enum InvoiceStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  VOID = 'void',
  REFUNDED = 'refunded',
  PARTIALLY_PAID = 'partially_paid'
}

// Payment Status
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled'
}

// Invoice Line Item
export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  currency: string;
  periodStart: Date;
  periodEnd: Date;
  metadata?: Record<string, unknown>;
}

// Invoice Interface
export interface Invoice {
  id: string;
  subscriptionId: string;
  customerId: string;
  status: InvoiceStatus;
  currency: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amountDue: number;
  amountPaid: number;
  lineItems: InvoiceLineItem[];
  dueDate: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  billingAddress?: Address;
  paymentAttempts: PaymentAttempt[];
  metadata?: Record<string, unknown>;
}

// Payment Attempt
export interface PaymentAttempt {
  id: string;
  amount: number;
  status: PaymentStatus;
  paymentMethodId: string;
  paymentIntentId?: string;
  errorMessage?: string;
  attemptedAt: Date;
  failureReason?: string;
}

// Usage Record
export interface UsageRecordDocument {
  id: string;
  subscriptionId: string;
  quantity: number;
  timestamp: Date;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}

// Analytics Types
export interface SubscriptionAnalytics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  pastDueSubscriptions: number;
  cancelledSubscriptions: number;
  pausedSubscriptions: number;
  mrr: number;
  arr: number;
  churnRate: number;
  ltv: number;
  trialConversionRate: number;
  averageRevenuePerUser: number;
}

export interface BillingMetrics {
  invoicesGenerated: number;
  invoicesPaid: number;
  invoicesFailed: number;
  totalRevenue: number;
  failedPaymentRate: number;
  dunningRecoveryRate: number;
}

// Event Types
export enum SubscriptionEventType {
  CREATED = 'subscription.created',
  UPDATED = 'subscription.updated',
  RENEWED = 'subscription.renewed',
  CANCELLED = 'subscription.cancelled',
  PAUSED = 'subscription.paused',
  RESUMED = 'subscription.resumed',
  EXPIRED = 'subscription.expired',
  TRIAL_ENDING = 'subscription.trial_ending',
  PAYMENT_FAILED = 'subscription.payment_failed',
  PAYMENT_SUCCEEDED = 'subscription.payment_succeeded',
  UPGRADED = 'subscription.upgraded',
  DOWNGRADED = 'subscription.downgraded'
}

export interface SubscriptionEvent {
  id: string;
  type: SubscriptionEventType;
  subscriptionId: string;
  customerId: string;
  data: Record<string, unknown>;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}
