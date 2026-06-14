// @ts-nocheck
/**
 * useAnalyticsValidation - Analytics event validation and health monitoring
 *
 * PRODUCTION-READY: Validates analytics events, monitors queue health,
 * and ensures data quality before events are sent.
 *
 * @example
 * ```tsx
 * import { useAnalyticsValidation, validateEvent } from '@/hooks/useAnalyticsValidation';
 *
 * function ProductCard({ product }) {
 *   const { trackValidated, getStats } = useAnalyticsValidation();
 *
 *   const handlePress = () => {
 *     trackValidated('product_click', {
 *       productId: product.id,
 *       productName: product.name,
 *       price: product.price,
 *     });
 *   };
 * }
 * ```
 */

import { useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import analyticsService from '@/services/analyticsService';
import { logger } from '@/utils/logger';

// ============================================================================
// Event Schemas
// ============================================================================

interface EventSchema {
  required: string[];
  optional?: string[];
  types?: Record<string, string>;
}

const EVENT_SCHEMAS: Record<string, EventSchema> = {
  product_view: {
    required: ['product_id', 'product_name', 'product_price', 'category', 'brand'],
    types: { product_price: 'number' },
  },
  add_to_cart: {
    required: ['product_id', 'product_name', 'price', 'quantity', 'total_value'],
    types: { price: 'number', quantity: 'number', total_value: 'number' },
  },
  purchase: {
    required: ['order_id', 'total_amount', 'payment_method', 'currency'],
    types: { total_amount: 'number' },
  },
  page_view: {
    required: ['page'],
  },
  search: {
    required: ['query', 'results_count'],
    types: { results_count: 'number' },
  },
  error: {
    required: ['error_message'],
  },
  performance: {
    required: ['metric', 'value'],
    types: { value: 'number' },
  },
};

// ============================================================================
// Validation Functions
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate an analytics event against its schema
 */
export function validateEvent(eventName: string, properties?: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if schema exists
  const schema = EVENT_SCHEMAS[eventName];
  if (!schema) {
    warnings.push(`No schema defined for event: ${eventName}`);
    return { valid: true, errors, warnings }; // Unknown events are still valid
  }

  // Check required fields
  if (!properties) {
    errors.push(`Event ${eventName} missing properties object`);
    return { valid: false, errors, warnings };
  }

  for (const field of schema.required) {
    if (properties[field] === undefined || properties[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Type validation
  if (schema.types) {
    for (const [field, expectedType] of Object.entries(schema.types)) {
      const value = properties[field];
      if (value !== undefined && typeof value !== expectedType) {
        errors.push(`Field ${field} should be ${expectedType}, got ${typeof value}`);
      }
    }
  }

  // Sanitize sensitive data
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'ssn', 'card'];
  for (const field of Object.keys(properties)) {
    if (sensitiveFields.some((s) => field.toLowerCase().includes(s))) {
      warnings.push(`Sensitive field detected: ${field} - ensure this is intentional`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate product data structure
 */
export function validateProductData(product: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const requiredFields = ['id', 'name'];
  for (const field of requiredFields) {
    if (!product[field]) {
      errors.push(`Product missing required field: ${field}`);
    }
  }

  // Price validation
  const price = product.price ?? product.productPrice ?? product.finalPrice;
  if (price !== undefined) {
    if (typeof price !== 'number') {
      errors.push('Price must be a number');
    } else if (price < 0) {
      errors.push('Price cannot be negative');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Hook
// ============================================================================

interface AnalyticsStats {
  sessionId: string;
  eventsQueued: number;
  eventsFlushed: number;
  validationErrors: number;
  lastValidationError?: string;
  isHealthy: boolean;
}

interface UseAnalyticsValidationReturn {
  /** Track an event with automatic validation */
  trackValidated: (eventName: string, properties?: Record<string, unknown>) => void;
  /** Track with custom validation */
  trackWithValidation: (
    eventName: string,
    properties: Record<string, unknown>,
    schema?: EventSchema
  ) => void;
  /** Manually validate before tracking */
  validate: (eventName: string, properties?: Record<string, unknown>) => ValidationResult;
  /** Get analytics health stats */
  getStats: () => AnalyticsStats;
  /** Check if analytics is healthy */
  isHealthy: () => boolean;
  /** Disable analytics temporarily */
  disable: () => void;
  /** Re-enable analytics */
  enable: () => void;
  /** Force flush queued events */
  flush: () => Promise<void>;
}

export function useAnalyticsValidation(): UseAnalyticsValidationReturn {
  const router = useRouter();
  const statsRef = useRef({
    eventsFlushed: 0,
    validationErrors: 0,
    lastValidationError: undefined as string | undefined,
  });

  // Track page views automatically
  useEffect(() => {
    if (!router.isReady) return;

    const subscription = router.subscribe((e) => {
      if (e.url) {
        // Extract page name from URL
        const urlPath = e.url.split('?')[0].replace(/\//g, '_').replace(/^_/, '');
        const pageName = urlPath || 'home';

        trackValidated('page_view', { page: pageName, url: e.url });
      }
    });

    return () => {
      subscription?.();
    };
  }, [router]);

  /**
   * Track event with automatic validation
   */
  const trackValidated = useCallback(
    (eventName: string, properties?: Record<string, unknown>) => {
      const result = validateEvent(eventName, properties);

      if (!result.valid) {
        statsRef.current.validationErrors++;
        statsRef.current.lastValidationError = result.errors.join('; ');

        // Log validation errors in dev
        if (__DEV__) {
          logger.warn('[Analytics] Validation failed', {
            event: eventName,
            errors: result.errors,
          });
        }

        // Still track with validation error attached
        analyticsService.track(eventName, {
          ...properties,
          _validation_errors: result.errors,
          _validation_warnings: result.warnings,
        });
        return;
      }

      // Log warnings in dev
      if (result.warnings.length > 0 && __DEV__) {
        logger.debug('[Analytics] Validation warnings', {
          event: eventName,
          warnings: result.warnings,
        });
      }

      analyticsService.track(eventName, properties);
    },
    []
  );

  /**
   * Track with custom schema validation
   */
  const trackWithValidation = useCallback(
    (
      eventName: string,
      properties: Record<string, unknown>,
      schema?: EventSchema
    ) => {
      if (!schema) {
        analyticsService.track(eventName, properties);
        return;
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      // Check required fields
      for (const field of schema.required) {
        if (properties[field] === undefined || properties[field] === null) {
          errors.push(`Missing required field: ${field}`);
        }
      }

      // Type validation
      if (schema.types) {
        for (const [field, expectedType] of Object.entries(schema.types)) {
          const value = properties[field];
          if (value !== undefined && typeof value !== expectedType) {
            errors.push(`Field ${field} should be ${expectedType}`);
          }
        }
      }

      if (errors.length > 0) {
        statsRef.current.validationErrors++;
        statsRef.current.lastValidationError = errors.join('; ');

        logger.warn('[Analytics] Custom validation failed', { event: eventName, errors });
        return;
      }

      analyticsService.track(eventName, properties);
    },
    []
  );

  /**
   * Manually validate an event
   */
  const validate = useCallback(
    (eventName: string, properties?: Record<string, unknown>): ValidationResult => {
      return validateEvent(eventName, properties);
    },
    []
  );

  /**
   * Get analytics statistics
   */
  const getStats = useCallback((): AnalyticsStats => {
    const sessionStats = analyticsService.getSessionStats();

    return {
      sessionId: sessionStats.sessionId,
      eventsQueued: sessionStats.eventsCount,
      eventsFlushed: statsRef.current.eventsFlushed,
      validationErrors: statsRef.current.validationErrors,
      lastValidationError: statsRef.current.lastValidationError,
      isHealthy: statsRef.current.validationErrors < 10, // Unhealthy if >10 validation errors
    };
  }, []);

  /**
   * Check if analytics is healthy
   */
  const isHealthy = useCallback((): boolean => {
    return statsRef.current.validationErrors < 10;
  }, []);

  /**
   * Disable analytics
   */
  const disable = useCallback(() => {
    analyticsService.setEnabled(false);
    logger.debug('[Analytics] Disabled');
  }, []);

  /**
   * Enable analytics
   */
  const enable = useCallback(() => {
    analyticsService.setEnabled(true);
    logger.debug('[Analytics] Enabled');
  }, []);

  /**
   * Force flush queued events
   */
  const flush = useCallback(async () => {
    await analyticsService.flush();
    statsRef.current.eventsFlushed++;
  }, []);

  return {
    trackValidated,
    trackWithValidation,
    validate,
    getStats,
    isHealthy,
    disable,
    enable,
    flush,
  };
}

// ============================================================================
// Batch Operations
// ============================================================================

interface BatchTrackingOptions {
  /** Maximum events per batch */
  maxBatchSize?: number;
  /** Flush interval in ms */
  flushInterval?: number;
  /** Validation enabled */
  validate?: boolean;
}

/**
 * Create a batch tracker for high-volume events
 */
export function createBatchTracker(options: BatchTrackingOptions = {}) {
  const { maxBatchSize = 50, validate = true } = options;

  let batch: Array<{ event: string; properties?: Record<string, unknown> }> = [];

  const addToBatch = (eventName: string, properties?: Record<string, unknown>) => {
    if (validate) {
      const result = validateEvent(eventName, properties);
      if (!result.valid) {
        logger.warn('[BatchTracker] Skipping invalid event', { event: eventName, errors: result.errors });
        return;
      }
    }

    batch.push({ event: eventName, properties });

    if (batch.length >= maxBatchSize) {
      flush();
    }
  };

  const flush = () => {
    if (batch.length === 0) return;

    for (const { event, properties } of batch) {
      analyticsService.track(event, properties);
    }

    batch = [];
    analyticsService.flush();
  };

  return {
    track: addToBatch,
    flush,
    getBatchSize: () => batch.length,
  };
}

export default useAnalyticsValidation;
