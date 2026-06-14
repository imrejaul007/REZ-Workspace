/**
 * Order State Machine — validates and enforces valid order status transitions.
 *
 * Mirrors the canonical backend state machine exactly.
 * All order status updates should go through validateTransition() or assertTransition().
 */

export const ORDER_STATUSES = [
  'placed',
  'confirmed',
  'preparing',
  'ready',
  'dispatched',
  'out_for_delivery',
  'failed_delivery',
  'delivered',
  'cancelling',
  'cancelled',
  'return_requested',
  'return_rejected',
  'returned',
  'refunded',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// State machine: only these forward transitions are permitted.
export const VALID_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  placed:             ['confirmed', 'cancelled', 'cancelling'],
  confirmed:          ['preparing', 'cancelled', 'cancelling'],
  preparing:           ['ready', 'cancelled', 'cancelling'],
  ready:              ['dispatched', 'cancelled', 'cancelling'],
  dispatched:         ['out_for_delivery', 'delivered', 'cancelled'],
  out_for_delivery:   ['delivered', 'failed_delivery', 'cancelled'],
  failed_delivery:    [],
  delivered:          ['returned', 'refunded', 'return_requested'],
  cancelling:          ['cancelled', 'placed', 'confirmed', 'preparing', 'ready'],
  cancelled:          ['refunded'],
  return_requested:   ['return_rejected', 'returned'],
  return_rejected:    [],
  returned:           ['refunded'],
  refunded:           [],
};

/**
 * Terminal states that cannot transition to non-terminal states.
 */
export const TERMINAL_STATES: readonly OrderStatus[] = ['refunded', 'failed_delivery', 'return_rejected'];

/**
 * States that can be cancelled.
 */
export const CANCELLABLE_STATES: readonly OrderStatus[] = [
  'placed',
  'confirmed',
  'preparing',
  'ready',
  'dispatched',
  'out_for_delivery',
  'cancelling',
];

/**
 * Validates whether a state transition is allowed.
 * @param from - Current order status
 * @param to - Target order status
 * @returns true if the transition is valid, false otherwise
 */
export function validateTransition(from: OrderStatus, to: OrderStatus): boolean {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

/**
 * Checks if a status is a terminal state (no further transitions allowed).
 * @param status - Order status to check
 * @returns true if the status is terminal
 */
export function isTerminalState(status: OrderStatus): boolean {
  return TERMINAL_STATES.includes(status);
}

/**
 * Checks if an order in the given status can be cancelled.
 * @param status - Current order status
 * @returns true if the order can be cancelled from this state
 */
export function canBeCancelled(status: OrderStatus): boolean {
  return CANCELLABLE_STATES.includes(status);
}

/**
 * Custom error for invalid state transitions.
 */
export class InvalidStateTransitionError extends Error {
  readonly from: OrderStatus;
  readonly to: OrderStatus;
  readonly allowed: readonly OrderStatus[];

  constructor(from: OrderStatus, to: OrderStatus) {
    const allowed = VALID_TRANSITIONS[from] ?? [];
    super(`Invalid order status transition from '${from}' to '${to}'. Allowed transitions: [${allowed.join(', ')}]`);
    this.name = 'InvalidStateTransitionError';
    this.from = from;
    this.to = to;
    this.allowed = allowed;
  }
}

/**
 * Asserts that a state transition is valid, throwing if not.
 * @param from - Current order status
 * @param to - Target order status
 * @throws InvalidStateTransitionError if the transition is not allowed
 */
export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!validateTransition(from, to)) {
    throw new InvalidStateTransitionError(from, to);
  }
}

/**
 * Gets allowed transitions from a given status.
 * @param status - Current order status
 * @returns Array of valid target statuses
 */
export function getAllowedTransitions(status: OrderStatus): readonly OrderStatus[] {
  return VALID_TRANSITIONS[status] ?? [];
}
