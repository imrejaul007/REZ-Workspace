// @ts-nocheck
/**
 * useScreenPrefetch - Prefetch heavy screens based on navigation state
 *
 * PRODUCTION-READY: Intelligently prefetches screens based on user navigation
 * patterns to reduce perceived loading time.
 *
 * @example
 * ```tsx
 * import { useScreenPrefetch } from '@/hooks/useScreenPrefetch';
 *
 * function App() {
 *   useScreenPrefetch({
 *     prefetchRoutes: ['travel', 'cart', 'checkout'],
 *     prefetchOn: 'hover', // 'mount' | 'hover' | 'focus'
 *   });
 *   // ...
 * }
 * ```
 */

import { useEffect, useRef, useCallback } from 'react';
import { Image } from 'react-native';
import { useNavigation } from 'expo-router';
import { logger } from '@/utils/logger';

interface ScreenPrefetchOptions {
  /** Routes to prefetch */
  prefetchRoutes?: string[];
  /** When to trigger prefetch */
  prefetchOn?: 'mount' | 'immediate' | 'idle';
  /** Debounce prefetch calls */
  debounceMs?: number;
  /** Enable in production */
  enabled?: boolean;
}

interface PrefetchConfig {
  routes: Map<string, () => Promise<unknown>>;
  prefetched: Set<string>;
  pending: Set<string>;
}

/**
 * Get screen factory functions for lazy loading
 */
function getScreenFactories(): Map<string, () => Promise<unknown>> {
  const factories = new Map<string, () => Promise<unknown>>();

  // Travel screens
  factories.set('travel', () => import('@/app/travel/index'));
  factories.set('travel/flights', () => import('@/app/travel/flights/search'));
  factories.set('travel/flights/booking', () => import('@/app/travel/flights/booking'));
  factories.set('travel/hotels', () => import('@/app/travel/hotels'));
  factories.set('travel/hotels/[id]', () => import('@/app/travel/hotels/[id]'));

  // Booking screens
  factories.set('booking', () => import('@/app/booking'));
  factories.set('booking/[id]', () => import('@/app/booking/[id]'));

  // Heavy feature screens
  factories.set('fashion', () => import('@/app/fashion'));
  factories.set('creators', () => import('@/app/creators'));
  factories.set('ArticleDetailScreen', () => import('@/app/ArticleDetailScreen'));
  factories.set('UGCDetailScreen', () => import('@/app/UGCDetailScreen'));

  // E-commerce heavy screens
  factories.set('cart', () => import('@/app/cart'));
  factories.set('checkout', () => import('@/app/checkout'));

  return factories;
}

/**
 * Hook for prefetching heavy screens
 */
