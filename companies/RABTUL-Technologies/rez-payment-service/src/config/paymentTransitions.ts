/**
 * Shared Payment State Machine Transitions
 *
 * BUG-002 FIX: Created shared constant to ensure consistency between
 * Payment model and webhook routes. Previously both had duplicate
 * definitions with subtle differences causing state machine violations.
 *
 * Design rationale:
 * - Model enforces internal service transitions (stricter)
 * - Webhooks need more lenient rules (gateway can send unknown valid state)
 * - Use this shared constant for documentation, but allow service-specific
 *   overrides where documented (e.g., webhooks may allow transitions
 *   that internal code wouldn't generate)
 */

/**
 * Internal service transitions - stricter rules for code-generated transitions
 */
export const PAYMENT_MODEL_TRANSITIONS: Record<string, string[]> = {
  pending: ['processing', 'cancelled', 'expired'],
  processing: ['completed', 'failed'],
  completed: ['refund_initiated'],
  failed: ['pending'], // can retry
  cancelled: [],
  expired: [],
  refund_initiated: ['refund_processing'],
  refund_processing: ['refunded', 'refund_failed'],
  refunded: [],
  refund_failed: ['refund_initiated'], // can retry
  partially_refunded: ['refund_initiated'],
};

/**
 * Webhook transitions - more lenient for gateway-initiated transitions
 * Allows some transitions that internal code wouldn't generate
 */
export const PAYMENT_WEBHOOK_TRANSITIONS: Record<string, string[]> = {
  pending: ['processing', 'completed', 'cancelled', 'expired'],
  processing: ['completed', 'failed', 'cancelled'],
  completed: ['refund_initiated'],
  failed: ['pending'], // allow retry on webhook (gateway may retry)
  cancelled: [],
  expired: [],
  refund_initiated: ['refund_processing'],
  refund_processing: ['refunded', 'refund_failed'],
  refunded: [],
  refund_failed: ['refund_initiated'], // allow retry on webhook
  partially_refunded: ['refund_initiated'],
};

/**
 * All valid payment statuses
 */
export const PAYMENT_STATUSES = [
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

export type PaymentStatus = typeof PAYMENT_STATUSES[number];
