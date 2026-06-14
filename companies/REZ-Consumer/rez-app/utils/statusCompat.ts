/**
 * Legacy status compatibility mapper — Phase 7 shared contracts
 *
 * Copied from rezbackend/src/utils/statusCompat.ts so that clients can
 * normalize legacy status values without a round-trip to the server.
 *
 * Add mappings here as legacy values are discovered in client storage,
 * push notifications, or cached API responses. Never remove a mapping
 * until you are certain no stored data or client can produce the old value.
 *
 * Source of truth: rezbackend/src/utils/statusCompat.ts
 */

// ── Order status normalizer ────────────────────────────────────────────────────

const ORDER_STATUS_MAP: Record<string, string> = {
  in_transit: 'out_for_delivery',      // old name → canonical
  refund_initiated: 'partially_refunded',
  shipping: 'dispatched',
  packed: 'preparing',
  accepted: 'confirmed',
};

// ── Payment status normalizer ──────────────────────────────────────────────────

const PAYMENT_STATUS_MAP: Record<string, string> = {
  success: 'paid',
  captured: 'paid',
  pending_capture: 'authorized',
  completed: 'paid',
  initiated: 'awaiting_payment',
};

// ── PaymentStatus ↔ OrderPaymentStatus bridge ──────────────────────────────────
// Two FSM domains exist for different purposes:
//   1. PaymentStatus (standalone Payment model): Financial lifecycle
//   2. OrderPaymentStatus (Order.payment subdoc): Consumer-facing state
const PAYMENT_TO_ORDER_STATUS: Partial<Record<string, string>> = {
  pending:          'pending',
  processing:      'processing',
  completed:       'paid',
  failed:          'failed',
  cancelled:       'failed',
  refunded:        'refunded',
  partially_refunded: 'partially_refunded',
  expired:            'failed',
  refund_initiated:   'refunded',
  refund_processing:  'refunded',
  refund_failed:      'refunded',
};

export function normalizeOrderStatus(status: string): string {
  return ORDER_STATUS_MAP[status] ?? status;
}

export function normalizePaymentStatus(status: string): string {
  return PAYMENT_STATUS_MAP[status] ?? status;
}

export function paymentStatusToOrderPayment(status: string): string | null {
  return PAYMENT_TO_ORDER_STATUS[status] ?? null;
}
