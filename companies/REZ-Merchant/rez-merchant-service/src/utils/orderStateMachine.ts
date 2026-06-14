/**
 * Order State Machine — Merchant Service
 *
 * Enforces valid status transitions for orders. Mirrors the canonical
 * state machine from rezbackend/src/config/orderStateMachine.ts.
 *
 * This ensures that merchant-initiated status updates follow the same
 * rules as the platform backend, preventing invalid state transitions.
 */

// Canonical order status enum — defined locally to ensure consistency.
// These types are intentionally duplicated from @rez/shared to avoid a dependency
// that would introduce coupling between services. Keep in sync manually.
export const ORDER_STATUSES = [
  'placed',
  'confirmed',
  'preparing',
  'ready',
  'dispatched',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'cancelling',
  'returned',
  'refunded',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * Merchant-allowed transitions (subset of full state machine).
 * Merchants can only move orders forward through preparation/dispatch.
 *
 * Merchants CAN:
 *   - Move orders through the forward lifecycle
 *   - Cancel orders in early stages (placed, confirmed, preparing, ready)
 *   - Cannot cancel dispatched/out_for_delivery orders (must use platform cancel)
 *
 * Merchants CANNOT:
 *   - Return/refund orders
 *   - Revert transitions
 *   - Skip steps (e.g., cannot jump from confirmed → ready, must do preparing first)
 */
export const MERCHANT_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  // Merchant accepts a newly placed order (confirm it).
  placed: ['confirmed', 'cancelled'],
  // After order is confirmed by merchant, they can start preparing.
  confirmed: ['preparing', 'cancelled'],
  // Preparing → ready once food/items are done.
  preparing: ['ready', 'cancelled'],
  // Ready → dispatch to delivery or customer.
  ready: ['dispatched', 'cancelled'],
  // Dispatched orders cannot be cancelled by merchants — must go through platform
  dispatched: ['out_for_delivery'],
  // Out for delivery → delivered
  out_for_delivery: ['delivered'],
};

/**
 * SLA thresholds per status (in minutes).
 * Orders exceeding these are flagged as "stuck" in admin dashboards.
 */
export const SLA_THRESHOLDS: Record<string, number> = {
  placed: 60, // 1 hour to confirm
  confirmed: 30, // 30 min to start preparing
  preparing: 120, // 2 hours to finish preparing
  ready: 30, // 30 min to dispatch
  dispatched: 180, // 3 hours to deliver
  out_for_delivery: 120, // 2 hours to deliver after out_for_delivery
};

/**
 * Check if a merchant-initiated status transition is valid.
 *
 * @param from Current order status
 * @param to Desired next status
 * @returns true if transition is allowed, false otherwise
 */
export function isValidMerchantTransition(from: string, to: string): boolean {
  if (!isOrderStatus(from) || !isOrderStatus(to)) return false;
  const allowed = MERCHANT_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

/**
 * Get the list of valid next statuses for a merchant from the current status.
 */
export function getMerchantNextStatuses(current: string): string[] {
  if (!isOrderStatus(current)) return [];
  return MERCHANT_TRANSITIONS[current] || [];
}

/**
 * Assert a merchant transition is valid, throwing an error if not.
 */
export function assertMerchantTransition(from: string, to: string): void {
  if (!isValidMerchantTransition(from, to)) {
    const allowed = getMerchantNextStatuses(from);
    const errorMsg =
      `Invalid merchant status transition: "${from}" → "${to}". ` +
      `Allowed from "${from}": [${allowed.join(', ') || 'none — terminal state'}]`;
    throw new Error(errorMsg);
  }
}

/**
 * Type guard: check if a string is a valid OrderStatus.
 */
export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}
