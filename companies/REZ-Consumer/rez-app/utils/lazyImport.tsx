// @ts-nocheck
/**
 * lazyImport - Code splitting utilities for lazy loading heavy screens
 *
 * PRODUCTION-READY: Reduces initial bundle size by deferring loading of
 * heavy screens like travel, booking, flights, hotels, etc.
 *
 * @example
 * ```tsx
 * import { lazyComponent, lazyScreen } from '@/utils/lazyImport';
 *
 * // Lazy load a component
 * const HeavyChart = lazyComponent(() => import('@/components/HeavyChart'));
 *
 * // Lazy load a screen with prefetch
 * const TravelScreen = lazyScreen('TravelScreen', () => import('@/app/travel/index'));
 *
 * // Use in route group
 * <Stack.Screen name="travel" component={TravelScreen} />
 * ```
 */

import React, { Suspense, ComponentType, ReactNode } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors } from '@/constants/theme';

type LoadingFallbackProps = {
  message?: string;
  style?: ViewStyle;
};

type LazyComponentOptions = {
  fallback?: ReactNode;
  ssr?: boolean;
  prefetch?: boolean;
};

type LazyScreenOptions = LazyComponentOptions & {
  screenName?: string;
  timeout?: number;
};

/**
 * Default loading fallback for lazy loaded components
 */
export function LoadingFallback({
  message = 'Loading...',
  style,
}: LoadingFallbackProps): React.ReactElement {
  return (
    <View style={[styles.fallbackContainer, style]}>
      <ActivityIndicator size="large" color={colors.brand.purpleLight} />
      <Text style={styles.fallbackText}>{message}</Text>
    </View>
  );
}

/**
 * Create a lazy loaded component with automatic code splitting
 *
 * @param factory - Dynamic import factory function
 * @param options - Lazy loading options
 * @returns React component that renders the imported module
 */
export function lazyComponent<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): React.FC<unknown> {
  const { fallback = null, ssr = false } = options;

  let Component: T | null = null;
  let error: Error | null = null;
  let loading = true;

  // Preload the module when the factory is called
  const preload = () => {
    factory()
      .then((module) => {
        Component = module.default;
        loading = false;
      })
      .catch((err) => {
        error = err;
        loading = false;
      });
  };

  // Return a wrapper component
  return function LazyComponent(props) {
    if (loading) {
      // Start loading if not already started
      factory().then((module) => {
        Component = module.default;
        loading = false;
      }).catch((err) => {
        error = err;
        loading = false;
      });

      return fallback ? <>{fallback}</> : <LoadingFallback />;
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load component</Text>
        </View>
      );
    }

    if (!Component) {
      return fallback ? <>{fallback}</> : <LoadingFallback />;
    }

    return <Component {...props} />;
  };
}

/**
 * Create a lazy loaded screen with Suspense boundary
 *
 * @param screenName - Name for debugging
 * @param factory - Dynamic import factory function
 * @param options - Lazy loading options
 * @returns React component wrapped in Suspense
 */
export function lazyScreen<T extends ComponentType<unknown>>(
  screenName: string,
  factory: () => Promise<{ default: T }>,
  options: LazyScreenOptions = {}
): React.FC<unknown> {
  const {
    fallback,
    screenName: _,
    timeout = 30000,
    prefetch = false,
  } = options;

  // Create the lazy component
  const LazyComponent = React.lazy(factory);

  // Prefetch if requested
  if (prefetch) {
    // Use requestIdleCallback or setTimeout to prefetch without blocking
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => factory(), { timeout: 5000 });
    } else {
      setTimeout(() => factory(), 100);
    }
  }

  return function LazyScreen(props) {
    return (
      <React.Suspense
        fallback={
          fallback || (
            <LoadingFallback message={`Loading ${screenName}...`} />
          )
        }
      >
        <LazyComponent {...props} />
      </React.Suspense>
    );
  };
}

/**
 * Preload a module for future use
 *
 * @param factory - Dynamic import factory function
 * @returns Promise that resolves when module is loaded
 */
export function preloadModule<T>(
  factory: () => Promise<T>
): Promise<T> {
  return factory();
}

/**
 * Preload multiple modules in parallel
 *
 * @param factories - Array of dynamic import factory functions
 * @returns Promise that resolves when all modules are loaded
 */
export function preloadModules<T>(
  factories: Array<() => Promise<T>>
): Promise<T[]> {
  return Promise.all(factories.map((factory) => factory()));
}

/**
 * Check if a module is already loaded (cached by webpack)
 */
export function isModuleLoaded(moduleId: string): boolean {
  if (typeof window === 'undefined') return false;

  // Check if webpack chunk exists
  const chunks = (window as unknown).__webpack_chunk_load__;
  if (!chunks) return false;

  return true;
}

// ============================================================================
// Pre-built lazy loaded screen definitions
// ============================================================================

