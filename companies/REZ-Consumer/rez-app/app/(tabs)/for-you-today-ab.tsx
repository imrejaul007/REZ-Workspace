// @ts-nocheck
/**
 * For You Today A/B Test Wrapper
 *
 * This component implements the A/B test:
 * - Control: Original Home screen (infinite scroll, many cards)
 * - Variant: For You Today V2 (3 daily actions, memory integration)
 *
 * Test ID: for-you-today-v2-test
 * Success Metrics:
 * - Daily smart action rate: >40%
 * - Session time: >2 min
 * - Day-7 retention: >40%
 */

import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useABTest } from '@/hooks/useABTest';
import { colors } from '@/constants/theme';
import { logger } from '@/utils/logger';

const TEST_ID = 'for-you-today-v2-test';
const CONTROL_ROUTE = '/(tabs)';
const VARIANT_ROUTE = '/for-you-today-v2';

export function ForYouTodayABWrapper() {
  const router = useRouter();
  const { variant, loading } = useABTest(TEST_ID);

  useEffect(() => {
    if (loading) return;

    // Track experiment exposure
    if (variant) {
      // Log experiment exposure for analytics
      logger.debug('[A/B] For You Today V2 - Assigned to:', { variantName: variant.variantName });
    }

    // Route based on variant
    if (!variant || variant.variantName === 'control') {
      // Control: Show original Home
      router.replace(CONTROL_ROUTE as unknown);
    } else {
      // Variant: Show For You Today V2
      router.replace(VARIANT_ROUTE as unknown);
    }
  }, [variant, loading, router]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  return null;
}

export default ForYouTodayABWrapper;

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
});
