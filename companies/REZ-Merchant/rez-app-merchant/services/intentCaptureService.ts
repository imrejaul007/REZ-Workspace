/**
 * ReZ Mind Intent Capture Service — Merchant OS
 * Captures merchant intent signals for the ReZ Mind intent graph.
 * Events: menu viewed, order received, review received.
 *
 * Also sends to REZ Mind Event Platform for unified intelligence.
 */

const INTENT_CAPTURE_URL = process.env.EXPO_PUBLIC_INTENT_CAPTURE_URL || '';
const REZ_MIND_URL = process.env.EXPO_PUBLIC_REZ_MIND_URL || 'https://rez-event-platform.onrender.com';

export interface IntentCaptureParams {
  userId: string;
  eventType: string;
  category: string;
  intentKey: string;
  metadata?: Record<string, unknown>;
  appType: string;
}

export async function captureIntent(params: IntentCaptureParams): Promise<void> {
  if (!INTENT_CAPTURE_URL) return;
  try {
    await fetch(`${INTENT_CAPTURE_URL}/api/intent/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params }),
    });
  } catch {
    // Silently ignore errors — intent capture must not block business logic
  }
}

// ── Event-to-Intent Map ────────────────────────────────────────────────────────

const EVENT_TO_INTENT_MAP: Record<
  string,
  { eventType: string; category: string; intentKey: string }
> = {
  // Menu viewed → view (confidence 0.25)
  menu_viewed: {
    eventType: 'view',
    category: 'GENERAL',
    intentKey: 'menu_viewed',
  },
  // Order received → fulfilled (confidence 1.0)
  order_received: {
    eventType: 'fulfilled',
    category: 'GENERAL',
    intentKey: 'order_received',
  },
  // Review received → cart_add (confidence 0.30)
  review_received: {
    eventType: 'cart_add',
    category: 'GENERAL',
    intentKey: 'review_received',
  },
};

export function track(params: {
  userId: string;
  event: string;
  appType: string;
  intentKey: string;
  properties?: Record<string, unknown>;
}): void {
  const config = EVENT_TO_INTENT_MAP[params.event];
  if (!config || !params.userId) return;
  captureIntent({ ...params, ...config }).catch(() => {});
}

// ── Domain-Specific Capture Helpers ────────────────────────────────────────────

/**
 * Track menu viewed — called when a merchant views their menu/catalog.
 * Uses storeId as the identifier.
 */
export function trackMenuViewed(storeId: string): void {
  track({
    userId: storeId,
    event: 'menu_viewed',
    appType: 'merchant_os',
    intentKey: `menu_${storeId}`,
  });
}

/**
 * Track order received — called when the merchant receives a new order.
 * Uses storeId as the identifier since merchantId isn't directly accessible in socket handlers.
 */
export function trackOrderReceived(storeId: string, orderId: string, orderNumber: string): void {
  track({
    userId: storeId,
    event: 'order_received',
    appType: 'merchant_os',
    intentKey: `order_${orderId}`,
    properties: { orderNumber },
  });
}

/**
 * Track review received — called when a new review is posted for a merchant's product/store.
 * Uses reviewId as the identifier since merchantId isn't directly accessible.
 */
export function trackReviewReceived(reviewId: string, rating: number): void {
  track({
    userId: `review_${reviewId}`,
    event: 'review_received',
    appType: 'merchant_os',
    intentKey: `review_${reviewId}`,
    properties: { rating },
  });
}

// ── REZ Mind Integration ──────────────────────────────────────────────────────

interface MerchantOrderEvent {
  merchant_id: string;
  order_id: string;
  customer_id: string;
  items: Array<{ item_id: string; quantity: number; price: number }>;
  total_amount: number;
  payment_method?: string;
}

interface InventoryLowEvent {
  merchant_id: string;
  item_id: string;
  item_name?: string;
  current_stock: number;
  threshold: number;
  avg_daily_sales?: number;
}

async function sendToRezMind(endpoint: string, data: Record<string, unknown>): Promise<void> {
  try {
    await fetch(`${REZ_MIND_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        source: 'rez-app-merchant',
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    // Fire-and-forget
  }
}

/**
 * Send order event to REZ Mind
 */
export async function sendOrderToRezMind(order: MerchantOrderEvent): Promise<void> {
  await sendToRezMind('/webhook/merchant/order', order as unknown as Record<string, unknown>);
}

/**
 * Send inventory low event to REZ Mind
 */
export async function sendInventoryLowToRezMind(inventory: InventoryLowEvent): Promise<void> {
  await sendToRezMind(
    '/webhook/merchant/inventory',
    inventory as unknown as Record<string, unknown>
  );
}

/**
 * Send payment success event to REZ Mind
 */
export async function sendPaymentToRezMind(data: {
  merchant_id: string;
  transaction_id: string;
  amount: number;
  order_id?: string;
}): Promise<void> {
  await sendToRezMind('/webhook/merchant/payment', data);
}
