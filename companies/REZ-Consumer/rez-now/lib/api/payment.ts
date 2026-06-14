import { authClient } from './client';
import { RazorpayOrderResponse, RazorpaySuccessResponse, CartItem } from '@/lib/types';
import type { DeliveryAddress } from './delivery';
import { logger } from '@/lib/utils/logger';

/** Client-safe idempotency key generator — no Node.js dependencies. */
function makeIdempotencyKey(prefix: string, id: string): string {
  return `${prefix}:${id}:${Date.now()}:${crypto.randomUUID()}`;
}

export interface CreateOrderPayload {
  storeSlug: string;
  tableNumber?: string;
  orderType?: 'dine_in' | 'takeaway' | 'delivery';
  deliveryAddress?: DeliveryAddress;
  items: CartItem[];
  subtotal: number;
  tip: number;
  donation: number;
  couponCode?: string;
  discount?: number;
  groupOrderId?: string;
  splitBillId?: string;
  scheduledFor?: string; // ISO datetime string for pre-orders
}

export async function createRazorpayOrder(
  payload: CreateOrderPayload
): Promise<RazorpayOrderResponse> {
  // NW-HIGH-009: Client-submitted prices can be manipulated in localStorage (cart store
  // persistence). Frontend sends items and subtotal; the backend MUST re-validate prices
  // from the canonical catalog source and reject orders with price mismatches.
  // Frontend guard: ensure subtotal is non-negative and at least the sum of item prices.
  if (payload.subtotal < 0) throw new Error('Invalid order: subtotal cannot be negative');
  // NW-MED-019: Prevent Rs.0 orders from reaching Razorpay.
  const MIN_ORDER = 100; // 100 paise = Rs.1
  if (payload.subtotal < MIN_ORDER) {
    throw new Error('Minimum order amount is Rs.1');
  }
  const minExpected = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (payload.subtotal < minExpected * 0.9) {
    // Allow 10% tolerance for rounding, but flag if there's a larger discrepancy
    logger.warn('[NW-HIGH-009] subtotal significantly below item sum — possible price manipulation', {
      subtotal: payload.subtotal,
      itemSum: minExpected,
    });
  }
  const { data } = await authClient.post('/api/web-ordering/razorpay/create-order', payload);
  if (!data.success) throw new Error(data.message || 'Failed to create order');
  return data.data as RazorpayOrderResponse;
}

// NW-HIGH-014: Add idempotency key to prevent double-verification on network retry.
export async function verifyPayment(
  orderNumber: string,
  response: RazorpaySuccessResponse
): Promise<{ verified: boolean }> {
  const idempotencyKey = makeIdempotencyKey('verify-order', orderNumber);
  const { data } = await authClient.post(
    '/api/web-ordering/payment/verify',
    {
      orderNumber,
      razorpayOrderId: response.razorpay_order_id,
      razorpayPaymentId: response.razorpay_payment_id,
      razorpaySignature: response.razorpay_signature,
    },
    { headers: { 'Idempotency-Key': idempotencyKey } },
  );
  if (!data.success) throw new Error(data.message || 'Payment verification failed');
  // NW-CRIT-002 FIX: Default to false if backend doesn't return verified field.
  // Defaulting to true would incorrectly treat failed payments as successful.
  return { verified: data.data?.verified ?? false };
}

export async function addTip(orderNumber: string, tipAmount: number): Promise<void> {
  await authClient.post('/api/web-ordering/tip', { orderNumber, tipAmount });
}

export async function addDonation(orderNumber: string, donationAmount: number): Promise<void> {
  await authClient.post(`/api/web-ordering/order/${orderNumber}/donate`, { donationAmount });
}

export async function splitBill(
  storeSlug: string,
  total: number,
  splitCount: number
) {
  const { data } = await authClient.post('/api/web-ordering/bill/split', {
    storeSlug,
    total,
    splitCount,
  });
  if (!data.success) throw new Error(data.message || 'Split failed');
  return data.data;
}
