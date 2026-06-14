import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { apiClient } from '@/services/api/client';
import { useStore } from '@/contexts/StoreContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopItem {
  name: string;
  count: number;
}

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  completionRate: number;
  topItems: TopItem[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RezNowAnalyticsCard() {
  const { activeStore } = useStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const slug = activeStore?.slug;
    if (!slug) return;

    let cancelled = false;
    setLoading(true);
    setError(false);

    apiClient
      .get(`web-ordering/store/${slug}/analytics`, {
        params: { period: '30d' },
      })
      .then((r) => {
        if (!cancelled) setData(r.data?.data ?? null);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeStore?.slug]);

  // Don't show card if store has no slug yet
  if (!activeStore?.slug) return null;

  // ─── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconBg}>
            <Ionicons name="storefront-outline" size={16} color="#0EA5E9" />
          </View>
          <Text style={styles.headerText}>REZ Now — Last 30 days</Text>
        </View>
        <View style={styles.skeletonRow}>
          <ActivityIndicator size="small" color="#0EA5E9" />
          <Text style={styles.skeletonText}>Loading stats...</Text>
        </View>
      </View>
    );
  }

  // ─── Error / empty state ───────────────────────────────────────────────────
  if (error || !data || data.totalOrders === 0) return null;

  const completionPct = Math.round(data.completionRate * 100);
  const top3 = data.topItems.slice(0, 3);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconBg}>
          <Ionicons name="storefront-outline" size={16} color="#0EA5E9" />
        </View>
        <Text style={styles.headerText}>REZ Now — Last 30 days</Text>
      </View>

      {/* Primary stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{data.totalOrders}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>₹{data.totalRevenue.toLocaleString('en-IN')}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>₹{data.avgOrderValue.toLocaleString('en-IN')}</Text>
          <Text style={styles.statLabel}>Avg order</Text>
        </View>
      </View>

      {/* Completion rate row */}
      <View style={styles.completionRow}>
        <Ionicons name="checkmark-circle-outline" size={14} color="#0EA5E9" />
        <Text style={styles.completionText}>
          <Text style={styles.completionHighlight}>{completionPct}%</Text> completion rate
        </Text>
      </View>

      {/* Top items pills */}
      {top3.length > 0 && (
        <View style={styles.pillsSection}>
          <Text style={styles.pillsLabel}>Top items</Text>
          <View style={styles.pillsRow}>
            {top3.map((item) => (
              <View key={item.name} style={styles.pill}>
                <Text style={styles.pillText} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.pillCount}>{item.count}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* View Full Stats CTA */}
      <TouchableOpacity
        style={styles.ctaBtn}
        onPress={() => router.push('/settings/rez-now')}
        activeOpacity={0.8}
      >
        <Text style={styles.ctaBtnText}>View Full Stats</Text>
        <Ionicons name="chevron-forward" size={14} color="#0EA5E9" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0C4A6E',
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  skeletonText: {
    fontSize: 13,
    color: '#38BDF8',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0C4A6E',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#0EA5E9',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#BAE6FD',
  },
  completionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  completionText: {
    fontSize: 13,
    color: '#0369A1',
    lineHeight: 18,
  },
  completionHighlight: {
    fontWeight: '800',
    color: '#0C4A6E',
  },
  pillsSection: {
    marginBottom: 12,
  },
  pillsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#BAE6FD',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
    maxWidth: 160,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0C4A6E',
    flexShrink: 1,
  },
  pillCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
    backgroundColor: '#E0F2FE',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#7DD3FC',
    borderRadius: 10,
    paddingVertical: 9,
    backgroundColor: '#F0F9FF',
  },
  ctaBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0EA5E9',
  },
});
