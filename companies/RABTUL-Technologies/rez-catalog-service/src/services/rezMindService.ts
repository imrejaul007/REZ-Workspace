/**
 * REZ Mind Integration - Catalog Service
 * Sends catalog events to Event Platform
 *
 * FIX: Map catalog events to standard REZ Mind event types
 */

import axios from 'axios';
import { logger } from '../config/logger';

const REZ_MIND_URL = process.env.REZ_MIND_URL || 'http://localhost:4008';

// Standard REZ Mind event types
type EventType = 'search' | 'view' | 'wishlist' | 'cart_add' | 'hold' | 'checkout_start' | 'fulfilled' | 'abandoned';
type Category = 'TRAVEL' | 'DINING' | 'RETAIL' | 'HOTEL_SERVICE' | 'GENERAL';

// Map catalog events to standard REZ Mind event types
const EVENT_TYPE_MAP: Record<string, { eventType: EventType; category: Category; confidence: number }> = {
  'catalog.view': { eventType: 'view', category: 'RETAIL', confidence: 0.10 },
  'catalog.add': { eventType: 'cart_add', category: 'RETAIL', confidence: 0.30 },
  'catalog.search': { eventType: 'search', category: 'RETAIL', confidence: 0.15 },
  'catalog.checkout': { eventType: 'checkout_start', category: 'RETAIL', confidence: 0.40 },
  'catalog.fulfilled': { eventType: 'fulfilled', category: 'RETAIL', confidence: 1.0 },
};

interface CatalogViewEvent {
  user_id?: string;
  merchant_id?: string;
  item_id: string;
  item_name?: string;
  category?: string;
  eventType?: string;
}

/**
 * Map catalog event to standard REZ Mind event
 */
function mapToStandardEvent(eventType: string): { eventType: EventType; category: Category; confidence: number } {
  const mapping = EVENT_TYPE_MAP[eventType];
  if (mapping) return mapping;

  // Default fallback
  return { eventType: 'view', category: 'RETAIL', confidence: 0.10 };
}

export async function sendCatalogViewToRezMind(event: CatalogViewEvent): Promise<void> {
  try {
    const eventType = event.eventType || 'catalog.view';
    const mapped = mapToStandardEvent(eventType);

    // Send to standard Intent Graph endpoint
    await axios.post(`${REZ_MIND_URL}/api/intent/capture`, {
      userId: event.user_id,
      merchantId: event.merchant_id,
      intentKey: event.item_id,
      intentQuery: event.item_name,
      eventType: mapped.eventType,
      category: mapped.category,
      confidence: mapped.confidence,
      metadata: {
        item_name: event.item_name,
        catalog_category: event.category,
        source: 'catalog_service',
      },
    });

    logger.info('[REZ Mind] Catalog event sent', {
      item_id: event.item_id,
      eventType: mapped.eventType,
      category: mapped.category,
    });
  } catch (error) {
    const err = error as { message?: string };
    logger.warn('[REZ Mind] Failed to send catalog event', {
      item_id: event.item_id,
      error: err.message,
    });
  }
}

/**
 * Send cart add event
 */
export async function sendCartAddToRezMind(event: CatalogViewEvent): Promise<void> {
  event.eventType = 'catalog.add';
  return sendCatalogViewToRezMind(event);
}

/**
 * Send search event
 */
export async function sendSearchToRezMind(event: { user_id?: string; query: string; results_count?: number }): Promise<void> {
  try {
    await axios.post(`${REZ_MIND_URL}/api/intent/capture`, {
      userId: event.user_id,
      intentKey: event.query,
      intentQuery: event.query,
      eventType: 'search',
      category: 'RETAIL',
      confidence: 0.15,
      metadata: {
        results_count: event.results_count,
        source: 'catalog_service',
      },
    });
  } catch (error) {
    const err = error as { message?: string };
    logger.warn('[REZ Mind] Failed to send search event', { error: err.message });
  }
}
