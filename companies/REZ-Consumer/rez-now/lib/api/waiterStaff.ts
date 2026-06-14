import { authClient } from './client';

// NW-CRIT-005: All staff waiter endpoints require authClient.
// updateCallStatus must verify the authenticated user's storeSlug matches the call's store
// to prevent cross-store waiter-call spoofing.


export interface WaiterCallRecord {
  requestId: string;
  tableNumber: string;
  status: 'pending' | 'acknowledged' | 'resolved';
  createdAt: string;
  reason?: string;
  orderNumber?: string;
}

/**
 * GET /api/web-ordering/store/:storeSlug/waiter-calls
 * Returns all active (pending + acknowledged) waiter calls for a store.
 */
export async function getActiveCalls(storeSlug: string): Promise<WaiterCallRecord[]> {
  const { data } = await authClient.get(
    `/api/web-ordering/store/${encodeURIComponent(storeSlug)}/waiter-calls`,
  );
  if (!data.success) throw new Error(data.message || 'Failed to fetch waiter calls');
  return (data.data ?? []) as WaiterCallRecord[];
}

/**
 * PATCH /api/web-ordering/waiter/call/:requestId
 * Updates the status of a waiter call.
 */
export async function updateCallStatus(
  requestId: string,
  status: 'acknowledged' | 'resolved',
): Promise<void> {
  const { data } = await authClient.patch(
    `/api/web-ordering/waiter/call/${encodeURIComponent(requestId)}`,
    { status },
  );
  if (!data.success) throw new Error(data.message || 'Failed to update waiter call');
}