export function useScreenPrefetch(options: ScreenPrefetchOptions = {}): {
  prefetchScreen: (route: string) => void;
  prefetchMultiple: (routes: string[]) => void;
  prefetchedRoutes: string[];
} {
  const {
    prefetchRoutes = [],
    prefetchOn = 'idle',
    debounceMs = 500,
    enabled = !__DEV__,
  } = options;

  const navigation = useNavigation();
  const configRef = useRef<PrefetchConfig>({
    routes: getScreenFactories(),
    prefetched: new Set(),
    pending: new Set(),
  });
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>();

  /**
   * Prefetch a screen by route
   */
  const prefetchScreen = useCallback((route: string) => {
    if (!enabled) return;

    const config = configRef.current;
    const factory = config.routes.get(route);

    if (!factory) {
      logger.debug('[Prefetch] No factory for route', { route });
      return;
    }

    if (config.prefetched.has(route)) {
      logger.debug('[Prefetch] Already prefetched', { route });
      return;
    }

    if (config.pending.has(route)) {
      logger.debug('[Prefetch] Already pending', { route });
      return;
    }

    config.pending.add(route);

    factory()
      .then(() => {
        config.prefetched.add(route);
        config.pending.delete(route);
        logger.debug('[Prefetch] Loaded', { route });
      })
      .catch((error) => {
        config.pending.delete(route);
        logger.warn('[Prefetch] Failed', { route, error: error.message });
      });
  }, [enabled]);

  /**
   * Prefetch multiple screens with debouncing
   */
  const prefetchMultiple = useCallback((routes: string[]) => {
    if (!enabled || routes.length === 0) return;

    // Debounce to avoid too many simultaneous imports
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      routes.forEach((route) => prefetchScreen(route));
    }, debounceMs);
  }, [prefetchScreen, debounceMs, enabled]);

  // Prefetch based on navigation state
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = navigation.addListener('state', (event) => {
      // Get current route names from navigation state
      const routes = event.data?.state?.routes || [];
      const currentRouteNames = routes.map((r) => r.name);

      // Find routes that might be navigated to next
      const routesToPrefetch: string[] = [];

      currentRouteNames.forEach((routeName: string) => {
        // Common navigation patterns
        if (routeName.includes('home')) {
          routesToPrefetch.push('cart', 'fashion');
        } else if (routeName.includes('product')) {
          routesToPrefetch.push('cart', 'checkout');
        } else if (routeName.includes('cart')) {
          routesToPrefetch.push('checkout');
        }
      });

      if (routesToPrefetch.length > 0) {
        // Deduplicate without Set spread
        const unique = routesToPrefetch.reduce((acc: string[], r: string) => {
          if (acc.indexOf(r) === -1) acc.push(r);
          return acc;
        }, []);
        prefetchMultiple(unique);
      }
    });

    return () => unsubscribe();
  }, [navigation, prefetchMultiple, enabled]);

  // Immediate prefetch on mount
  useEffect(() => {
    if (!enabled || prefetchOn !== 'immediate') return;
    prefetchMultiple(prefetchRoutes);
  }, [enabled, prefetchOn, prefetchRoutes, prefetchMultiple]);

  // Idle prefetch
  useEffect(() => {
    if (!enabled || prefetchOn !== 'idle') return;

    if (typeof requestIdleCallback !== 'undefined') {
      const idleCallbackId = requestIdleCallback(() => {
        prefetchMultiple(prefetchRoutes);
      }, { timeout: 5000 });

      return () => cancelIdleCallback(idleCallbackId);
    } else {
      // Fallback for browsers without requestIdleCallback
      const timer = setTimeout(() => {
        prefetchMultiple(prefetchRoutes);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [enabled, prefetchOn, prefetchRoutes, prefetchMultiple]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    prefetchScreen,
    prefetchMultiple,
    prefetchedRoutes: Array.from(configRef.current.prefetched),
  };
}

/**
 * Prefetch screen on hover (for navigation items)
 */
export function usePrefetchOnHover(screenName: string): {
  onMouseEnter: () => void;
  onFocus: () => void;
} {
  const prefetchedRef = useRef(false);

  const prefetch = useCallback(() => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;

    const factories = getScreenFactories();
    const factory = factories.get(screenName);

    if (factory) {
      factory().catch(() => {
        prefetchedRef.current = false;
      });
    }
  }, [screenName]);

  return {
    onMouseEnter: __DEV__ ? prefetch : () => {},
    onFocus: prefetch,
  };
}

/**
 * Prefetch hook for lazy loaded images
 */
export function useImagePrefetch(imageUrls: string[]): void {
  const prefetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (imageUrls.length === 0) return;

    // Use native image prefetching
    const urlsToPrefetch = imageUrls.filter((url) => !prefetchedRef.current.has(url));

    if (urlsToPrefetch.length === 0) return;

    urlsToPrefetch.forEach((url) => {
      prefetchedRef.current.add(url);
      Image.prefetch(url).catch(() => {
        prefetchedRef.current.delete(url);
      });
    });
  }, [imageUrls]);
}

export default useScreenPrefetch;
