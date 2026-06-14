// @ts-nocheck
/**
 * Lazy Loading Utility for REZ App
 *
 * Provides dynamic imports with loading states and error handling for
 * heavy screens that should not block the initial bundle.
 *
 * Usage:
 * ```typescript
 * // Basic lazy import
 * const HeavyScreen = lazyLoad(() => import('./HeavyScreen'));
 *
 * // With preload
 * lazyLoad.preload(() => import('./HeavyScreen'));
 *
 * // In component with Suspense
 * <Suspense fallback={<LoadingSpinner />}>
 *   <HeavyScreen />
 * </Suspense>
 * ```
 *
 * @module utils/lazyLoad
 */

import React, {
  ComponentType,
  ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Function that returns a promise resolving to a module with a default export
 */
export type LazyImportFn<T extends ComponentType<unknown>> = () => Promise<{ default: T }>;

/**
 * Options for lazy loading configuration
 */
export interface LazyLoadOptions {
  /** Custom fallback component to show while loading */
  fallback?: ReactElement;
  /** Enable preloading on mount (default: false) */
  preloadOnMount?: boolean;
  /** Resource priority hint for browser (low/high) */
  prefetch?: boolean;
  /** Called when component fails to load */
  onError?: (error: Error) => void;
}

/**
 * Preload group configuration
 */
export interface PreloadGroup {
  /** Group identifier */
  name: string;
  /** Routes/screens to preload */
  routes: LazyRoute[];
  /** Preload strategy */
  strategy: 'immediate' | 'idle' | 'interaction';
}

/**
 * Single lazy route configuration
 */
export interface LazyRoute {
  /** Route path (e.g., '/go', '/rendez') */
  path: string;
  /** Import function for the screen component */
  importFn: () => Promise<{ default: ComponentType<unknown> }>;
  /** Priority level for preloading */
  priority: 'high' | 'medium' | 'low';
  /** Whether this is a standalone app module (e.g., REZ Go, Rendez) */
  isStandaloneApp?: boolean;
  /** Estimated size in KB (for analytics) */
  estimatedSizeKb?: number;
}

// ============================================================================
// INTERNAL STATE
// ============================================================================

/**
 * Cache of loaded modules to prevent re-fetching
 */
const moduleCache = new Map<string, ComponentType<unknown>>();

/**
 * Cache of loading states per route
 */
const loadingStates = new Map<string, boolean>();

/**
 * Cache of errors per route
 */
const errorCache = new Map<string, Error>();

/**
 * Preload state per route
 */
const preloadedRoutes = new Set<string>();

/**
 * Idle callback handle for preloading
 */
let idleCallbackHandle: ReturnType<typeof requestIdleCallback> | null = null;

// ============================================================================
// CORE LAZY LOAD FUNCTION
// ============================================================================

/**
 * Creates a lazy-loaded component with loading state and error handling.
 *
 * @param importFn - Dynamic import function that returns the component
 * @param options - Configuration options
 * @returns Lazy loaded React component wrapped in Suspense
 *
 * @example
 * ```tsx
 * const HeavyScreen = lazyLoad(() => import('./HeavyScreen'));
 *
 * // Usage with Suspense
 * <Suspense fallback={<Loading />}>
 *   <HeavyScreen />
 * </Suspense>
 * ```
 */
export function lazyLoad<T extends ComponentType<unknown>>(
  importFn: LazyImportFn<T>,
  options: LazyLoadOptions = {}
): React.LazyExoticComponent<T> {
  const { onError } = options;

  return React.lazy(async () => {
    try {
      const module = await importFn();
      // Cache the component for future use
      const componentName = (module.default as { name?: string })?.name || 'Anonymous';
      moduleCache.set(componentName, module.default);
      return module;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (onError) {
        onError(err);
      }
      throw err;
    }
  });
}

// ============================================================================
// PRELOADING FUNCTIONS
// ============================================================================

/**
 * Preloads a route's component in the background.
 * Safe to call multiple times - will only load once.
 *
 * @param importFn - Dynamic import function
 * @param routePath - Path identifier for tracking
 * @returns Promise that resolves when preloaded
 *
 * @example
 * ```typescript
 * // Preload on button hover
 * onHover={() => lazyLoad.preload(() => import('./HeavyScreen'), '/heavy')}
 *
 * // Preload when user hovers over navigation
 * onMouseEnter={() => preloadRoute('/rendez')}
 * ```
 */
export async function preload(
  importFn: () => Promise<{ default: ComponentType<unknown> }>,
  routePath: string
): Promise<void> {
  if (preloadedRoutes.has(routePath)) {
    return; // Already preloaded
  }

  loadingStates.set(routePath, true);

  try {
    await importFn();
    preloadedRoutes.add(routePath);
    loadingStates.set(routePath, false);
  } catch (error) {
    loadingStates.set(routePath, false);
    const err = error instanceof Error ? error : new Error(String(error));
    errorCache.set(routePath, err);
    throw err;
  }
}

/**
 * Preloads a route by its path using the lazy routes config.
 * Uses requestIdleCallback for non-blocking preloading.
 *
 * @param routePath - Path from lazyRoutes config
 * @param options - Preload options
 */
export function preloadRoute(
  routePath: string,
  options: { strategy?: 'immediate' | 'idle' } = {}
): void {
  const { strategy = 'idle' } = options;

  if (preloadedRoutes.has(routePath)) {
    return;
  }

  const executePreload = () => {
    // Dynamically import lazyRoutes to avoid circular dependency
    import('../config/lazyRoutes')
      .then(({ lazyRoutes: routes }) => {
        const route = routes.find((r) => r.path === routePath);
        if (route) {
          preload(route.importFn, route.path).catch(() => {
            // Silent fail for preloading - non-critical
          });
        }
      })
      .catch(() => {
        // lazyRoutes module not available
      });
  };

  if (strategy === 'idle' && typeof requestIdleCallback !== 'undefined') {
    idleCallbackHandle = requestIdleCallback(() => {
      executePreload();
    }, { timeout: 5000 });
  } else {
    executePreload();
  }
}

/**
 * Preloads a group of routes together.
 * Useful for preloading entire feature areas (e.g., all REZ Go screens).
 *
 * @param groupName - Name of the preload group from config
 * @param options - Preload options
 */
export function preloadGroup(
  groupName: string,
  options: { strategy?: 'immediate' | 'idle' | 'interaction' } = {}
): void {
  const { strategy = 'idle' } = options;

  import('../config/lazyRoutes')
    .then(({ preloadGroups: groups }) => {
      const group = groups.find((g) => g.name === groupName);
      if (!group) return;

      group.routes.forEach((route) => {
        preloadRoute(route.path, { strategy });
      });
    })
    .catch(() => {
      // Non-critical failure
    });
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to preload a route when a condition becomes true.
 * Uses Intersection Observer for viewport-based preloading.
 *
 * @param routePath - Path to preload
 * @param trigger - When to trigger preload (default: on mount)
 * @returns ref to attach to trigger element
 *
 * @example
 * ```tsx
 * const triggerRef = usePreloadTrigger('/go', 'viewport');
 *
 * return (
 *   <TouchableOpacity ref={triggerRef}>
 *     Open REZ Go
 *   </TouchableOpacity>
 * );
 * ```
 */
export function usePreloadTrigger(
  routePath: string,
  trigger: 'mount' | 'viewport' | 'interaction' = 'mount'
) {
  const ref = useRef<View | null>(null);

  useEffect(() => {
    if (trigger === 'mount') {
      preloadRoute(routePath, { strategy: 'idle' });
      return;
    }

    if (trigger === 'viewport' && ref.current && typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            preloadRoute(routePath, { strategy: 'idle' });
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      // Note: In real implementation, attach to actual native element
      // This is a simplified reference for TypeScript
      return () => observer.disconnect();
    }
  }, [routePath, trigger]);

  return ref;
}

/**
 * Hook to get preloading state for a route.
 *
 * @param routePath - Path to check
 * @returns Preloading status
 *
 * @example
 * ```tsx
 * const { isLoading, isPreloaded, error } = usePreloadState('/go');
 * ```
 */
export function usePreloadState(routePath: string) {
  const [isLoading, setIsLoading] = useState(loadingStates.get(routePath) || false);
  const [error, setError] = useState<Error | null>(errorCache.get(routePath) || null);

  useEffect(() => {
    const checkInterval = setInterval(() => {
      setIsLoading(loadingStates.get(routePath) || false);
      setError(errorCache.get(routePath) || null);
    }, 100);

    return () => clearInterval(checkInterval);
  }, [routePath]);

  return {
    isLoading,
    isPreloaded: preloadedRoutes.has(routePath),
    error,
  };
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

/**
 * Default loading fallback component
 */
export function LoadingFallback({ message = 'Loading...' }: { message?: string }) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#6366F1" />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

/**
 * Error boundary specifically for lazy loaded components.
 * Shows a retry button instead of crashing the app.
 */
interface LazyErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: ReactElement },
  LazyErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: ReactElement }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): LazyErrorBoundaryState {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Failed to load</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'An error occurred while loading this screen.'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#666666',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorMessage: {
    color: '#666666',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

// Export as named exports for tree-shaking
export const lazyLoadUtils = {
  lazyLoad,
  preload,
  preloadRoute,
  preloadGroup,
  usePreloadTrigger,
  usePreloadState,
  LoadingFallback,
  LazyErrorBoundary,
};

export default lazyLoad;
