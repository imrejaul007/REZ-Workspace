import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { logger } from '../config/logger';
import {
  RawSignal,
  IntentSignal,
  EventType,
  SignalCategory,
  NormalizedSignal,
} from '../types';

// Event type mappings per source
const SOURCE_EVENT_MAPPINGS: Record<string, Record<string, EventType>> = {
  buzzlocal: {
    'search': 'search',
    'view_profile': 'view',
    'view_business': 'view',
    'wishlist_add': 'wishlist',
    'favorite_add': 'wishlist',
    'share': 'view',
  },
  airzy: {
    'search': 'search',
    'view_flight': 'view',
    'view_hotel': 'view',
    'booking_start': 'checkout_start',
    'booking_complete': 'fulfilled',
  },
  'rez-menu-qr': {
    'scan': 'view',
    'view_menu': 'view',
    'add_to_cart': 'cart_add',
    'order': 'fulfilled',
  },
  'rez-now': {
    'search': 'search',
    'view_restaurant': 'view',
    'view_item': 'view',
    'add_to_cart': 'cart_add',
    'order_start': 'checkout_start',
    'order_complete': 'fulfilled',
  },
  risacare: {
    'search': 'search',
    'view_doctor': 'view',
    'book_appointment': 'checkout_start',
    'appointment_complete': 'fulfilled',
  },
  corpperks: {
    'search': 'search',
    'view_benefit': 'view',
    'enroll': 'checkout_start',
    'redeem': 'fulfilled',
  },
};

// Category mappings per source
const SOURCE_CATEGORY_MAPPINGS: Record<string, Record<string, SignalCategory>> = {
  buzzlocal: {
    'restaurant': 'DINING',
    'shopping': 'RETAIL',
    'service': 'GENERAL',
    'health': 'HEALTHCARE',
    'default': 'GENERAL',
  },
  airzy: {
    'flight': 'TRAVEL',
    'hotel': 'TRAVEL',
    'package': 'TRAVEL',
    'transfer': 'TRAVEL',
    'default': 'TRAVEL',
  },
  'rez-menu-qr': {
    'restaurant': 'DINING',
    'default': 'DINING',
  },
  'rez-now': {
    'restaurant': 'DINING',
    'retail': 'RETAIL',
    'default': 'DINING',
  },
  risacare: {
    'doctor': 'HEALTHCARE',
    'clinic': 'HEALTHCARE',
    'lab': 'HEALTHCARE',
    'pharmacy': 'HEALTHCARE',
    'default': 'HEALTHCARE',
  },
  corpperks: {
    'benefits': 'GENERAL',
    'wellness': 'HEALTHCARE',
    'learning': 'GENERAL',
    'default': 'GENERAL',
  },
};

// Zod schema for raw signal validation
const RawSignalSchema = z.object({
  source: z.string().min(1, 'Source is required'),
  sourceService: z.string().min(1, 'Source service is required'),
  userId: z.string().min(1, 'User ID is required'),
  eventType: z.string().min(1, 'Event type is required'),
  category: z.string().min(1, 'Category is required'),
  intentKey: z.string().min(1, 'Intent key is required'),
  intentQuery: z.string().optional(),
  metadata: z.record(z.unknown()).optional().default({}),
  timestamp: z.string().datetime().optional(),
});

export class SignalNormalizationService {
  /**
   * Normalize a raw signal from any source to canonical schema
   */
  async normalize(rawSignal: RawSignal): Promise<IntentSignal> {
    // Validate the raw signal
    const validated = RawSignalSchema.parse(rawSignal);

    // Map event type if not a standard type
    const normalizedEventType = this.normalizeEventType(
      validated.source,
      validated.eventType
    );

    // Map category if not a standard category
    const normalizedCategory = this.normalizeCategory(
      validated.source,
      validated.category
    );

    // Extract intent key and query
    const { normalizedIntentKey, normalizedQuery } = this.extractIntentData(
      validated.intentKey,
      validated.intentQuery,
      validated.metadata
    );

    // Calculate confidence score based on signal characteristics
    const confidence = this.calculateConfidence(
      normalizedEventType,
      validated.metadata
    );

    // Build canonical signal
    const signal: IntentSignal = {
      signalId: uuidv4(),
      source: validated.source.toLowerCase(),
      sourceService: validated.sourceService.toLowerCase(),
      userId: validated.userId,
      eventType: normalizedEventType,
      category: normalizedCategory,
      intentKey: normalizedIntentKey,
      intentQuery: normalizedQuery,
      metadata: this.normalizeMetadata(validated.metadata || {}),
      confidence,
      enriched: false,
      timestamp: validated.timestamp ? new Date(validated.timestamp) : new Date(),
    };

    logger.debug('Signal normalized', {
      signalId: signal.signalId,
      source: signal.source,
      eventType: signal.eventType,
      category: signal.category,
    });

    return signal;
  }

