/**
 * Web stub for offlinePOSQueue — SQLite is not available on web.
 * All operations are no-ops; offline POS queueing is a native-only feature.
 */

import { logger } from '../utils/logger';

export interface PendingBill {
  id?: number;
  billData: Record<string, unknown>;
  createdAt: number;
  attempts: number;
  lastAttempt: number;
}

export function setupNetworkListener(_onConnect?: () => void): () => void {
  return () => {};
}

export function enqueueBill(_billData: Record<string, unknown>): void {
  if (__DEV__) {
    logger.warn('[OfflinePOSQueue] Not available on web');
  }
}

export function getPendingBills(): PendingBill[] {
  return [];
}

export function markBillSuccess(_id: number): void {}

export function incrementAttempt(_id: number): void {}

export function getPendingCount(): number {
  return 0;
}

export function clearAllPendingBills(): void {}

export function getPendingBillById(_id: number): PendingBill | null {
  // web stub — returns null since SQLite is not available
  return null;
}
