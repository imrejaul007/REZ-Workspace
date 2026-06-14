/**
 * REZ Mind Service - Search Service Integration
 * Sends search events to REZ Mind Event Platform
 */

import { logger } from '../config/logger';

const REZ_MIND_URL = process.env.REZ_MIND_URL || 'http://localhost:4008';

interface SearchEvent {
  user_id: string;
  query: string;
  results_count: number;
  clicked_item?: string;
  filters?: Record<string, string>;
}

/**
 * Send search event to REZ Mind (fire-and-forget)
 */
export async function sendSearchToRezMind(event: SearchEvent): Promise<void> {
  try {
    await fetch(`${REZ_MIND_URL}/webhook/consumer/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...event,
        source: 'rez-search-service',
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    logger.error('[REZ Mind] Search event failed:', error);
  }
}

/**
 * Send item view event to REZ Mind
 */
export async function sendViewToRezMind(data: {
  user_id: string;
  item_id: string;
  item_name?: string;
  duration_seconds?: number;
}): Promise<void> {
  try {
    await fetch(`${REZ_MIND_URL}/webhook/consumer/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        source: 'rez-search-service',
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    logger.error('[REZ Mind] View event failed:', error);
  }
}
