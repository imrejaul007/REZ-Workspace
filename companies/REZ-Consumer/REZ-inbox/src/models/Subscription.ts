import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

/**
 * Subscription billing cycle
 */
export type BillingCycle = 'monthly' | 'yearly' | 'weekly' | 'quarterly' | 'one_time';

/**
 * Subscription status
 */
export type SubscriptionStatus = 'active' | 'cancelled' | 'paused' | 'expired' | 'trial';

/**
 * Subscription data model for tracking recurring charges from emails
 */
export interface Subscription {
  subscription_id: string;
  user_id: string;
  source_email: string;
  service_name: string;
  category: string;
  billing_cycle: BillingCycle;
  amount?: number;
  currency?: string;
  start_date?: Date;
  next_billing_date?: Date;
  end_date?: Date;
  status: SubscriptionStatus;
  is_trial: boolean;
  trial_end_date?: Date;
  imported_at: Date;
  metadata?: Record<string, unknown>;
  confidence_score?: number;
  notifications_enabled: boolean;
}

/**
 * Zod schema for Subscription validation
 */
export const SubscriptionSchema = z.object({
  subscription_id: z.string().uuid(),
  user_id: z.string().min(1),
  source_email: z.string().email(),
  service_name: z.string().min(1),
  category: z.string().min(1),
  billing_cycle: z.enum(['monthly', 'yearly', 'weekly', 'quarterly', 'one_time']),
  amount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  start_date: z.date().optional(),
  next_billing_date: z.date().optional(),
  end_date: z.date().optional(),
  status: z.enum(['active', 'cancelled', 'paused', 'expired', 'trial']),
  is_trial: z.boolean(),
  trial_end_date: z.date().optional(),
  imported_at: z.date(),
  metadata: z.record(z.unknown()).optional(),
  confidence_score: z.number().min(0).max(1).optional(),
  notifications_enabled: z.boolean(),
});

/**
 * Known subscription service patterns
 */
export interface SubscriptionPattern {
  name: string;
  category: string;
  patterns: RegExp[];
  typical_amount?: { min: number; max: number };
  typical_cycle?: BillingCycle;
}

/**
 * Subscription activity entry for tracking changes
 */
export interface SubscriptionActivity {
  activity_id: string;
  subscription_id: string;
  user_id: string;
  activity_type: 'created' | 'renewed' | 'cancelled' | 'upgraded' | 'downgraded' | 'paused' | 'resumed';
  timestamp: Date;
  details?: Record<string, unknown>;
}

/**
 * Create a new Subscription instance
 */
export function createSubscription(
  data: Omit<Subscription, 'subscription_id' | 'imported_at'>
): Subscription {
  return {
    ...data,
    subscription_id: uuidv4(),
    imported_at: new Date(),
  };
}

/**
 * Validate subscription data
 */
export function validateSubscription(data: unknown): Subscription {
  return SubscriptionSchema.parse(data);
}

/**
 * Subscription detection result
 */
export interface SubscriptionDetection {
  is_subscription: boolean;
  service_name?: string;
  category?: string;
  billing_cycle?: BillingCycle;
  amount?: number;
  confidence: number;
  indicators: string[];
  is_trial?: boolean;
  trial_end_date?: Date;
}

/**
 * Calculate next billing date based on cycle
 */
export function calculateNextBillingDate(
  currentDate: Date,
  cycle: BillingCycle
): Date {
  const next = new Date(currentDate);

  switch (cycle) {
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    case 'one_time':
      return currentDate;
  }

  return next;
}
