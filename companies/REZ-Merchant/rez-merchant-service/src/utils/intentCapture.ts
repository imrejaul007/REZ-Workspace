/**
 * Intent Capture Utility
 * Captures user intent events and sends them to REZ Mind (Intent Graph)
 *
 * REZ Mind URL: configured via INTENT_CAPTURE_URL or INTENT_GRAPH_URL
 * Auth: Uses x-internal-token header for server-to-server auth
 */

import { logger } from '../config/logger';

export interface IntentParams {
  userId: string;
  appType: string;
  eventType: string;
  intentKey: string;
  category: string;
  metadata?: Record<string, unknown>;
  merchantId?: string;
  intentQuery?: string;
}

interface IntentCaptureResponse {
  success: boolean;
  intentId?: string;
  error?: string;
}

// REZ Mind base URL
const INTENT_GRAPH_URL = process.env.INTENT_CAPTURE_URL || process.env.INTENT_GRAPH_URL || 'http://localhost:4013';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

/**
 * Capture user intent event and send to REZ Mind
 */
export async function captureIntent(params: IntentParams): Promise<IntentCaptureResponse> {
  // Validate required params
  if (!params.userId || !params.appType || !params.eventType || !params.intentKey || !params.category) {
    logger.warn('[IntentCapture] Missing required params', { params });
    return { success: false, error: 'Missing required params' };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(`${INTENT_GRAPH_URL}/api/intent/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(INTERNAL_TOKEN && { 'x-internal-token': INTERNAL_TOKEN }),
      },
      body: JSON.stringify({
        userId: params.userId,
        appType: params.appType,
        eventType: params.eventType,
        intentKey: params.intentKey,
        category: params.category,
        metadata: {
          ...params.metadata,
          merchantId: params.merchantId,
        },
        intentQuery: params.intentQuery,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({ error: 'Unknown error' }))) as { error?: string };
      logger.warn('[IntentCapture] Failed to capture intent', {
        status: response.status,
        error: errorData.error,
        params,
      });
      return { success: false, error: errorData.error };
    }

    const data = (await response.json()) as { intentId?: string };
    logger.debug('[IntentCapture] Intent captured successfully', {
      intentId: data.intentId,
      intentKey: params.intentKey,
    });

    return { success: true, intentId: data.intentId };
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      logger.warn('[IntentCapture] Request timeout', { intentKey: params.intentKey });
      return { success: false, error: 'Request timeout' };
    }

    logger.error('[IntentCapture] Failed to capture intent', {
      error: (error as Error).message,
      params,
    });
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Capture intent with fire-and-forget (non-blocking)
 * Use this when you don't need to wait for the response
 */
export function captureIntentFireAndForget(params: IntentParams): void {
  // Fire and forget - don't await
  captureIntent(params).catch((error) => {
    logger.warn('[IntentCapture] Background capture failed', { error: error.message });
  });
}
