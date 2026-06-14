/**
 * ReZ Mind Intent Capture Service
 *
 * Captures user intent signals from the web menu app and sends them to the
 * ReZ Mind intent graph for commerce memory and recommendation systems.
 *
 * Also sends to REZ Mind Event Platform for unified intelligence.
 *
 * Events tracked:
 *   menu_viewed    -> view     (confidence 0.25)
 *   item_added     -> cart_add (confidence 0.60)
 *   checkout_start -> checkout_start (confidence 0.80)
 *   order_placed   -> fulfilled (confidence 1.0)
 */

const INTENT_CAPTURE_URL = process.env.NEXT_PUBLIC_INTENT_CAPTURE_URL || 'https://rez-intent-graph.onrender.com';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';
const REZ_MIND_URL = process.env.NEXT_PUBLIC_REZ_MIND_URL || 'https://rez-event-platform.onrender.com';

const EVENT_TO_INTENT_MAP: Record<string, { eventType: string; category: string; confidence: number }> = {
  menu_viewed: { eventType: 'view', category: 'DINING', confidence: 0.25 },
  item_added: { eventType: 'cart_add', category: 'DINING', confidence: 0.60 },
  checkout_started: { eventType: 'checkout_start', category: 'DINING', confidence: 0.80 },
  payment_initiated: { eventType: 'checkout_start', category: 'DINING', confidence: 0.85 },
  coupon_applied: { eventType: 'checkout_start', category: 'DINING', confidence: 0.90 },
  order_placed: { eventType: 'fulfilled', category: 'DINING', confidence: 1.0 },
  order_completed: { eventType: 'fulfilled', category: 'DINING', confidence: 1.0 },
  scan_pay_completed: { eventType: 'fulfilled', category: 'DINING', confidence: 1.0 },
  store_viewed: { eventType: 'view', category: 'DINING', confidence: 0.3 },
  menu_item_viewed: { eventType: 'view', category: 'DINING', confidence: 0.25 },
  add_to_cart: { eventType: 'cart_add', category: 'DINING', confidence: 0.6 },
  remove_from_cart: { eventType: 'view', category: 'DINING', confidence: 0.1 },
  cart_viewed: { eventType: 'view', category: 'DINING', confidence: 0.2 },
  login_started: { eventType: 'search', category: 'DINING', confidence: 0.1 },
  login_completed: { eventType: 'search', category: 'DINING', confidence: 0.15 },
  scan_pay_initiated: { eventType: 'view', category: 'DINING', confidence: 0.2 },
};

/**
 * Low-level intent capture function. Always non-blocking and never throws.
 */
export async function captureIntent(params: {
  userId: string;
  eventType: string;
  category: string;
  intentKey: string;
  metadata?: Record<string, unknown>;
  appType: string;
}): Promise<void> {
  if (!INTENT_CAPTURE_URL) return;
  try {
    await fetch(`${INTENT_CAPTURE_URL}/api/intent/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': INTERNAL_SERVICE_TOKEN,
      },
      body: JSON.stringify({
        userId: params.userId,
        appType: params.appType,
        eventType: params.eventType,
        category: params.category,
        intentKey: params.intentKey,
        metadata: params.metadata,
      }),
    });
  } catch (error) {
    // Never throw — intent capture must never break UX
    logger.warn('[intentCapture] Failed to capture intent:', error);
  }
}

/**
 * High-level track function. Looks up the event in EVENT_TO_INTENT_MAP and
 * fires an intent capture request if configured and user is authenticated.
 *
 * This is called internally by lib/analytics/events.ts — do not call directly.
 * Use useTrack() from lib/analytics/events instead.
 */
export function track(params: {
  userId: string;
  event: string;
  appType: string;
  intentKey: string;
  metadata?: Record<string, unknown>;
}): void {
  const config = EVENT_TO_INTENT_MAP[params.event];
  if (!config || !params.userId) return;
  captureIntent({
    userId: params.userId,
    appType: params.appType,
    eventType: config.eventType,
    category: config.category,
    intentKey: params.intentKey,
    metadata: params.metadata,
  }).catch((error) => {
    logger.warn('[intentCapture] track() failed:', error);
  });
}

// ── REZ Mind Integration ──────────────────────────────────────────────────────

async function sendToRezMind(endpoint: string, data: Record<string, unknown>): Promise<void> {
  try {
    await fetch(`${REZ_MIND_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        source: 'rez-now',
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    // Fire-and-forget: log but don't throw
    logger.warn('[rezMind] Failed to send to ReZ Mind:', error);
  }
}

/**
 * Send order event to REZ Mind
 */
export async function sendOrderToRezMind(order: {
  user_id: string;
  order_id: string;
  merchant_id: string;
  items: Array<{ item_id: string; quantity: number; price: number }>;
  total_amount: number;
}): Promise<void> {
  await sendToRezMind('/webhook/consumer/order', order);
}

/**
 * Send search event to REZ Mind
 */
export async function sendSearchToRezMind(search: {
  user_id: string;
  query: string;
  results_count?: number;
}): Promise<void> {
  await sendToRezMind('/webhook/consumer/search', search);
}

/**
 * Send scan event to REZ Mind
 */
export async function sendScanToRezMind(scan: {
  user_id: string;
  store_id: string;
  action: string;
}): Promise<void> {
  await sendToRezMind('/webhook/consumer/scan', scan);
}

/**
 * Send view event to REZ Mind
 */
export async function sendViewToRezMind(view: {
  user_id: string;
  item_id: string;
  item_name?: string;
  duration_seconds?: number;
}): Promise<void> {
  await sendToRezMind('/webhook/consumer/view', view);
}
