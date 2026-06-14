/**
 * StoreInactiveBanner — Sprint -1a S-size extraction (#3 of 26).
 *
 * Source: app/(dashboard)/index.tsx lines 127-137 (pre-extraction).
 * Shown when the merchant's active store is `!isActive && !isSuspended`
 * — i.e. the merchant themselves toggled visibility off (not a platform
 * action). Pair with StoreSuspensionBanner (#2) — same family of cards,
 * different trigger condition.
 *
 * The registry will gate visibility via `isVisible`:
 *   ctx.storeActive === false && ctx.storeSuspended === false
 *
 * This component is a pure presentational card — no data fetching, no
 * local state. The shell passes the suspended/active flags in through
 * DashboardCardVisibilityContext.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/DesignTokens';

export interface StoreInactiveBannerProps {
  /** Optional override for the body copy. Defaults to the standard message. */
  message?: string;
}

export const StoreInactiveBanner: React.FC<StoreInactiveBannerProps> = ({ message }) => {
  const handleOpenSettings = (): void => {
    router.push('/store-settings' as unknown);
  };

  return (
    <View
      style={styles.container}
      testID="dashboard-card-store-inactive"
      accessibilityRole="alert"
      accessibilityLabel="Store inactive. Open store settings to reactivate."
    >
      <Ionicons
        name="pause-circle"
        size={20}
        color="#D97706"
        style={styles.icon}
      />
      <View style={styles.body}>
        <Text style={styles.title}>Store Inactive</Text>
        <Text style={styles.message}>
          {message ??
            'Your store is currently not visible to customers. Go to Store Settings to activate it.'}
        </Text>
        <Pressable
          onPress={handleOpenSettings}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button"
        >
          <Text style={styles.ctaLabel}>Open Store Settings</Text>
          <Ionicons name="arrow-forward" size={14} color="#D97706" />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  icon: {
    marginRight: 8,
    marginTop: 2,
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
    marginBottom: 8,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'white',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  ctaPressed: {
    opacity: 0.7,
  },
  ctaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
});

export default StoreInactiveBanner;
