// @ts-nocheck
/**
 * LazyScreen - Lazy Loading Wrapper for Expo Router Screens
 *
 * Provides a simple API to lazy load expo-router screens with:
 * - Automatic Suspense wrapping
 * - Error boundary with retry
 * - Preloading on mount
 * - Loading state indicator
 *
 * Usage:
 * ```tsx
 * // Simple usage
 * const LazyWalletScreen = LazyScreen({
 *   import: () => import('../app/wallet-screen'),
 *   route: '/wallet-screen',
 * });
 *
 * // In your router file (app/_layout.tsx)
 * <Stack.Screen name="wallet-screen" component={LazyWalletScreen} />
 *
 * // With preload on mount
 * const LazyGoScreen = LazyScreen({
 *   import: () => import('../app/go/index'),
 *   route: '/go',
 *   preload: true,
 * });
 * ```
 *
 * @module components/common/LazyScreen
 */

import React, { Suspense, ComponentType, ReactElement, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';

/**
 * Configuration for LazyScreen
 */
export interface LazyScreenConfig<TProps extends object = object> {
  /** Dynamic import function returning the screen component */
  import: () => Promise<{ default: ComponentType<TProps> }>;
  /** Route path for analytics and preload tracking */
  route: string;
  /** Enable automatic preloading on mount (default: true) */
  preload?: boolean;
  /** Custom loading fallback */
  loadingComponent?: ReactElement;
  /** Called when component fails to load */
  onError?: (error: Error) => void;
}

/**
 * Props passed to the LazyScreen component
 */
export interface LazyScreenProps {
  /** Props to pass to the lazy-loaded component */
  [key: string]: unknown;
}

/**
 * Creates a lazy-loaded screen component with Suspense and error handling.
 *
 * @param config - Lazy loading configuration
 * @returns React component ready for expo-router Stack/Tab
 *
 * @example
 * ```tsx
 * // Create lazy screen
 * const LazyWalletScreen = LazyScreen({
 *   import: () => import('../app/wallet-screen'),
 *   route: '/wallet-screen',
 * });
 *
 * // Use in layout
 * <Stack.Screen name="wallet-screen" component={LazyWalletScreen} />
 * ```
 */
export function LazyScreen<TProps extends object = object>(
  config: LazyScreenConfig<TProps>
): React.ComponentType<LazyScreenProps> {
  const { import: importFn, route, preload = false, loadingComponent, onError } = config;

  // Create lazy component
  const LazyComponent = React.lazy(async () => {
    try {
      const module = await importFn();
      return module;
    } catch (error) {
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
      throw error;
    }
  });

  // Preloading state
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadError, setPreloadError] = useState<Error | null>(null);

  // Preload on mount if enabled
  useEffect(() => {
    if (preload && typeof window !== 'undefined') {
      setIsPreloading(true);
      importFn()
        .then(() => {
          setIsPreloading(false);
        })
        .catch((error) => {
          setIsPreloading(false);
          setPreloadError(error instanceof Error ? error : new Error(String(error)));
        });
    }
  }, [importFn, preload]);

  // Default loading component
  const DefaultLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#6366F1" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );

  // Default error component
  const DefaultError = ({ retry }: { retry: () => void }) => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorIcon}>!</Text>
      <Text style={styles.errorTitle}>Failed to load</Text>
      <Text style={styles.errorMessage}>
        {preloadError?.message || 'An error occurred while loading this screen.'}
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={retry}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  // Wrapper component with Suspense
  function LazyScreenWrapper(props: LazyScreenProps) {
    const [key, setKey] = useState(0);
    const [hasError, setHasError] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const handleError = (err: Error) => {
      setHasError(true);
      setError(err);
      if (onError) {
        onError(err);
      }
    };

    const handleRetry = () => {
      setKey((prev) => prev + 1);
      setHasError(false);
      setError(null);
    };

    if (hasError) {
      return <DefaultError retry={handleRetry} />;
    }

    return (
      <Suspense fallback={loadingComponent || <DefaultLoading />}>
        <ErrorBoundary onError={handleError} key={key}>
          <LazyComponent {...props} />
        </ErrorBoundary>
      </Suspense>
    );
  }

  LazyScreenWrapper.displayName = `LazyScreen(${route})`;

  return LazyScreenWrapper;
}

