/**
 * Purchase Order Status Finite State Machine (FSM) Configuration
 *
 * Defines all valid status transitions for the PO lifecycle.
 * Invalid transitions are rejected at save time.
 */

// Purchase Order status enum
export enum POStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ORDERED = 'ordered',
  PARTIAL_RECEIVED = 'partial_received',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
  CLOSED = 'closed',
}

// Valid status transitions map: from -> [allowed to]
export const PO_TRANSITIONS: Record<POStatus, POStatus[]> = {
  [POStatus.DRAFT]: [POStatus.PENDING_APPROVAL, POStatus.APPROVED, POStatus.CANCELLED],
  [POStatus.PENDING_APPROVAL]: [POStatus.APPROVED, POStatus.REJECTED],
  [POStatus.APPROVED]: [POStatus.ORDERED, POStatus.CANCELLED],
  [POStatus.REJECTED]: [POStatus.DRAFT], // Can reopen as draft
  [POStatus.ORDERED]: [POStatus.PARTIAL_RECEIVED, POStatus.RECEIVED],
  [POStatus.PARTIAL_RECEIVED]: [POStatus.RECEIVED],
  [POStatus.RECEIVED]: [POStatus.CLOSED],
  [POStatus.CANCELLED]: [], // Terminal state
  [POStatus.CLOSED]: [], // Terminal state
};

// Status display names for UI
export const PO_STATUS_DISPLAY: Record<POStatus, string> = {
  [POStatus.DRAFT]: 'Draft',
  [POStatus.PENDING_APPROVAL]: 'Pending Approval',
  [POStatus.APPROVED]: 'Approved',
  [POStatus.REJECTED]: 'Rejected',
  [POStatus.ORDERED]: 'Ordered',
  [POStatus.PARTIAL_RECEIVED]: 'Partially Received',
  [POStatus.RECEIVED]: 'Received',
  [POStatus.CANCELLED]: 'Cancelled',
  [POStatus.CLOSED]: 'Closed',
};

// Payment status enum
export enum POPaymentStatus {
  UNPAID = 'unpaid',
  PARTIAL = 'partial',
  PAID = 'paid',
}

// Payment status transitions
export const PO_PAYMENT_TRANSITIONS: Record<POPaymentStatus, POPaymentStatus[]> = {
  [POPaymentStatus.UNPAID]: [POPaymentStatus.PARTIAL, POPaymentStatus.PAID],
  [POPaymentStatus.PARTIAL]: [POPaymentStatus.PAID],
  [POPaymentStatus.PAID]: [], // Terminal state
};

/**
 * Validate if a status transition is allowed
 * @param currentStatus - Current PO status
 * @param newStatus - Desired new status
 * @returns true if transition is valid, false otherwise
 */
export function isValidPOStatusTransition(currentStatus: POStatus, newStatus: POStatus): boolean {
  const allowedTransitions = PO_TRANSITIONS[currentStatus];
  if (!allowedTransitions) {
    return false;
  }
  return allowedTransitions.includes(newStatus);
}

/**
 * Get all valid next statuses from current status
 * @param currentStatus - Current PO status
 * @returns Array of valid next statuses
 */
export function getValidNextStatuses(currentStatus: POStatus): POStatus[] {
  return PO_TRANSITIONS[currentStatus] || [];
}

/**
 * Check if status is a terminal state
 * @param status - PO status to check
 * @returns true if terminal state
 */
export function isTerminalStatus(status: POStatus): boolean {
  return PO_TRANSITIONS[status].length === 0;
}

/**
 * Validate payment status transition
 * @param currentStatus - Current payment status
 * @param newStatus - Desired new payment status
 * @returns true if transition is valid
 */
export function isValidPaymentStatusTransition(
  currentStatus: POPaymentStatus,
  newStatus: POPaymentStatus
): boolean {
  const allowedTransitions = PO_PAYMENT_TRANSITIONS[currentStatus];
  if (!allowedTransitions) {
    return false;
  }
  return allowedTransitions.includes(newStatus);
}
