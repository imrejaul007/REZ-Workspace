/**
 * @fileoverview Canonical type stubs for shared types
 *
 * Canonical source: packages/shared-types/src/index.ts
 *
 * This module re-exports canonical types from the shared-types package so that
 * rez-app-consumer can import from a stable path (@/types/rez-shared-types).
 *
 * Files are copied locally from packages/shared-types/src/ to types/entities/ and types/enums/
 * to enable Metro bundler resolution. Update these copies when shared-types is published as npm package.
 */

// Re-export all canonical types
export {
  IKarmaProfile,
  IKarmaEvent,
  IConversionBatch,
  ILevelInfo,
  IKarmaStats,
  IEarnRecord,
  IBadge as IBadgeKarma,
  ILevelHistoryEntry,
  IConversionHistoryEntry,
  KarmaLevel,
  KarmaConversionRate,
  EarnRecordStatus,
  BatchStatus,
} from './entities/karma';

export {
  IOrder,
  IOrderItem,
  IOrderTotals,
  IOrderPayment,
  IOrderDelivery,
} from './entities/order';

export {
  OrderStatus,
  PaymentStatus,
  CoinType,
  COIN_PRIORITY,
  CoinTransactionType,
} from './enums/index';

/**
 * Canonical order statuses (11 states).
 * Use these instead of legacy values like 'pending', 'processing', 'shipped'.
 */
export const CANONICAL_ORDER_STATUSES = [
  'placed',
  'confirmed',
  'preparing',
  'ready',
  'dispatched',
  'out_for_delivery',
  'delivered',
  'cancelling',
  'cancelled',
  'returned',
  'refunded',
] as const;

/**
 * Legacy status alias map — normalizes deprecated values to canonical equivalents.
 * Used to handle responses from backends that may emit old FSM values.
 */
const LEGACY_STATUS_MAP: Partial<Record<string, typeof CANONICAL_ORDER_STATUSES[number]>> = {
  // Legacy → Canonical
  pending: 'placed',
  processing: 'preparing',
  shipped: 'dispatched',
  // Legacy REZ Now web order alias
  completed: 'delivered',
};

/**
 * Normalizes unknown order status String to its canonical value.
 * Maps legacy FSM values to canonical values for consistent UI display.
 */
export function normalizeOrderStatus(
  status: string,
): typeof CANONICAL_ORDER_STATUSES[number] {
  if (!status || typeof status !== 'string') {
    return 'placed';
  }
  const normalized = status.toLowerCase().trim();
  return LEGACY_STATUS_MAP[normalized] ?? (normalized as typeof CANONICAL_ORDER_STATUSES[number]);
}
