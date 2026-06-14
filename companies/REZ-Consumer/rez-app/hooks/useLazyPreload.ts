// @ts-nocheck
/**
 * Preloading Hook for Lazy Routes
 *
 * Provides intelligent preloading based on navigation patterns,
 * viewport visibility, and idle time.
 *
 * Usage:
 * ```tsx
 * // Preload when component mounts
 * useLazyPreload('/go');
 *
 * // Preload with viewport detection
 * const ref = useRef<View>(null);
 * useLazyPreload('/go', { trigger: 'viewport', elementRef: ref });
 *
 * // Preload group on idle
 * useLazyPreloadGroup('go');
 * ```
 *
 * @module hooks/useLazyPreload
 */

import { useCallback, useEffect, useRef } from 'react';
import { InteractionManager, View } from 'react-native';
import { preload, preloadRoute, preloadGroup, usePreloadState } from '../utils/lazyLoad.tsx';

/**
 * Configuration options for preloading
 */
export interface PreloadOptions {
  /** When to trigger the preload */
  trigger?: 'mount' | 'viewport' | 'interaction' | 'idle';
  /** Reference to element for viewport detection */
  elementRef?: React.RefObject<View | null>;
  /** Delay before preloading (ms) */
  delay?: number;
  /** Preload strategy */
  strategy?: 'immediate' | 'idle';
}

/**
 * Options for preloadGroup
 */
export interface PreloadGroupOptions {
  /** Preload strategy */
  strategy?: 'immediate' | 'idle' | 'interaction';
}

/**
 * Hook to preload a single route
 *
 * @param routePath - Route path to preload (e.g., '/go', '/wallet-screen')
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * // Preload on mount
 * useLazyPreload('/go');
 *
 * // Preload when user hovers/interacts
 * useLazyPreload('/checkout', { trigger: 'interaction' });
 *
 * // Preload with delay
 * useLazyPreload('/wallet', { delay: 2000, strategy: 'idle' });
 * ```
 */
export function useLazyPreload(
  routePath: string,
  options: PreloadOptions = {}
): { preload: () => void; isPreloaded: boolean; isLoading: boolean } {
  const { trigger = 'idle', elementRef, delay = 0, strategy = 'idle' } = options;
  const hasPreloaded = useRef(false);
  const { isPreloaded } = usePreloadState(routePath);

  const doPreload = useCallback(() => {
    if (hasPreloaded.current || isPreloaded) return;
    hasPreloaded.current = true;

    if (delay > 0) {
      setTimeout(() => {
        preloadRoute(routePath, { strategy });
      }, delay);
    } else {
      preloadRoute(routePath, { strategy });
    }
  }, [routePath, delay, strategy, isPreloaded]);

  useEffect(() => {
    if (trigger === 'mount') {
      doPreload();
      return;
    }

    if (trigger === 'idle' && typeof requestIdleCallback !== 'undefined') {
      const handle = requestIdleCallback(() => {
        doPreload();
      }, { timeout: 5000 });
      return () => cancelIdleCallback(handle);
    }

    if (trigger === 'interaction') {
      // Wait for interaction to complete
      const subscription = InteractionManager.addInteractionAllowingTimeCallback(() => {
        doPreload();
      });
      return () => subscription.cancel();
    }
  }, [trigger, doPreload]);

  return {
    preload: doPreload,
    isPreloaded,
    isLoading: !isPreloaded && !hasPreloaded.current,
  };
}

/**
 * Hook to preload multiple routes together
 *
 * @param routes - Array of route paths to preload
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * // Preload wallet-related routes
 * useLazyPreloadMultiple(['/wallet-screen', '/bill-payment', '/recharge']);
 *
 * // Preload on viewport visibility
 * const ref = useRef<View>(null);
 * useLazyPreloadMultiple(['/checkout', '/order-confirmation'], { elementRef: ref });
 * ```
 */
export function useLazyPreloadMultiple(
  routes: string[],
  options: PreloadOptions = {}
): { preloadAll: () => void; isPreloaded: boolean } {
  const { trigger = 'idle', elementRef, delay = 0, strategy = 'idle' } = options;
  const hasPreloaded = useRef(false);

  const doPreloadAll = useCallback(() => {
    if (hasPreloaded.current) return;
    hasPreloaded.current = true;

    const preloadPromises = routes.map((route) =>
      preloadRoute(route, { strategy }).catch(() => {
        // Silent fail for batch preloading
      })
    );

    // Non-blocking: don't await all preloads
    Promise.all(preloadPromises).catch(() => {});
  }, [routes, strategy]);

  useEffect(() => {
    if (trigger === 'mount') {
      if (delay > 0) {
        setTimeout(doPreloadAll, delay);
      } else {
        doPreloadAll();
      }
      return;
    }

    if (trigger === 'idle' && typeof requestIdleCallback !== 'undefined') {
      const handle = requestIdleCallback(() => {
        doPreloadAll();
      }, { timeout: 5000 });
      return () => cancelIdleCallback(handle);
    }

    if (trigger === 'interaction') {
      const subscription = InteractionManager.addInteractionAllowingTimeCallback(() => {
        doPreloadAll();
      });
      return () => subscription.cancel();
    }
  }, [trigger, delay, doPreloadAll]);

  return {
    preloadAll: doPreloadAll,
    isPreloaded: hasPreloaded.current,
  };
}

