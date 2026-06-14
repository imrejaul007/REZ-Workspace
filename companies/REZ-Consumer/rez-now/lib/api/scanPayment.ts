import { authClient } from './client';
import { RazorpaySuccessResponse, ScanPayOrderResponse } from '@/lib/types';

/** Client-safe idempotency key generator — no Node.js dependencies (no winston). */
function makeIdempotencyKey(prefix: string, id: string): string {
  return `${prefix}:${id}:${Date.now()}:${crypto.randomUUID()}`;
}

export async function createScanPayOrder(
  storeSlug: string,
  amountPaise: number
): Promise<ScanPayOrderResponse> {
  const { data } = await authClient.post('/api/store-payment/razorpay/create-order', {
    storeSlug,
    amount: amountPaise,
  });
  if (!data.success) throw new Error(data.message || 'Failed to create payment');
  return data.data as ScanPayOrderResponse;
}

export async function verifyScanPayment(
  paymentId: string,
  response: RazorpaySuccessResponse
): Promise<{ verified: boolean }> {
  const { data } = await authClient.post('/api/store-payment/payment/verify', {
    paymentId,
    razorpayOrderId: response.razorpay_order_id,
    razorpayPaymentId: response.razorpay_payment_id,
    razorpaySignature: response.razorpay_signature,
  });
  if (!data.success) throw new Error(data.message || 'Payment verification failed');
  // NW-CRIT-002 FIX: Default to false if backend doesn't return verified field.
  // Defaulting to true would incorrectly treat failed payments as successful —
  // consistent with verifyPayment() which also returns false on unknown.
  return { verified: data.data?.verified ?? false };
}

export async function creditScanPayCoins(paymentId: string): Promise<{ coinsEarned: number }> {
  // Idempotency: the paymentId is a natural idempotency key. The backend MUST deduplicate
  // on this value to prevent double-coin-credit on retry. We also include a retry-friendly
  // key in the header for backends that support the Idempotency-Key convention.
  const idempotencyKey = makeIdempotencyKey('scanpay-coin', paymentId);
  const { data } = await authClient.post(
    '/api/store-payment/coins/credit',
    { paymentId },
    { headers: { 'Idempotency-Key': idempotencyKey } },
  );
  return { coinsEarned: data.data?.coinsEarned || 0 };
}

export interface ScanPayHistoryItem {
  paymentId: string;
  storeName: string;
  storeSlug: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
}

export async function getScanPayHistory(): Promise<ScanPayHistoryItem[]> {
  const { data } = await authClient.get('/api/store-payment/history');
  if (!data.success) throw new Error(data.message || 'Failed to load history');
  // NW-MED-027: Return typed data instead of 'unknown' so callers get IDE autocomplete.
  return (data.data ?? []) as ScanPayHistoryItem[];
}

export interface PaymentStatusResult {
  status: 'initiated' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'expired';
  transactionId?: string;
  completedAt?: string;
}

/** Polls backend for StorePayment status after UPI intent launch. */
export async function checkPaymentStatus(paymentId: string): Promise<PaymentStatusResult> {
  const { data } = await authClient.get(`/api/store-payment/status/${paymentId}`);
  if (!data.success) throw new Error(data.message || 'Failed to check payment status');
  return data.data as PaymentStatusResult;
}