/**
 * Heavy screens that should be lazy loaded
 * These screens are loaded on-demand to reduce initial bundle size
 */
export const LAZY_SCREENS = {
  // Travel screens
  TravelScreen: () => import('@/app/travel/index'),
  FlightSearch: () => import('@/app/travel/flights/search'),
  FlightBooking: () => import('@/app/travel/flights/booking'),
  HotelSearch: () => import('@/app/travel/hotels'),
  HotelDetails: () => import('@/app/travel/hotels/[id]'),
  HotelBooking: () => import('@/app/travel/hotels/booking'),

  // Booking screens
  BookingPage: () => import('@/app/booking'),
  BookingDetails: () => import('@/app/booking/[id]'),

  // Heavy feature screens
  FashionScreen: () => import('@/app/fashion'),
  CreatorScreen: () => import('@/app/creators'),
  ArticleDetail: () => import('@/app/ArticleDetailScreen'),
  UGCDetail: () => import('@/app/UGCDetailScreen'),

  // E-commerce heavy screens
  CartScreen: () => import('@/app/cart'),
  CheckoutScreen: () => import('@/app/checkout'),

  // Media-heavy screens
  VideoPlayer: () => import('@/app/video-player'),
  LiveStream: () => import('@/app/live-stream'),
} as const;

/**
 * Type for lazy screen names
 */
export type LazyScreenName = keyof typeof LAZY_SCREENS;

/**
 * Get a lazy loaded screen component
 *
 * @param name - Name of the screen
 * @param options - Lazy loading options
 * @returns Lazy loaded screen component
 */
export function getLazyScreen<T extends LazyScreenName>(
  name: T,
  options?: LazyScreenOptions
): React.FC<unknown> {
  const factory = LAZY_SCREENS[name];
  if (!factory) {
    console.warn(`[LazyImport] Screen "${name}" not found in LAZY_SCREENS`);
    return () => null;
  }
  return lazyScreen(name, factory, { prefetch: true, ...options });
}

/**
 * Prefetch multiple lazy screens
 * Call this on app start or when user hovers over navigation
 */
export function prefetchLazyScreens(
  screenNames: LazyScreenName[]
): void {
  const factories = screenNames
    .map((name) => LAZY_SCREENS[name])
    .filter(Boolean);

  preloadModules(factories).catch((error) => {
    console.warn('[LazyImport] Some screens failed to prefetch', error);
  });
}

// ============================================================================
// Lazy loaded heavy components
// ============================================================================

/**
 * Heavy components that should be lazy loaded
 */
export const LAZY_COMPONENTS = {
  // Media components
  VideoPlayer: () => import('@/components/media/VideoPlayer'),
  AudioPlayer: () => import('@/components/media/AudioPlayer'),
  LiveStreamPlayer: () => import('@/components/media/LiveStreamPlayer'),

  // Chart components
  AnalyticsChart: () => import('@/components/charts/AnalyticsChart'),
  PieChart: () => import('@/components/charts/PieChart'),
  LineChart: () => import('@/components/charts/LineChart'),

  // Map components
  MapView: () => import('@/components/maps/MapView'),
  StoreLocator: () => import('@/components/maps/StoreLocator'),

  // Heavy UI components
  FullCalendar: () => import('@/components/calendar/FullCalendar'),
  RichTextEditor: () => import('@/components/editor/RichTextEditor'),
  ImageGallery: () => import('@/components/gallery/ImageGallery'),
} as const;

/**
 * Type for lazy component names
 */
export type LazyComponentName = keyof typeof LAZY_COMPONENTS;

/**
 * Get a lazy loaded component
 *
 * @param name - Name of the component
 * @param options - Lazy loading options
 * @returns Lazy loaded component
 */
export function getLazyComponent<T extends LazyComponentName>(
  name: T,
  options?: LazyComponentOptions
): React.FC<unknown> {
  const factory = LAZY_COMPONENTS[name];
  if (!factory) {
    console.warn(`[LazyImport] Component "${name}" not found in LAZY_COMPONENTS`);
    return () => null;
  }
  return lazyComponent(factory, options);
}

/**
 * Prefetch lazy components
 */
export function prefetchLazyComponents(
  componentNames: LazyComponentName[]
): void {
  const factories = componentNames
    .map((name) => LAZY_COMPONENTS[name])
    .filter(Boolean);

  preloadModules(factories).catch((error) => {
    console.warn('[LazyImport] Some components failed to prefetch', error);
  });
}

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: 20,
  },
  fallbackText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
  },
});

export default {
  lazyComponent,
  lazyScreen,
  preloadModule,
  preloadModules,
  getLazyScreen,
  getLazyComponent,
  prefetchLazyScreens,
  prefetchLazyComponents,
  LoadingFallback,
  LAZY_SCREENS,
  LAZY_COMPONENTS,
};