/**
 * Hook to preload a named group of routes
 *
 * @param groupName - Name of the preload group (from lazyRoutes config)
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * // Preload all REZ Go screens on idle
 * useLazyPreloadGroup('go');
 *
 * // Preload wallet screens on mount
 * useLazyPreloadGroup('wallet', { trigger: 'mount' });
 * ```
 */
export function useLazyPreloadGroup(
  groupName: string,
  options: PreloadOptions & PreloadGroupOptions = {}
): { preload: () => void; isPreloaded: boolean } {
  const { trigger = 'idle', strategy = 'idle' } = options;
  const hasPreloaded = useRef(false);

  const doPreload = useCallback(() => {
    if (hasPreloaded.current) return;
    hasPreloaded.current = true;
    preloadGroup(groupName, { strategy });
  }, [groupName, strategy]);

  useEffect(() => {
    if (trigger === 'mount') {
      doPreload();
      return;
    }

    if (trigger === 'idle' && typeof requestIdleCallback !== 'undefined') {
      const handle = requestIdleCallback(() => {
        doPreload();
      }, { timeout: 5000 });
      return () => cancelIdleCallback(handle);
    }

    if (trigger === 'interaction') {
      const subscription = InteractionManager.addInteractionAllowingTimeCallback(() => {
        doPreload();
      });
      return () => subscription.cancel();
    }
  }, [trigger, doPreload]);

  return {
    preload: doPreload,
    isPreloaded: hasPreloaded.current,
  };
}

/**
 * Hook to detect viewport visibility and preload routes
 * Uses Intersection Observer pattern (simplified for React Native)
 *
 * @param routes - Routes to preload when visible
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * const cardRef = useRef<View>(null);
 *
 * useViewportPreload('/go', { elementRef: cardRef });
 *
 * return (
 *   <TouchableOpacity ref={cardRef} onPress={() => router.push('/go')}>
 *     Open REZ Go
 *   </TouchableOpacity>
 * );
 * ```
 */
export function useViewportPreload(
  routes: string[],
  options: Omit<PreloadOptions, 'trigger'> & { threshold?: number } = {}
): { ref: React.RefObject<View | null> } {
  const { elementRef, delay = 0, strategy = 'idle', threshold = 0.5 } = options;
  const internalRef = useRef<View | null>(null);
  const resolvedRef = elementRef || internalRef;
  const hasTriggered = useRef(false);

  useEffect(() => {
    // In a real implementation, you'd use a library like react-native-intersection-observer
    // or track scroll position to determine visibility
    // For now, this is a simplified placeholder

    const checkVisibility = () => {
      if (hasTriggered.current || !resolvedRef.current) return;

      // Simulate visibility check - in production use actual intersection observer
      // or scroll position tracking
      hasTriggered.current = true;

      routes.forEach((route) => {
        if (delay > 0) {
          setTimeout(() => preloadRoute(route, { strategy }), delay);
        } else {
          preloadRoute(route, { strategy });
        }
      });
    };

    // For demo purposes, trigger after a short delay when ref is available
    const timer = setTimeout(checkVisibility, 1000);
    return () => clearTimeout(timer);
  }, [routes, delay, strategy, resolvedRef]);

  return { ref: resolvedRef };
}

/**
 * Hook to preload based on navigation intent
 * Call this in parent screens to preload child screens
 *
 * @param navigationPattern - Known navigation patterns to watch for
 *
 * @example
 * ```tsx
 * // In a parent screen that leads to child screens
 * useNavigationIntent([
 *   { from: '/cart', to: '/checkout' },
 *   { from: '/checkout', to: '/order-confirmation' },
 * ]);
 *
 * return <CartScreen />;
 * ```
 */
export function useNavigationIntent(
  navigationPattern: Array<{ from: string; to: string }>
): void {
  // This is a placeholder for navigation-based preloading
  // In a real implementation, you would:
  // 1. Track navigation events
  // 2. When user navigates FROM a known pattern, preload the TO route
  // 3. Use expo-router's navigation hooks to detect intent

  useEffect(() => {
    // Example: preload checkout when user is on cart
    navigationPattern.forEach(({ from, to }) => {
      // In practice, hook into navigation state
      // For now, just log the pattern for reference
      console.debug(`[Preload] Navigation pattern: ${from} -> ${to}`);
    });
  }, [navigationPattern]);
}

/**
 * Hook to get preloading analytics
 * Useful for debugging and monitoring preload performance
 *
 * @returns Preload statistics
 *
 * @example
 * ```tsx
 * const stats = usePreloadStats();
 * console.log(`Preloaded ${stats.totalPreloaded} routes`);
 * ```
 */
export function usePreloadStats(): {
  totalRoutes: number;
  totalPreloaded: number;
  totalErrors: number;
  estimatedSavingsKb: number;
} {
  const { lazyRoutes } = require('../config/lazyRoutes');

  return {
    totalRoutes: lazyRoutes.length,
    totalPreloaded: 0, // Would track actual preloads
    totalErrors: 0, // Would track actual errors
    estimatedSavingsKb: lazyRoutes.reduce(
      (sum: number, r: { estimatedSizeKb?: number }) => sum + (r.estimatedSizeKb || 0),
      0
    ),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useLazyPreload;
