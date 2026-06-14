// SECURITY FIX: Fail at startup instead of silently falling back
const INTENT_CAPTURE_URL = process.env.INTENT_CAPTURE_URL;
if (!INTENT_CAPTURE_URL) {
  throw new Error('INTENT_CAPTURE_URL environment variable is required');
}

const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

interface TrackParams {
  userId?: string;
  event: string;
  intentKey: string;
  properties?: Record<string, unknown>;
}

export async function track(params: TrackParams): Promise<void> {
  try {
    await fetch(`${INTENT_CAPTURE_URL}/api/intent/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': INTERNAL_SERVICE_TOKEN,
      },
      body: JSON.stringify({
        userId: params.userId ?? 'anonymous',
        eventType: params.event,
        intentKey: params.intentKey,
        properties: params.properties ?? {},
        appType: 'rez-gamification',
        category: 'GENERAL',
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
