/**
 * components/dashboard/TodayRevenueWidget.tsx
 * Small "Today's Revenue" summary card for the merchant dashboard.
 *
 * Fetches GET /api/web-ordering/store/:slug/analytics?period=1d on mount.
 * Taps to navigate to /(dashboard)/rez-now-analytics.
 * Silently hides itself on error or when the store has no slug.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { apiClient } from '@/services/api/client';
import { useStore } from '@/contexts/StoreContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TodaySummary {
  totalOrders: number;
  totalRevenue: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TodayRevenueWidget() {
  const { activeStore } = useStore();
  const [summary, setSummary] = useState<TodaySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const slug = activeStore?.slug;
    if (!slug) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    apiClient
      .get(`web-ordering/store/${slug}/analytics`, { params: { period: '1d' } })
      .then((r) => {
        if (!cancelled) {
          const d = r.data?.data as { totalOrders?: number; totalRevenue?: number } | undefined;
          if (d) {
            setSummary({
              totalOrders: d.totalOrders ?? 0,
              totalRevenue: d.totalRevenue ?? 0,
            });
          }
        }
      })
      .catch(() => {
        // Silent — widget hides on error
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeStore?.slug]);

  // Hide if no slug configured
  if (!activeStore?.slug) return null;

  // Loading skeleton
  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.leftGroup}>
          <View style={styles.iconBg}>
            <Ionicons name="today-outline" size={18} color="#7C3AED" />
          </View>
          <View style={styles.textGroup}>
            <Text style={styles.dayLabel}>Today</Text>
            <ActivityIndicator size="small" color="#7C3AED" style={styles.spinner} />
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
      </View>
    );
  }

  // Hide if no orders today
  if (!summary || summary.totalOrders === 0) return null;

  const revenueFormatted =
    summary.totalRevenue >= 100000
      ? `₹${(summary.totalRevenue / 100000).toFixed(1)}L`
      : summary.totalRevenue >= 1000
        ? `₹${(summary.totalRevenue / 1000).toFixed(1)}K`
        : `₹${summary.totalRevenue}`;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push('/(dashboard)/analytics' as const)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Today: ${revenueFormatted}, ${summary.totalOrders} orders. Tap to view analytics.`}
    >
      <View style={styles.leftGroup}>
        <View style={styles.iconBg}>
          <Ionicons name="today-outline" size={18} color="#7C3AED" />
        </View>
        <View style={styles.textGroup}>
          <Text style={styles.dayLabel}>Today</Text>
          <View style={styles.statsRow}>
            <Text style={styles.revenueText}>{revenueFormatted}</Text>
            <View style={styles.dot} />
            <Text style={styles.ordersText}>
              {summary.totalOrders} {summary.totalOrders === 1 ? 'order' : 'orders'}
            </Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6D28D9',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  revenueText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4C1D95',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#A78BFA',
  },
  ordersText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#7C3AED',
  },
  spinner: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
});