  /**
   * Normalize event type from source-specific to canonical
   */
  private normalizeEventType(source: string, eventType: string): EventType {
    const sourceKey = source.toLowerCase();
    const eventKey = eventType.toLowerCase();

    // Check for direct mapping
    if (SOURCE_EVENT_MAPPINGS[sourceKey]?.[eventKey]) {
      return SOURCE_EVENT_MAPPINGS[sourceKey][eventKey];
    }

    // Check if already a standard type
    const standardTypes: EventType[] = ['search', 'view', 'wishlist', 'cart_add', 'checkout_start', 'fulfilled'];
    if (standardTypes.includes(eventKey as EventType)) {
      return eventKey as EventType;
    }

    // Default mapping based on event type patterns
    if (eventKey.includes('search') || eventKey.includes('query')) return 'search';
    if (eventKey.includes('view') || eventKey.includes('browse')) return 'view';
    if (eventKey.includes('wishlist') || eventKey.includes('favorite')) return 'wishlist';
    if (eventKey.includes('cart') || eventKey.includes('add')) return 'cart_add';
    if (eventKey.includes('checkout') || eventKey.includes('book')) return 'checkout_start';
    if (eventKey.includes('complete') || eventKey.includes('order') || eventKey.includes('fulfill')) return 'fulfilled';

    // Default to 'view' for unknown types
    logger.warn('Unknown event type, defaulting to view', { source, eventType });
    return 'view';
  }

  /**
   * Normalize category from source-specific to canonical
   */
  private normalizeCategory(source: string, category: string): SignalCategory {
    const sourceKey = source.toLowerCase();
    const categoryKey = category.toLowerCase();

    // Check for direct mapping
    if (SOURCE_CATEGORY_MAPPINGS[sourceKey]?.[categoryKey]) {
      return SOURCE_CATEGORY_MAPPINGS[sourceKey][categoryKey];
    }

    // Check if already a standard category
    const standardCategories: SignalCategory[] = ['DINING', 'TRAVEL', 'RETAIL', 'HEALTHCARE', 'GENERAL'];
    if (standardCategories.includes(categoryKey as SignalCategory)) {
      return categoryKey as SignalCategory;
    }

    // Default mapping based on category patterns
    if (categoryKey.includes('dining') || categoryKey.includes('food') || categoryKey.includes('restaurant')) return 'DINING';
    if (categoryKey.includes('travel') || categoryKey.includes('flight') || categoryKey.includes('hotel')) return 'TRAVEL';
    if (categoryKey.includes('retail') || categoryKey.includes('shop')) return 'RETAIL';
    if (categoryKey.includes('health') || categoryKey.includes('medical') || categoryKey.includes('care')) return 'HEALTHCARE';

    // Default to 'GENERAL'
    return 'GENERAL';
  }

  /**
   * Extract and normalize intent key and query
   */
  private extractIntentData(
    intentKey: string,
    intentQuery?: string,
    metadata?: Record<string, unknown>
  ): { normalizedIntentKey: string; normalizedQuery: string | undefined } {
    let normalizedIntentKey = intentKey.trim().toLowerCase();

    // If intent key is an ID, try to get a readable key from metadata
    if (normalizedIntentKey.match(/^[a-f0-9-]{32,}$/i)) {
      const readableKey = metadata?.name || metadata?.title || metadata?.query || intentKey;
      normalizedIntentKey = String(readableKey).trim().toLowerCase();
    }

    // Normalize query - use intentQuery if provided, otherwise try metadata
    let normalizedQuery = intentQuery;
    if (!normalizedQuery && metadata?.query) {
      normalizedQuery = String(metadata.query);
    }

    return { normalizedIntentKey, normalizedQuery };
  }

  /**
   * Calculate confidence score based on signal characteristics
   */
  private calculateConfidence(
    eventType: EventType,
    metadata?: Record<string, unknown>
  ): number {
    let confidence = 0.5; // Base confidence

    // Higher confidence for more explicit intent signals
    switch (eventType) {
      case 'checkout_start':
        confidence += 0.3;
        break;
      case 'cart_add':
        confidence += 0.2;
        break;
      case 'wishlist':
        confidence += 0.15;
        break;
      case 'fulfilled':
        confidence += 0.25;
        break;
      case 'search':
        confidence += 0.1;
        break;
      case 'view':
        confidence += 0;
        break;
    }

    // Adjust based on metadata quality
    if (metadata) {
      // Presence of specific query adds confidence
      if (metadata.query || metadata.searchTerm) {
        confidence += 0.05;
      }
      // Session depth indicators
      if (metadata.sessionViews && Number(metadata.sessionViews) > 3) {
        confidence += 0.05;
      }
      // Time spent indicator
      if (metadata.timeSpent && Number(metadata.timeSpent) > 30) {
        confidence += 0.05;
      }
    }

    // Clamp to 0-1 range
    return Math.min(Math.max(confidence, 0), 1);
  }

  /**
   * Normalize metadata structure
   */
  private normalizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    const normalized: Record<string, unknown> = {};

    // Standardize common fields
    for (const [key, value] of Object.entries(metadata)) {
      const normalizedKey = key.toLowerCase().replace(/[_-]/g, '');
      normalized[normalizedKey] = value;
    }

    // Ensure location is standardized
    if (normalized.location || normalized.city || normalized.region) {
      normalized.location = normalized.location || normalized.city || normalized.region;
    }

    // Ensure price is a number if present
    if (normalized.price !== undefined) {
      normalized.price = Number(normalized.price);
    }

    return normalized;
  }

  /**
   * Batch normalize multiple signals
   */
  async normalizeBatch(rawSignals: RawSignal[]): Promise<IntentSignal[]> {
    const results: IntentSignal[] = [];

    for (const rawSignal of rawSignals) {
      try {
        const normalized = await this.normalize(rawSignal);
        results.push(normalized);
      } catch (error) {
        logger.error('Failed to normalize signal', {
          error: (error as Error).message,
          signal: rawSignal,
        });
        // Skip failed normalizations in batch
      }
    }

    return results;
  }
}

export const signalNormalizationService = new SignalNormalizationService();