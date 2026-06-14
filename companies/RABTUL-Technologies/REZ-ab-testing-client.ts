/**
 * REZ-ab-testing Client - Integrate with existing service
 * Use existing REZ-ab-testing (port 4045) for feature flags + experiments
 * SECURITY: All fetch calls include timeouts and proper error handling
 */

const AB_TESTING_URL = process.env.REZ_AB_TESTING_URL || 'http://localhost:4045';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';
const FETCH_TIMEOUT_MS = 5000;

interface AbTestingResponse {
  enabled?: boolean;
  variant?: string;
  error?: string;
}

/**
 * Fetch with timeout wrapper
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<{ ok: boolean; status: number; data: AbTestingResponse }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    let data: AbTestingResponse = {};
    try {
      data = await response.json();
    } catch (error) {
      // Response might be empty or not JSON - that's ok, log for debugging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`[REZ-ab-testing] Failed to parse JSON response from ${url}: ${errorMessage}`);
    }

    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    clearTimeout(timeoutId);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log timeout errors specifically
    if (errorMessage.includes('aborted')) {
      console.error(`[REZ-ab-testing] Request timeout after ${timeoutMs}ms: ${url}`);
    } else {
      console.error(`[REZ-ab-testing] Fetch error: ${errorMessage}`);
    }

    return { ok: false, status: 0, data: { error: errorMessage } };
  }
}

/**
 * Check if feature is enabled for user
 */
export async function isFeatureEnabled(
  flagKey: string,
  userId: string,
  metadata?: Record<string, unknown>
): Promise<{ enabled: boolean; error?: string }> {
  const result = await fetchWithTimeout(
    `${AB_TESTING_URL}/api/experiments/${flagKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({ userId, metadata }),
    },
    FETCH_TIMEOUT_MS
  );

  if (!result.ok) {
    const error = `Failed to check feature flag: HTTP ${result.status}`;
    console.error(`[REZ-ab-testing] ${error}`);
    return { enabled: false, error };
  }

  return { enabled: result.data.enabled ?? false };
}

/**
 * Get experiment variant for user
 */
export async function getVariant(
  experimentId: string,
  userId: string
): Promise<{ variant: string | null; error?: string }> {
  const result = await fetchWithTimeout(
    `${AB_TESTING_URL}/api/experiments/${experimentId}/variant`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({ userId }),
    },
    FETCH_TIMEOUT_MS
  );

  if (!result.ok) {
    const error = `Failed to get variant: HTTP ${result.status}`;
    console.error(`[REZ-ab-testing] ${error}`);
    return { variant: null, error };
  }

  return { variant: result.data.variant ?? null };
}

/**
 * Track experiment conversion
 */
export async function trackConversion(
  experimentId: string,
  userId: string,
  goalId: string
): Promise<{ success: boolean; error?: string }> {
  const result = await fetchWithTimeout(
    `${AB_TESTING_URL}/api/experiments/${experimentId}/conversion`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({ userId, goalId }),
    },
    FETCH_TIMEOUT_MS
  );

  if (!result.ok) {
    const error = `Failed to track conversion: HTTP ${result.status}`;
    console.error(`[REZ-ab-testing] ${error}`);
    return { success: false, error };
  }

  return { success: true };
}
