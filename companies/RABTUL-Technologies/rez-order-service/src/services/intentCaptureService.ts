/**
 * RTMN Commerce Memory — Intent Capture Service
 *
 * Fire-and-forget HTTP POSTs to the rez-intent-graph service for tracking
 * order lifecycle events. Errors are logged but don't impact the caller.
 */

import { createServiceLogger } from '../config/logger';

const logger = createServiceLogger('intent-capture');

// Default URL for RTMN intent capture
const INTENT_CAPTURE_URL = process.env.INTENT_CAPTURE_URL || 'https://rez-intent-graph.onrender.com';

const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

interface TrackParams {
  userId: string;
  event: string;
  intentKey: string;
  properties?: Record<string, unknown>;
}

/**
 * Tracks an intent event by POSTing to the RTMN Commerce Memory capture endpoint.
 * This is a fire-and-forget operation — errors are swallowed to avoid impacting
 * the caller's response.
 *
 * @param params.event - The event name (e.g. 'order.placed', 'order.delivered')
 * @param params.intentKey - The RTMN intent key (e.g. 'commerce.order.lifecycle')
 * @param params.properties - Additional event properties to capture
 */
export async function track(params: TrackParams): Promise<void> {
  try {
    await fetch(`${INTENT_CAPTURE_URL}/api/intent/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': INTERNAL_SERVICE_TOKEN,
      },
      body: JSON.stringify({
        userId: params.userId,
        eventType: params.event,
        intentKey: params.intentKey,
        properties: params.properties ?? {},
        category: 'DINING',
        appType: 'rez-order-service',
      }),
    });
  } catch (err) {
    // Log errors but don't fail the caller
    logger.warn('[Intent] Track failed', {
      event: params.event,
      intentKey: params.intentKey,
      userId: params.userId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
