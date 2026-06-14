/**
 * Event Logging Service
 * Sends search events to REZ Event Platform
 */

const EVENT_PLATFORM_URL = process.env.REZ_EVENT_PLATFORM_URL || 'https://rez-event-platform.onrender.com';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

interface SearchEventData {
  userId?: string;
  query?: string;
  results: number;
  filters?: Record<string, unknown>;
  latencyMs?: number;
  clickPosition?: number;
  clickedItemId?: string;
}

interface NoResultsEventData {
  userId?: string;
  query: string;
  filters?: Record<string, unknown>;
}

export async function logSearchQuery(data: SearchEventData): Promise<void> {
  try {
    await fetch(`${EVENT_PLATFORM_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': INTERNAL_SERVICE_TOKEN,
      },
      body: JSON.stringify({
        type: 'search.query',
        source: 'rez-search-service',
        data: {
          query: data.query,
          resultsCount: data.results,
          userId: data.userId,
          filters: data.filters,
          latencyMs: data.latencyMs,
          timestamp: new Date().toISOString(),
        },
      }),
    });
  } catch {
    // Best-effort logging - don't fail requests
  }
}

export async function logSearchClick(data: SearchEventData): Promise<void> {
  try {
    await fetch(`${EVENT_PLATFORM_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': INTERNAL_SERVICE_TOKEN,
      },
      body: JSON.stringify({
        type: 'search.click',
        source: 'rez-search-service',
        data: {
          query: data.query,
          userId: data.userId,
          clickPosition: data.clickPosition,
          clickedItemId: data.clickedItemId,
          timestamp: new Date().toISOString(),
        },
      }),
    });
  } catch {
    // Best-effort logging - don't fail requests
  }
}

export async function logSearchNoResults(data: NoResultsEventData): Promise<void> {
  try {
    await fetch(`${EVENT_PLATFORM_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': INTERNAL_SERVICE_TOKEN,
      },
      body: JSON.stringify({
        type: 'search.no_results',
        source: 'rez-search-service',
        data: {
          query: data.query,
          userId: data.userId,
          filters: data.filters,
          timestamp: new Date().toISOString(),
        },
      }),
    });
  } catch {
    // Best-effort logging - don't fail requests
  }
}
