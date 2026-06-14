import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { BillingCycle } from '../types';

/**
 * Generate a unique ID with optional prefix
 */
export function generateId(prefix?: string): string {
  const id = uuidv4().replace(/-/g, '').substring(0, 16);
  return prefix ? `${prefix}_${id}` : id;
}

/**
 * Generate a subscription ID
 */
export function generateSubscriptionId(): string {
  return `sub_${generateId()}`;
}

/**
 * Generate an invoice ID
 */
export function generateInvoiceId(): string {
  return `inv_${generateId()}`;
}

/**
 * Generate a usage ID
 */
export function generateUsageId(): string {
  return `usage_${generateId()}`;
}

/**
 * Generate a webhook event ID
 */
export function generateEventId(): string {
  return `evt_${Date.now()}_${generateId().substring(0, 8)}`;
}

/**
 * Calculate the next billing date based on billing cycle
 */
export function calculateNextBillingDate(
  currentDate: Date,
  billingCycle: BillingCycle,
  anchorDay?: number
): Date {
  const nextDate = new Date(currentDate);

  switch (billingCycle) {
    case BillingCycle.DAILY:
      nextDate.setDate(nextDate.getDate() + 1);
      break;

    case BillingCycle.WEEKLY:
      nextDate.setDate(nextDate.getDate() + 7);
      break;

    case BillingCycle.MONTHLY:
      nextDate.setMonth(nextDate.getMonth() + 1);
      // Handle anchor day for monthly billing
      if (anchorDay !== undefined && anchorDay >= 1 && anchorDay <= 28) {
        const targetDay = anchorDay;
        const currentDay = nextDate.getDate();
        if (currentDay !== targetDay) {
          // Adjust to target day, handling month boundaries
          const lastDayOfMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
          nextDate.setDate(Math.min(targetDay, lastDayOfMonth));
        }
      }
      break;

    case BillingCycle.QUARTERLY:
      nextDate.setMonth(nextDate.getMonth() + 3);
      if (anchorDay !== undefined) {
        nextDate.setDate(Math.min(anchorDay, new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate()));
      }
      break;

    case BillingCycle.YEARLY:
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }

  return nextDate;
}

/**
 * Calculate period start and end dates
 */
export function calculatePeriodDates(
  startDate: Date,
  billingCycle: BillingCycle
): { periodStart: Date; periodEnd: Date } {
  const periodStart = new Date(startDate);
  const periodEnd = calculateNextBillingDate(startDate, billingCycle);

  return { periodStart, periodEnd };
}

/**
 * Calculate proration for mid-cycle changes
 */
export function calculateProration(
  price: number,
  startDate: Date,
  endDate: Date,
  changeDate: Date,
  billingCycle: BillingCycle
): number {
  const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  const daysUsed = (changeDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  const daysRemaining = totalDays - daysUsed;

  const dailyRate = price / totalDays;
  return Math.round(dailyRate * daysRemaining * 100) / 100;
}

/**
 * Calculate days remaining in period
 */
export function daysRemainingInPeriod(periodEnd: Date): number {
  const now = new Date();
  const diff = periodEnd.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Calculate usage-based charges
 */
export function calculateUsageCharges(
  usage: number,
  includedUnits: number,
  overageRate: number
): { includedCharges: number; overageUnits: number; overageCharges: number; totalCharges: number } {
  const overageUnits = Math.max(0, usage - includedUnits);
  const overageCharges = overageUnits * overageRate;

  return {
    includedCharges: 0,
    overageUnits,
    overageCharges: Math.round(overageCharges * 100) / 100,
    totalCharges: Math.round(overageCharges * 100) / 100
  };
}

/**
 * Calculate total with tax
 */
export function calculateTotalWithTax(
  subtotal: number,
  taxRate: number = 0.18, // Default 18% GST for India
  discount: number = 0
): { subtotal: number; tax: number; discount: number; total: number } {
  const afterDiscount = subtotal - discount;
  const tax = Math.round(afterDiscount * taxRate * 100) / 100;
  const total = Math.round((afterDiscount + tax) * 100) / 100;

  return {
    subtotal,
    tax,
    discount,
    total
  };
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency
  }).format(amount);
}

/**
 * Generate a hash for idempotency verification
 */
export function generateHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): boolean {
  try {
    const [timestamp, expectedSignature] = signature.split(',');
    const time = parseInt(timestamp.replace('t=', ''), 10);
    const now = Math.floor(Date.now() / 1000);

    // Check if timestamp is within 5 minutes
    if (Math.abs(now - time) > 300) {
      return false;
    }

    const signedPayload = `${time}.${payload}`;
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature.replace('v1=', '')),
      Buffer.from(computedSignature)
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Webhook] Signature verification failed: ${errorMessage}`);
    return false;
  }
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 30000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

      if (attempt < maxRetries - 1) {
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Parse date string or return current date
 */
export function parseDate(dateStr?: string): Date {
  if (!dateStr) {
    return new Date();
  }

  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${dateStr}`);
  }

  return parsed;
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

/**
 * Check if a date is in the future
 */
export function isFuture(date: Date): boolean {
  return date.getTime() > Date.now();
}

/**
 * Get start and end of day
 */
export function getDayBoundaries(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Get start and end of month
 */
export function getMonthBoundaries(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

  return { start, end };
}

/**
 * Sanitize object for logging (remove sensitive fields)
 */
export function sanitizeForLogging(obj: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'api_key', 'authorization'];
  const sanitized = { ...obj };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '***REDACTED***';
    }
  }

  return sanitized;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Remove undefined and null values from object
 */
export function cleanObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      cleaned[key] = value;
    }
  }

  return cleaned as Partial<T>;
}
