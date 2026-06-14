/**
 * RTMN Commerce Memory — Intent Capture Service for Resturistan
 *
 * Fire-and-forget HTTP POSTs to the rez-intent-graph service for tracking
 * order and menu events. Failures are silently swallowed so they never
 * impact the caller's response time.
 */

const INTENT_CAPTURE_URL = process.env.INTENT_CAPTURE_URL || 'https://rez-intent-graph.onrender.com';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

const EVENT_TO_INTENT_MAP: Record<string, { eventType: string; category: string; confidence: number }> = {
  menu_viewed: { eventType: 'view', category: 'DINING', confidence: 0.25 },
  checkout_started: { eventType: 'checkout_start', category: 'DINING', confidence: 0.80 },
  order_placed: { eventType: 'fulfilled', category: 'DINING', confidence: 1.0 },
  order_cancelled: { eventType: 'abandoned', category: 'DINING', confidence: 0.1 },
  payment_completed: { eventType: 'fulfilled', category: 'DINING', confidence: 1.0 },
};

interface TrackParams {
  userId?: string;
  event: string;
  intentKey: string;
  properties?: Record<string, unknown>;
}

/**
 * High-level tracker function.
 */
export async function track(params: TrackParams): Promise<void> {
  if (!params.userId) return;

  const config = EVENT_TO_INTENT_MAP[params.event];
  const eventType = config?.eventType || 'view';
  const category = config?.category || 'DINING';

  try {
    await fetch(`${INTENT_CAPTURE_URL}/api/intent/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': INTERNAL_SERVICE_TOKEN,
      },
      body: JSON.stringify({
        userId: params.userId,
        eventType,
        category,
        appType: 'resturistan',
        intentKey: params.intentKey,
        metadata: params.properties,
      }),
    });
  } catch {
    // Fire-and-forget — swallow all errors
  }
}

/**
 * NestJS module provider for DI.
 */
export const IntentCaptureService = {
  provide: 'INTENT_CAPTURE_SERVICE',
  useFactory: () => ({
    track,
  }),
};
