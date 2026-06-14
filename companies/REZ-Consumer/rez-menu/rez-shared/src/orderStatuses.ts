/**
 * Canonical Order Statuses — Phase 7 shared contracts
 *
 * Source of truth: rezbackend/src/config/orderStateMachine.ts
 * These values mirror the backend FSM exactly. If the backend FSM changes,
 * update this file in lockstep.
 *
 * See also: packages/rez-shared/src/statusCompat.ts for legacy value normalization.
 */

// Ordered statuses for linear progress calculation (placed → delivered)
export const STATUS_ORDER = [
  'placed',
  'confirmed',
  'preparing',
  'ready',
  'dispatched',
  'out_for_delivery',
  'delivered',
] as const;

// All valid order statuses (including terminal branches)
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
export type LinearOrderStatus = (typeof STATUS_ORDER)[number];

// Terminal statuses — no further forward progress
export const TERMINAL_ORDER_STATUSES = ['cancelled', 'returned', 'refunded'] as const;
export type TerminalOrderStatus = (typeof TERMINAL_ORDER_STATUSES)[number];

// Active statuses — order is in progress
export const ACTIVE_ORDER_STATUSES = [
  'placed',
  'confirmed',
  'preparing',
  'ready',
  'dispatched',
  'out_for_delivery',
  'cancelling',
] as const;
export type ActiveOrderStatus = (typeof ACTIVE_ORDER_STATUSES)[number];

// Past statuses — order is complete in some way
export const PAST_ORDER_STATUSES = ['delivered', 'cancelled', 'returned', 'refunded'] as const;
export type PastOrderStatus = (typeof PAST_ORDER_STATUSES)[number];

/**
 * Type guard: check if a string is a valid OrderStatus.
 */
export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

/**
 * Calculate order progress as a percentage (0–100).
 * Mirrors backend getOrderProgress() — keep in sync.
 */
export function getOrderProgress(status: string): number {
  if (status === 'delivered') return 100;
  if (status === 'cancelled' || status === 'refunded' || status === 'returned') return 0;

  const index = (STATUS_ORDER as readonly string[]).indexOf(status);
  if (index < 0) return 0;

  const maxIndex = STATUS_ORDER.length - 1; // 6 (delivered)
  return Math.round((index / maxIndex) * 100);
}
