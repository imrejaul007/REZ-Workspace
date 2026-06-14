// @ts-nocheck
/**
 * RebookingNudgeCard
 *
 * In-app nudge shown on the Near-U home tab when the user hasn't visited a
 * store in more than 10 days.  Shows the single most-recently-visited overdue
 * store with two CTAs: "Book again" (navigates to store page) and
 * "View offer" (navigates to store page with the offers tab active).
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import CachedImage from '@/components/ui/CachedImage';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { useIsAuthenticated } from '@/stores/selectors';
import apiClient from '@/services/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

interface RecentStore {
  storeId: string;
  storeName: string;
  storeLogo?: string;
  lastVisitDate: string; // ISO date string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const OVERDUE_THRESHOLD_DAYS = 10;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysSince(isoDate: string): number {
  const last = new Date(isoDate).getTime();
  const now = Date.now();
  return Math.floor((now - last) / MS_PER_DAY);
}

// ── Component ─────────────────────────────────────────────────────────────────

function RebookingNudgeCard() {
  const isAuthenticated = useIsAuthenticated();
  const [store, setStore] = useState<(RecentStore & { daysSince: number }) | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    setLoading(true);

    // Try the preferred endpoint first, fall back to the alternative.
    const fetchRecentStores = async (): Promise<RecentStore[]> => {
      try {
        const res = await apiClient.get<RecentStore[]>('/user/recent-stores');
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          return res.data;
        }
      } catch {
        // fall through to backup
      }
      try {
        const res = await apiClient.get<RecentStore[]>('/stores/recent');
        if (res.success && Array.isArray(res.data)) return res.data;
      } catch {
        // ignore — card stays hidden
      }
      return [];
    };

    fetchRecentStores()
      .then((stores) => {
        if (cancelled) return;

        // Find stores overdue for a revisit, pick the most recently visited one
        const overdue = stores
          .map((s) => ({ ...s, daysSince: daysSince(s.lastVisitDate) }))
          .filter((s) => s.daysSince > OVERDUE_THRESHOLD_DAYS)
          .sort((a, b) => a.daysSince - b.daysSince); // ascending: least overdue first

        setStore(overdue[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setStore(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Don't render loading state — card should appear silently or not at all
  if (loading || !store) return null;

  const handleBookAgain = () => {
    router.push(`/MainStorePage?storeId=${store.storeId}` as unknown);
  };

  const handleViewOffer = () => {
    router.push(`/MainStorePage?storeId=${store.storeId}&tab=offers` as unknown);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.headline}>Haven't visited lately 👋</Text>

      <View style={styles.storeRow}>
        {store.storeLogo ? (
          <CachedImage
            source={{ uri: store.storeLogo }}
            style={styles.storeLogo}
            contentFit="cover"
            showShimmer={false}
          />
        ) : (
          <View style={[styles.storeLogo, styles.storeLogoPlaceholder]}>
            <Text style={styles.storeLogoPlaceholderText}>
              {store.storeName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.storeInfo}>
          <Text style={styles.storeName} numberOfLines={1}>
            {store.storeName}
          </Text>
          <Text style={styles.lastVisit}>Last visit: {store.daysSince} days ago</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.actionBtn, styles.actionBtnPrimary]}
          onPress={handleBookAgain}
          accessibilityRole="button"
          accessibilityLabel={`Book again at ${store.storeName}`}
        >
          <Text style={styles.actionBtnPrimaryText}>Book again →</Text>
        </Pressable>

        <Pressable
          style={[styles.actionBtn, styles.actionBtnSecondary]}
          onPress={handleViewOffer}
          accessibilityRole="button"
          accessibilityLabel={`View offers at ${store.storeName}`}
        >
          <Text style={styles.actionBtnSecondaryText}>View offer →</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border?.default ?? '#E5E7EB',
    padding: spacing.base,
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headline: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  storeLogo: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[50],
  },
  storeLogoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[100],
  },
  storeLogoPlaceholderText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.secondary[600],
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  lastVisit: {
    fontSize: 12,
    color: colors.text.tertiary ?? colors.slateGray,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimary: {
    backgroundColor: colors.secondary[600],
  },
  actionBtnPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.lightMustard,
  },
  actionBtnSecondary: {
    backgroundColor: colors.primary[100],
    borderWidth: 1,
    borderColor: colors.primary[300],
  },
  actionBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondary[600],
  },
});

export default RebookingNudgeCard;
