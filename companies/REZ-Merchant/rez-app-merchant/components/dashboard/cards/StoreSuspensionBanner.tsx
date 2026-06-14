/**
 * StoreSuspensionBanner — Sprint -1a S-size exemplar extraction.
 *
 * Source: app/(dashboard)/index.tsx lines 549-562. Renders when the
 * merchant's active store has a suspension flag. The card itself is
 * dumb; the registry's `isVisible` predicate handles gating against
 * `storeSuspended` from DashboardCardVisibilityContext.
 *
 * Pair with StoreInactiveBanner (next extraction) — very similar shape,
 * different trigger condition.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/DesignTokens';

export interface StoreSuspensionBannerProps {
  /** Suspension reason passed from the shell. */
  reason?: string;
  /** Suspended-at ISO timestamp for the "since X days" copy. */
  suspendedAt?: string;
}

export const StoreSuspensionBanner: React.FC<StoreSuspensionBannerProps> = ({
  reason,
  suspendedAt,
}) => {
  const daysLabel = formatDaysSince(suspendedAt);

  const handleContactSupport = (): void => {
    router.push('/support' as unknown);
  };

  return (
    <View
      style={styles.container}
      testID="dashboard-card-store-suspension"
      accessibilityRole="alert"
      accessibilityLabel="Store suspended. Contact support."
    >
      <View style={styles.header}>
        <Ionicons name="warning" size={22} color="#B91C1C" />
        <Text style={styles.title}>Store Suspended</Text>
      </View>
      <Text style={styles.body}>
        {reason ?? 'This store is currently suspended.'}
        {daysLabel ? ` ${daysLabel}` : ''}
      </Text>
      <Pressable
        onPress={handleContactSupport}
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        accessibilityRole="button"
      >
        <Text style={styles.ctaLabel}>Contact Support</Text>
        <Ionicons name="arrow-forward" size={16} color="#B91C1C" />
      </Pressable>
    </View>
  );
};

function formatDaysSince(iso?: string): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return null;
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Suspended today.';
  if (days === 1) return 'Suspended 1 day ago.';
  return `Suspended ${days} days ago.`;
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#991B1B',
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    color: '#7F1D1D',
    marginBottom: 10,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  ctaPressed: {
    opacity: 0.7,
  },
  ctaLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B91C1C',
  },
});

export default StoreSuspensionBanner;