/**
 * Error Boundary for lazy loaded components
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; onError?: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      // Return null when in error state - parent handles the UI
      return null;
    }
    return this.props.children;
  }
}

// ============================================================================
// PREDEFINED LAZY SCREENS
// ============================================================================

/**
 * Registry of pre-configured lazy screens for common heavy routes
 * Use these for quick configuration in layout files
 *
 * @example
 * ```tsx
 * import { lazyScreens } from './LazyScreen';
 *
 * // In Stack
 * <Stack.Screen name="wallet-screen" component={lazyScreens.walletScreen} />
 * <Stack.Screen name="go" component={lazyScreens.goScreen} />
 * ```
 */
export const lazyScreens = {
  // Standalone Apps
  goScreen: LazyScreen({
    import: () => import('../app/go/index'),
    route: '/go',
    preload: true,
  }),
  goScanScreen: LazyScreen({
    import: () => import('../app/go/scan'),
    route: '/go/scan',
  }),
  goCartScreen: LazyScreen({
    import: () => import('../app/go/cart'),
    route: '/go/cart',
  }),
  goCheckoutScreen: LazyScreen({
    import: () => import('../app/go/checkout'),
    route: '/go/checkout',
  }),
  goReceiptsScreen: LazyScreen({
    import: () => import('../app/go/receipts'),
    route: '/go/receipts',
  }),
  goShoppingListsScreen: LazyScreen({
    import: () => import('../app/go/shopping-lists'),
    route: '/go/shopping-lists',
  }),
  goUniversalScanScreen: LazyScreen({
    import: () => import('../app/go/universal-scan'),
    route: '/go/universal-scan',
  }),

  rendezScreen: LazyScreen({
    import: () => import('../app/rendez/index'),
    route: '/rendez',
    preload: true,
  }),

  // Heavy Screens
  walletScreen: LazyScreen({
    import: () => import('../app/wallet-screen'),
    route: '/wallet-screen',
    preload: true,
  }),
  bookingScreen: LazyScreen({
    import: () => import('../app/booking'),
    route: '/booking',
    preload: true,
  }),
  productPageScreen: LazyScreen({
    import: () => import('../app/product-page'),
    route: '/product-page',
    preload: true,
  }),
  eventPageScreen: LazyScreen({
    import: () => import('../app/EventPage'),
    route: '/EventPage',
  }),
  storeVisitScreen: LazyScreen({
    import: () => import('../app/store-visit'),
    route: '/store-visit',
  }),

  // Financial
  billPaymentScreen: LazyScreen({
    import: () => import('../app/bill-payment'),
    route: '/bill-payment',
  }),
  rechargeScreen: LazyScreen({
    import: () => import('../app/recharge'),
    route: '/recharge',
  }),
  paymentScreen: LazyScreen({
    import: () => import('../app/payment'),
    route: '/payment',
  }),

  // Cart & Checkout
  cartScreen: LazyScreen({
    import: () => import('../app/cart'),
    route: '/cart',
    preload: true,
  }),
  checkoutScreen: LazyScreen({
    import: () => import('../app/checkout'),
    route: '/checkout',
    preload: true,
  }),

  // Creator & Earn
  creatorDashboardScreen: LazyScreen({
    import: () => import('../app/creator-dashboard'),
    route: '/creator-dashboard',
  }),
  earnFromSocialMediaScreen: LazyScreen({
    import: () => import('../app/earn-from-social-media'),
    route: '/earn-from-social-media',
  }),
  missionsScreen: LazyScreen({
    import: () => import('../app/missions'),
    route: '/missions',
  }),

  // Loyalty
  loyaltyHubScreen: LazyScreen({
    import: () => import('../app/loyalty-hub'),
    route: '/loyalty-hub',
  }),
  coinSystemScreen: LazyScreen({
    import: () => import('../app/coin-system'),
    route: '/coin-system',
  }),
} as const;

/**
 * Type-safe lazy screen factory
 * Use this for routes not in the predefined list
 */
export function createLazyScreen<TProps extends object = object>(
  screenImport: () => Promise<{ default: ComponentType<TProps> }>,
  route: string,
  options?: { preload?: boolean; loadingComponent?: ReactElement }
): React.ComponentType<TProps> {
  return LazyScreen({
    import: screenImport,
    route,
    ...options,
  });
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  errorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    color: '#EF4444',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LazyScreen;
