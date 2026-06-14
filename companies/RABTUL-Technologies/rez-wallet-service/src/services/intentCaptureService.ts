/**
 * RTMN Commerce Memory — Intent Capture for Wallet Service
 *
 * Fire-and-forget HTTP POSTs to the rez-intent-graph service for tracking
 * wallet events. Errors are logged but don't impact the caller.
 */

import { logger } from '../config/logger';

const INTENT_CAPTURE_URL = process.env.INTENT_CAPTURE_URL || process.env.INTENT_GRAPH_URL;
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

export async function captureCoinIntent(
  userId: string,
  type: 'earned' | 'spent',
  amount: number,
  coinType: string,
  source: string
): Promise<void> {
  if (!INTENT_CAPTURE_URL) {
    logger.warn('[Intent] No INTENT_CAPTURE_URL set, skipping');
    return;
  }

  try {
    await fetch(`${INTENT_CAPTURE_URL}/api/intent/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': INTERNAL_SERVICE_TOKEN,
      },
      body: JSON.stringify({
        userId,
        eventType: type === 'earned' ? 'coins_earned' : 'coins_spent',
        intentKey: `wallet_${type}_${source}`,
        category: 'REWARDS',
        appType: 'wallet',
        metadata: {
          amount,
          coinType,
          source,
        },
      }),
    });
  } catch (err) {
    logger.warn('[Intent] Capture failed', { userId, error: err instanceof Error ? err.message : String(err) });
  }
}
