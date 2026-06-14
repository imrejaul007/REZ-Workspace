/**
 * RTMN Commerce Memory: Intent Capture Service for Resturistan
 *
 * Captures dining intent signals (menu views, orders, payments) for the
 * ReZ Mind cross-app commerce intelligence engine. Fire-and-forget —
 * never throws or breaks the request on network failure.
 *
 * Events:
 *   menu_viewed        -> search (0.15)  - discovery
 *   checkout_started   -> checkout_start (0.5) - commitment
 *   order_placed      -> fulfilled (1.0)  - highest confidence
 *   order_cancelled   -> abandoned (-0.2) - signal loss
 *   payment_completed  -> fulfilled (1.0)  - payment confirmed
 */

const INTENT_CAPTURE_URL = process.env.INTENT_CAPTURE_URL || '';

const APP_TYPE = 'resturistan';

const EVENT_TO_INTENT_MAP: Record<string, { eventType: string; category: string; confidence: number }> = {
  menu_viewed:        { eventType: 'search',          category: 'DINING', confidence: 0.15 },
  checkout_started:   { eventType: 'checkout_start',   category: 'DINING', confidence: 0.50 },
  order_placed:       { eventType: 'fulfilled',        category: 'DINING', confidence: 1.00 },
  order_cancelled:    { eventType: 'abandoned',        category: 'DINING', confidence: -0.20 },
  payment_completed:  { eventType: 'fulfilled',        category: 'DINING', confidence: 1.00 },
};

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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: params.userId,
        appType: params.appType,
        eventType: params.eventType,
        category: params.category,
        intentKey: params.intentKey,
        metadata: params.metadata,
      }),
    });
  } catch {
    // Never throw
  }
}

/**
 * High-level tracker invoked by service/controller code.
 */
export function track(params: {
  userId: string;
  event: string;
  intentKey: string;
  properties?: Record<string, unknown>;
}): void {
  const config = EVENT_TO_INTENT_MAP[params.event];
  if (!config || !params.userId) return;
  captureIntent({
    userId: params.userId,
    appType: APP_TYPE,
    eventType: config.eventType,
    category: config.category,
    intentKey: params.intentKey,
    metadata: params.properties,
  }).catch(() => {});
}
