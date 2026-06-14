/**
 * useIntentTracking Hook
 * Captures user intent events using real intentGraphApi
 */

import { useCallback, useEffect, useRef } from 'react';
import { captureIntent, type IntentCapture } from '@/services/intentGraphApi';

interface UseIntentTrackingProps {
  userId?: string;
  storeSlug?: string;
  enabled?: boolean;
}

export function useIntentTracking({
  userId,
  storeSlug,
  enabled = true,
}: UseIntentTrackingProps) {
  const queueRef = useRef<IntentCapture[]>([]);
  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Flush queued events
  const flushQueue = useCallback(async () => {
    if (!userId || queueRef.current.length === 0) return;

    const queue = [...queueRef.current];
    queueRef.current = [];

    for (const event of queue) {
      try {
        await captureIntent(event);
      } catch {
        // Silently fail - don't block UI
      }
    }
  }, [userId]);

  // Flush queue periodically
  useEffect(() => {
    if (!enabled || !userId) return;

    flushTimeoutRef.current = setInterval(() => {
      if (queueRef.current.length > 0) {
        flushQueue();
      }
    }, 5000);

    return () => {
      if (flushTimeoutRef.current) {
        clearInterval(flushTimeoutRef.current);
      }
      flushQueue();
    };
  }, [enabled, flushQueue, userId]);

  // Track event
  const track = useCallback(
    async (event: Omit<IntentCapture, 'userId' | 'timestamp'>) => {
      if (!enabled || !userId) return;

      const intentEvent: IntentCapture = {
        userId,
        timestamp: new Date().toISOString(),
        ...event,
      };

      // Add to queue
      queueRef.current.push(intentEvent);

      // Flush if queue is full
      if (queueRef.current.length >= 10) {
        await flushQueue();
      }
    },
    [enabled, userId, flushQueue]
  );

  // Convenience methods
  const trackView = useCallback(
    (itemId: string, metadata?: Record<string, unknown>) => {
      track({ entityType: 'product', entityId: itemId, signal: 'view', metadata });
    },
    [track]
  );

  const trackAddToCart = useCallback(
    (itemId: string, metadata?: Record<string, unknown>) => {
      track({ entityType: 'product', entityId: itemId, signal: 'add_to_cart', metadata });
    },
    [track]
  );

  const trackPurchase = useCallback(
    (itemId: string, metadata?: Record<string, unknown>) => {
      track({ entityType: 'product', entityId: itemId, signal: 'purchase', metadata });
    },
    [track]
  );

  const trackSearch = useCallback(
    (query: string, metadata?: Record<string, unknown>) => {
      track({ entityType: 'category', entityId: query, signal: 'search', metadata });
    },
    [track]
  );

  return {
    track,
    trackView,
    trackAddToCart,
    trackPurchase,
    trackSearch,
  };
}

export default useIntentTracking;
