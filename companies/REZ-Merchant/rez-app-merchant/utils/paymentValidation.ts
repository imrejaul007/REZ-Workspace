/**
 * Payment and API validation utilities
 * Fixes for MA-PAY-*, MA-API-* contract bugs
 */

// Valid subscription tiers (MA-PAY-012)
export const VALID_SUBSCRIPTION_TIERS = ['free', 'premium', 'elite'] as const;
export type SubscriptionTier = (typeof VALID_SUBSCRIPTION_TIERS)[number];

// Valid bill types (MA-API-028)
export const VALID_BILL_TYPES = [
  'electricity',
  'water',
  'gas',
  'broadband',
  'mobile',
  'dth',
  'insurance',
] as const;
export type BillType = (typeof VALID_BILL_TYPES)[number];

// Valid transaction types
export const VALID_TRANSACTION_TYPES = [
  'credit',
  'debit',
  'withdrawal',
  'refund',
  'adjustment',
] as const;
export type TransactionType = (typeof VALID_TRANSACTION_TYPES)[number];

// Valid payment statuses (MA-API-010) — canonical 11-state set.
// Extended from the old 4-item whitelist so validatePaymentStatus no longer
// rejects legitimate server-side states like 'processing', 'expired',
// 'refund_initiated', 'refund_processing', 'refunded', 'refund_failed', and
// 'partially_refunded'. Mirrors types/api.ts PaymentStatus.
export const VALID_PAYMENT_STATUSES = [
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
  'expired',
  'refund_initiated',
  'refund_processing',
  'refunded',
  'refund_failed',
  'partially_refunded',
] as const;
export type PaymentStatus = (typeof VALID_PAYMENT_STATUSES)[number];

/**
 * Validate subscription tier (MA-PAY-012)
 * Throws if tier is not in whitelist
 */
export function validateSubscriptionTier(tier): SubscriptionTier {
  if (!VALID_SUBSCRIPTION_TIERS.includes(tier)) {
    throw new Error(
      `Invalid subscription tier: ${tier}. Must be one of: ${VALID_SUBSCRIPTION_TIERS.join(', ')}`
    );
  }
  return tier;
}

/**
 * Validate bill type (MA-API-028)
 * Throws if type is not in whitelist
 */
export function validateBillType(billType): BillType {
  if (!VALID_BILL_TYPES.includes(billType)) {
    throw new Error(
      `Invalid bill type: ${billType}. Must be one of: ${VALID_BILL_TYPES.join(', ')}`
    );
  }
  return billType;
}

/**
 * Validate transaction type (MA-PAY-031)
 * Throws if type is not in whitelist
 */
export function validateTransactionType(type): TransactionType {
  if (!VALID_TRANSACTION_TYPES.includes(type)) {
    throw new Error(
      `Invalid transaction type: ${type}. Must be one of: ${VALID_TRANSACTION_TYPES.join(', ')}`
    );
  }
  return type;
}

/**
 * Validate payment status (MA-API-010)
 * Throws if status is not in whitelist
 */
export function validatePaymentStatus(status): PaymentStatus {
  if (!VALID_PAYMENT_STATUSES.includes(status)) {
    throw new Error(
      `Invalid payment status: ${status}. Must be one of: ${VALID_PAYMENT_STATUSES.join(', ')}`
    );
  }
  return status;
}

/**
 * Validate amount for payment operations
 * Fixes MA-PAY-006: Payment amount not validated before order creation
 */
export function validatePaymentAmount(
  amount,
  options: { max?: number; min?: number } = {}
): number {
  const minAmount = options.min ?? 0;
  const maxAmount = options.max ?? 999999;

  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error(`Invalid amount: must be a number, got ${typeof amount}`);
  }

  if (amount <= minAmount) {
    throw new Error(`Amount must be greater than ${minAmount}, got ${amount}`);
  }

  if (amount > maxAmount) {
    throw new Error(`Amount must not exceed ${maxAmount}, got ${amount}`);
  }

  return amount;
}

/**
 * Format currency amount safely (MA-PAY-018: Unchecked toFixed)
 * Validates amount before calling toFixed
 */
export function formatCurrencyAmount(amount, decimals: number = 2): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return `₹0.${'0'.repeat(decimals)}`;
  }

  return `₹${Math.max(0, amount).toFixed(decimals)}`;
}

/**
 * Validate email format (MA-TRV-015, MA-TRV-022)
 * Basic email validation
 */
export function validateEmail(email): string {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (typeof email !== 'string' || !emailRegex.test(email.trim())) {
    throw new Error(`Invalid email format: ${email}`);
  }

  return email.trim();
}

/**
 * Validate pagination params (MA-API-027: Bill provider pagination unbounded)
 * Caps limit and validates page
 */
export function validatePaginationParams(
  page,
  limit,
  options: { maxLimit?: number } = {}
): { page: number; limit: number } {
  const maxLimit = options.maxLimit ?? 100;

  // Validate page
  if (typeof page !== 'number' || page < 1) {
    throw new Error(`Invalid page: must be >= 1, got ${page}`);
  }

  // Validate and cap limit
  if (typeof limit !== 'number' || limit < 1) {
    throw new Error(`Invalid limit: must be >= 1, got ${limit}`);
  }

  const cappedLimit = Math.min(limit, maxLimit);
  return { page, limit: cappedLimit };
}

/**
 * Validate response has required fields
 * (MA-API-007: Bill fetch API response missing required fields check)
 */
export function validateResponseStructure(response, requiredFields: string[]): void {
  if (typeof response !== 'object' || response === null) {
    throw new Error('Invalid response: must be an object');
  }

  for (const field of requiredFields) {
    if (!(field in response)) {
      throw new Error(`Invalid response: missing required field "${field}"`);
    }
  }
}

/**
 * Validate numeric value within range
 * Useful for discount, quantity, rating validations
 */
export function validateNumberInRange(
  value,
  min: number,
  max: number,
  fieldName: string = 'value'
): number {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error(`Invalid ${fieldName}: must be a number, got ${typeof value}`);
  }

  if (value < min || value > max) {
    throw new Error(`Invalid ${fieldName}: must be between ${min} and ${max}, got ${value}`);
  }

  return value;
}

/**
 * Validate non-negative number
 * Used for quantities, discounts, etc.
 */
export function validateNonNegative(value, fieldName: string = 'value'): number {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error(`Invalid ${fieldName}: must be a number, got ${typeof value}`);
  }

  if (value < 0) {
    throw new Error(`Invalid ${fieldName}: must be non-negative, got ${value}`);
  }

  return value;
}

/**
 * Safe coalesce for cashback (MA-STR-005: Cashback calculation logic error)
 * Uses nullish coalescing instead of || to handle 0 correctly
 */
export function getCashbackPercentage(
  methodCashback,
  storeCashback,
  defaultPercentage: number = 15
): number {
  // Use ?? instead of || to properly handle 0
  const percentage = methodCashback ?? storeCashback ?? defaultPercentage;

  if (typeof percentage !== 'number' || isNaN(percentage)) {
    return defaultPercentage;
  }

  return Math.max(0, Math.min(100, percentage));
}

/**
 * Validate COD fee structure (MA-API-017)
 */
export function validateCODFeeStructure(fee): number {
  // Handle both simple number and structured fee object
  if (typeof fee === 'number' && !isNaN(fee) && fee >= 0) {
    return fee;
  }

  if (typeof fee === 'object' && fee !== null) {
    // If it's a structured fee object with fixed and percentage, calculate
    if (typeof fee.fixed === 'number' && fee.fixed > 0) {
      return fee.fixed;
    }
  }

  return 0; // Default to no fee
}
