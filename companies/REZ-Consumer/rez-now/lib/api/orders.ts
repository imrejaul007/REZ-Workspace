import { authClient } from './client';
import { WebOrder, WebOrderStatus, OrderHistoryResponse, StampCard } from '@/lib/types';

/** Client-safe idempotency key generator — no Node.js dependencies. */
function makeIdempotencyKey(prefix: string, id: string): string {
  return `${prefix}:${id}:${Date.now()}:${crypto.randomUUID()}`;
}

export async function getOrder(orderNumber: string): Promise<WebOrder> {
  const { data } = await authClient.get(`/api/web-ordering/order/${orderNumber}`);
  if (!data.success) throw new Error(data.message || 'Order not found');
  return data.data as WebOrder;
}

// NW-MED-056 + NW-MED-006: The canonical cancelOrder lives in cancellation.ts.
// This file previously had a reason-less cancelOrder — it is now removed.
// Import from '@/lib/api/cancellation' for all cancellation calls.
// (kept here to avoid breaking existing imports — re-exports with deprecation note)

export async function rateOrder(
  orderNumber: string,
  rating: number,
  comment: string,
): Promise<void> {
  // NW-MED-047: Use authClient — backend must verify caller owns this order.
  // publicClient allowed anyone to rate any order by guessing the order number.
  // NW-MED-003: Enforce 1-5 integer range and comment length.
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('Rating must be an integer between 1 and 5');
  }
  const MAX_COMMENT = 1000;
  const trimmedComment = comment.trim().slice(0, MAX_COMMENT);
  const payload: Record<string, unknown> = {};
  if (trimmedComment) payload.comment = trimmedComment;
  const { data } = await authClient.post(
    `/api/web-ordering/orders/${orderNumber}/rating`,
    { rating, ...payload },
    { headers: { 'X-Requested-With': 'XMLHttpRequest' } },
  );
  if (!data.success) throw new Error(data.message || 'Rating failed');
}

export async function submitFeedback(orderNumber: string, feedback: {
  rating?: number;
  comment?: string;
  reason?: string;
  description?: string;
  isDispute?: boolean;
}): Promise<void> {
  const { data } = await authClient.post(`/api/web-ordering/order/${orderNumber}/feedback`, feedback);
  if (!data.success) throw new Error(data.message || 'Feedback failed');
}

export async function getOrderHistory(page = 1, limit = 10): Promise<OrderHistoryResponse> {
  const { data } = await authClient.get('/api/web-ordering/orders/history', {
    params: { page, limit },
  });
  if (!data.success) throw new Error(data.message || 'Failed to load history');
  return data.data as OrderHistoryResponse;
}

export async function getLoyaltyStamps(storeSlug: string): Promise<StampCard> {
  const { data } = await authClient.get('/api/web-ordering/loyalty/stamps', {
    params: { storeSlug },
  });
  if (!data.success) throw new Error(data.message || 'Failed to load stamps');
  return data.data as StampCard;
}

export async function sendReceipt(orderNumber: string, via: 'whatsapp' | 'email'): Promise<void> {
  const { data } = await authClient.post('/api/web-ordering/receipt/send', {
    orderNumber,
    via,
  });
  if (!data.success) throw new Error(data.message || 'Receipt send failed');
}

export async function creditCoins(orderNumber: string): Promise<{ coinsEarned: number }> {
  // Idempotency: the orderNumber is a natural idempotency key. The backend MUST deduplicate
  // on this value to prevent double-coin-credit on retry. We also include a retry-friendly
  // key in the header for backends that support the Idempotency-Key convention.
  const idempotencyKey = makeIdempotencyKey('order-coin', orderNumber);
  const { data } = await authClient.post(
    '/api/web-ordering/coins/credit',
    { orderNumber },
    { headers: { 'Idempotency-Key': idempotencyKey } },
  );
  return { coinsEarned: data.data?.coinsEarned || 0 };
}

export async function setOrderStatus(
  orderNumber: string,
  status: WebOrderStatus
): Promise<void> {
  // This is only for merchant use — included for completeness
  const { data } = await authClient.put(`/api/web-ordering/order/${orderNumber}/update-status`, {
    status,
  });
  if (!data.success) throw new Error(data.message || 'Status update failed');
}
