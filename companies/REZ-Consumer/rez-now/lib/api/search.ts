import { deduplicatedGet } from './client';
import { logger } from '@/lib/utils/logger';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.rezapp.com';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StoreSearchResult {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  storeType: string;
  category: string;
  address: string;
  isOpen: boolean;
  cuisine?: string;
}

export interface SearchApiResponse {
  success: boolean;
  data?: StoreSearchResult[];
  message?: string;
}

export interface FeaturedStoresResponse {
  success: boolean;
  data?: StoreSearchResult[];
  message?: string;
}

// ── Wrappers ──────────────────────────────────────────────────────────────────

/**
 * Search stores by query string.
 * @param q - Search query
 * @param limit - Max results (default 10)
 * @param page - 1-based page number (default 1)
 */
export async function searchStores(
  q: string,
  limit = 10,
  page = 1
): Promise<StoreSearchResult[]> {
  const params = new URLSearchParams({
    q: q.trim(),
    limit: String(limit),
    page: String(page),
  });

  // C3 FIX: Use deduplicatedGet instead of raw fetch — attaches axios interceptors,
  // deduplicates concurrent requests, and handles errors consistently with the rest of the app.
  const data = await deduplicatedGet<SearchApiResponse>(
    `${BASE_URL}/api/web-ordering/search`,
    { params: Object.fromEntries(params) }
  );
  return data?.data ?? [];
}

/**
 * Fetch featured stores for the homepage.
 * NW-MED-022: Implements exponential backoff retry before falling back to empty array.
 * A transient API failure used to be cached for 5 minutes via next.js fetch caching,
 * leaving the featured stores section blank. Now retries up to 3 times with backoff.
 */
export async function getFeaturedStores(): Promise<StoreSearchResult[]> {
  const BACKOFF_MS = [500, 1500, 4000];
  const MAX_ATTEMPTS = 3;
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const data = await deduplicatedGet<FeaturedStoresResponse>(
        `${BASE_URL}/api/web-ordering/stores/featured`,
      );
      return data?.data ?? [];
    } catch (err) {
      lastError = err;
      if (attempt < MAX_ATTEMPTS - 1) {
        await new Promise((resolve) => setTimeout(resolve, BACKOFF_MS[attempt] ?? BACKOFF_MS[BACKOFF_MS.length - 1]));
      }
    }
  }

  logger.warn('[search] getFeaturedStores failed after 3 attempts', { error: lastError });
  return [];
}
