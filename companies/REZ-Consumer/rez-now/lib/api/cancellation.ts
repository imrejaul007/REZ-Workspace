import { randomUUID } from 'crypto';
import { authClient } from './client';

/** Client-safe idempotency key generator — no Node.js dependencies. */
function makeIdempotencyKey(prefix: string, id: string): string {
  return `${prefix}:${id}:${Date.now()}:${randomUUID()}`;
}

export async function cancelOrder(
  orderNumber: string,
  reason: string,
): Promise<{ success: boolean; refundInitiated: boolean }> {
  // NW-MED-006: Add idempotency key to prevent double-cancellation on network retry.
  // NW-MED-056: Consolidated here — single cancelOrder with reason parameter.
  const idempotencyKey = makeIdempotencyKey('cancel', orderNumber);
  const { data } = await authClient.post(
    `/api/web-ordering/orders/${orderNumber}/cancel`,
    { reason },
    { headers: { 'Idempotency-Key': idempotencyKey } },
  );
  if (!data.success) throw new Error(data.message || 'Cancel failed');
  return { success: true, refundInitiated: Boolean(data.refundInitiated) };
}
