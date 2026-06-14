// @ts-nocheck
/**
 * Session Tracking Integration Examples
 *
 * This file demonstrates how to integrate session path tracking into app screens.
 * Copy and adapt these patterns for your screens.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSessionTracking, useFeatureTracking } from '../hooks';
import type { FeatureType } from '../../services/analytics/types';

/**
 * Example 1: Full session tracking on a screen
 * Use this pattern for screens that need full session control
 */
export function HomeScreen() {
  const { session, trackFeature, getQualityReport } = useSessionTracking({
    autoInitialize: true,
    userId: 'user_123',
    trackOnMount: 'home',
  });

  useEffect(() => {
    // Log quality report periodically
    const report = getQualityReport();
    logger.log('[Session] Quality Report:', report);
  }, [getQualityReport]);

  return (
    <View style={styles.container}>
      <Text>Home Screen</Text>
      {session && (
        <Text>Session Depth: {session.sessionDepthScore}</Text>
      )}
    </View>
  );
}

/**
 * Example 2: Feature tracking for search screen
 * Lightweight tracking for feature-specific navigation
 */
export function SearchScreen() {
  useFeatureTracking('search');

  return (
    <View style={styles.container}>
      <Text>Search Screen</Text>
    </View>
  );
}

/**
 * Example 3: Manual tracking for custom flows
 */
export function ProductDetailScreen({ productId }: { productId: string }) {
  const { trackFeature, session } = useSessionTracking({
    autoInitialize: false, // Don't auto-init, parent handles it
  });

  useEffect(() => {
    // Track product view with context
    trackFeature('product');

    // Log transition stats
    logger.log('[Session] Transitions:', session?.transitionTimes.length);
  }, [trackFeature, session]);

  return (
    <View style={styles.container}>
      <Text>Product: {productId}</Text>
    </View>
  );
}

/**
 * Example 4: Cart screen with funnel analysis
 */
export function CartScreen() {
  const { trackFeature, getFunnel, session } = useSessionTracking({
    autoInitialize: true,
    trackOnMount: 'cart',
  });

  useEffect(() => {
    // Define purchase funnel
    const purchaseFunnel: FeatureType[] = ['home', 'search', 'store', 'product', 'cart', 'checkout'];
    const analysis = getFunnel(purchaseFunnel);

    logger.log('[Funnel] Conversion Rate:', analysis.conversionRate.toFixed(1) + '%');
    logger.log('[Funnel] Drop-off Points:', Array.from(analysis.dropOffPoints.keys()));
  }, [getFunnel]);

  return (
    <View style={styles.container}>
      <Text>Shopping Cart</Text>
      {session && (
        <>
          <Text>Session Quality: {session.sessionQuality.toUpperCase()}</Text>
          <Text>Unique Features: {session.featurePath.length}</Text>
        </>
      )}
    </View>
  );
}

/**
 * Example 5: Checkout with drop-off detection
 */
export function CheckoutScreen() {
  const { trackFeature, getDropOffPatterns, endSession } = useSessionTracking({
    autoInitialize: true,
    trackOnMount: 'checkout',
  });

  const handlePaymentSuccess = async () => {
    // Analyze drop-off patterns before ending session
    const patterns = getDropOffPatterns();
    logger.log('[Drop-off] Common exits:', patterns.commonExits);
    logger.log('[Drop-off] Critical points:', patterns.criticalDropOffPoints);

    // End session after successful checkout
    await endSession();
  };

  return (
    <View style={styles.container}>
      <Text>Checkout Screen</Text>
      <Text>Track where users abandon checkout vs complete purchase</Text>
    </View>
  );
}

/**
 * Example 6: Integrating with navigation (React Navigation)
 *
 * In your navigation setup:
 *
 * ```typescript
 * import { sessionTrackingService } from '../hooks';
 *
 * const linking = {
 *   prefixes: ['rezapp://'],
 *   config: {
 *     screens: {
 *       Home: 'home',
 *       Search: 'search',
 *       Store: 'store/:storeId',
 *       Product: 'product/:productId',
 *       Cart: 'cart',
 *       Checkout: 'checkout',
 *     },
 *   },
 * };
 *
 * // In navigation container
 * useEffect(() => {
 *   sessionTrackingService.initializeSession();
 * }, []);
 *
 * // In each screen
 * useEffect(() => {
 *   const featureMap = {
 *     Home: 'home',
 *     Search: 'search',
 *     Store: 'store',
 *     Product: 'product',
 *     Cart: 'cart',
 *     Checkout: 'checkout',
 *   } as const;
 *
 *   const feature = featureMap[route.name as keyof typeof featureMap];
 *   if (feature) {
 *     sessionTrackingService.trackFeatureAccess(feature);
 *   }
 * }, [route.name]);
 * ```
 */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default {
  HomeScreen,
  SearchScreen,
  ProductDetailScreen,
  CartScreen,
  CheckoutScreen,
};
