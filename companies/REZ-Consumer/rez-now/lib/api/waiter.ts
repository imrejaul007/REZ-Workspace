import { authClient } from './client';

// NW-CRIT-005: Both callWaiter and getWaiterCallStatus now require authentication.
// Public access allows enumeration of waiter-call IDs and DoS on waitercall infrastructure.
// Staff who update call status (waiterStaff.ts) also require auth to prevent spoofing.


export interface WaiterCallResponse {
  success: boolean;
  requestId: string;
}

export interface WaiterCallStatusResponse {
  status: 'pending' | 'acknowledged' | 'resolved';
}

export interface WaiterCallOptions {
  priority?: 'normal' | 'urgent';
  requestType?: 'general' | 'order' | 'payment' | 'complaint' | 'celebration';
  specialRequest?: string;
  hasAllergenAlert?: boolean;
  reason?: string; // Legacy support
}

/**
 * POST /api/web-ordering/waiter/call
 * Sends a waiter call request for a dine-in table.
 * NW-CRIT-005: Requires authClient. Auth is needed to prevent waiter-call enumeration
 * and DoS attacks. If guest access is required, add a store-specific guest token instead.
 */
export async function callWaiter(
  storeSlug: string,
  tableNumber: string,
  options?: WaiterCallOptions | string
): Promise<WaiterCallResponse> {
  // Support legacy string argument for reason
  const reason = typeof options === 'string' ? options : options?.reason;

  const payload: Record<string, unknown> = {
    storeSlug,
    tableNumber,
  };

  if (reason) {
    payload.reason = reason;
  }

  // Extended options
  if (typeof options === 'object' && options !== null) {
    if (options.priority) payload.priority = options.priority;
    if (options.requestType) payload.requestType = options.requestType;
    if (options.specialRequest) payload.specialRequest = options.specialRequest;
    if (options.hasAllergenAlert !== undefined) payload.hasAllergenAlert = options.hasAllergenAlert;
  }

  const { data } = await authClient.post('/api/web-ordering/waiter/call', payload);
  if (!data.success) throw new Error(data.message || 'Failed to call waiter');
  // NW-MED-058: Throw instead of returning empty string when requestId can't be determined.
  const requestId = data.data?.requestId ?? data.requestId ?? '';
  if (!requestId) throw new Error('Waiter call failed: no request ID returned');
  return { success: data.success, requestId };
}

/**
 * GET /api/web-ordering/waiter/call/:requestId/status
 * Polls the current status of a waiter call.
 */
export async function getWaiterCallStatus(requestId: string): Promise<WaiterCallStatusResponse> {
  const { data } = await authClient.get(
    `/api/web-ordering/waiter/call/${encodeURIComponent(requestId)}/status`
  );
  // NW-HIGH-010: Extract from data.data?.status — data.status is the Axios HTTP status code
  // (e.g., 200), which would produce status: 200 instead of the actual call status.
  return { status: data.data?.status ?? 'pending' };
}
