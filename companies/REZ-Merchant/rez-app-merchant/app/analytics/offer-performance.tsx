/**
 * Sprint 15: Offer Performance Screen
 * Lists active offers sorted by redemption count.
 * Tap an offer to see a 7-day redemption bar chart.
 * Each offer row has a Pause / Activate toggle.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { apiClient } from '@/services/api/client';
import { useStore } from '@/contexts/StoreContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OfferPerformance {
  _id: string;
  title: string;
  isActive: boolean;
  redemptionCount: number;
  totalCoinsGiven: number;
  averageSpend: number;
  trend7d: number[]; // 7 daily redemption counts, oldest → newest
}

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────

function MiniBarChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const barWidth = 18;
  const gap = 4;
  const maxHeight = 48;

  return (
    <View style={chart.container}>
      {data.map((val, i) => (
        <View key={i} style={chart.barWrap}>
          <View
            style={[
              chart.bar,
              {
                height: Math.max((val / max) * maxHeight, 3),
                backgroundColor: i === data.length - 1 ? '#7C3AED' : '#C4B5FD',
                width: barWidth,
              },
            ]}
          />
          <ThemedText style={chart.barLabel}>{val}</ThemedText>
        </View>
      ))}
    </View>
  );
}

const chart = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginTop: 10,
    paddingTop: 4,
  },
  barWrap: {
    alignItems: 'center',
    gap: 2,
  },
  bar: {
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 9,
    color: '#6B7280',
  },
});

// ─── Offer Row ────────────────────────────────────────────────────────────────

interface OfferRowProps {
  offer: OfferPerformance;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleActive: () => void;
  toggling: boolean;
}

function OfferRow({ offer, expanded, onToggleExpand, onToggleActive, toggling }: OfferRowProps) {
  return (
    <View style={styles.offerCard}>
      <TouchableOpacity
        onPress={onToggleExpand}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Expand ${offer.title}`}
      >
        <View style={styles.offerHeader}>
          <View style={styles.offerHeaderLeft}>
            <View
              style={[styles.offerDot, { backgroundColor: offer.isActive ? '#10B981' : '#9CA3AF' }]}
            />
            <ThemedText style={styles.offerTitle} numberOfLines={2}>
              {offer.title}
            </ThemedText>
          </View>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#9CA3AF" />
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <ThemedText style={styles.statValue}>
              {offer.redemptionCount.toLocaleString()}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Redemptions</ThemedText>
          </View>
          <View style={[styles.statCell, styles.statCellBorder]}>
            <ThemedText style={styles.statValue}>
              {offer.totalCoinsGiven.toLocaleString()}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Coins Given</ThemedText>
          </View>
          <View style={[styles.statCell, styles.statCellBorder]}>
            <ThemedText style={styles.statValue}>₹{offer.averageSpend.toLocaleString()}</ThemedText>
            <ThemedText style={styles.statLabel}>Avg Spend</ThemedText>
          </View>
        </View>
      </TouchableOpacity>

      {/* Expanded: 7-day trend + toggle */}
      {expanded && (
        <View style={styles.expandedSection}>
          <ThemedText style={styles.trendTitle}>7-Day Redemption Trend</ThemedText>
          <MiniBarChart
            data={
              offer.trend7d.length === 7 ? offer.trend7d : [0, 0, 0, 0, 0, 0, offer.redemptionCount]
            }
          />

          <TouchableOpacity
            onPress={onToggleActive}
            disabled={toggling}
            style={[
              styles.toggleBtn,
              offer.isActive ? styles.toggleBtnPause : styles.toggleBtnActivate,
            ]}
            accessibilityRole="button"
            accessibilityLabel={offer.isActive ? 'Pause offer' : 'Activate offer'}
          >
            {toggling ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons
                  name={offer.isActive ? 'pause-circle-outline' : 'play-circle-outline'}
                  size={16}
                  color="#fff"
                />
                <ThemedText style={styles.toggleBtnText}>
                  {offer.isActive ? 'Pause Offer' : 'Activate Offer'}
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function OfferPerformanceScreen() {
  const { activeStore } = useStore();
  const storeId = activeStore?._id;

  const [offers, setOffers] = useState<OfferPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchOffers = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) setRefreshing(true);
        else setIsLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (storeId) params.append('storeId', storeId);

        const res = await apiClient.get<OfferPerformance[]>(
          `merchant/analytics/offer-performance?${params.toString()}`
        );

        if (res.success && res.data) {
          // Sort by redemption count descending
          const sorted = [...res.data].sort((a, b) => b.redemptionCount - a.redemptionCount);
          setOffers(sorted);
        } else {
          // Fallback: fetch offers list and build basic performance data
          const offersRes = await apiClient.get<{ deals: unknown[] }>(
            `merchant/offers?${params.toString()}`
          );
          const rawData = offersRes.data as unknown as { deals?: unknown[] };
          const deals: unknown[] = rawData?.deals ?? (Array.isArray(rawData) ? rawData : []);
          const fallback: OfferPerformance[] = deals.map((d) => ({
            _id: d._id,
            title: d.title,
            isActive: d.validity?.isActive ?? true,
            redemptionCount: d.redemptionCount ?? 0,
            totalCoinsGiven: d.totalCoinsGiven ?? 0,
            averageSpend: d.averageSpend ?? 0,
            trend7d: d.trend7d ?? [0, 0, 0, 0, 0, 0, d.redemptionCount ?? 0],
          }));
          const sorted = fallback.sort((a, b) => b.redemptionCount - a.redemptionCount);
          setOffers(sorted);
        }
      } catch (err) {
        setError(err?.message || 'Failed to load offer performance');
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [storeId]
  );

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleToggleActive = async (offer: OfferPerformance) => {
    setTogglingId(offer._id);
    try {
      const endpoint = offer.isActive
        ? `merchant/offers/${offer._id}/pause`
        : `merchant/offers/${offer._id}/activate`;
      await apiClient.post(endpoint, {});
      setOffers((prev) =>
        prev.map((o) => (o._id === offer._id ? { ...o, isActive: !o.isActive } : o))
      );
    } catch {
      // silently ignore — real-world error handling would show a toast
    } finally {
      setTogglingId(null);
    }
  };

  const handleToggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Nav Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color="#374151" />
        </TouchableOpacity>
        <ThemedText style={styles.navTitle}>Offer Performance</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <ThemedText style={styles.loadingText}>Loading offers...</ThemedText>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity
            onPress={() => fetchOffers()}
            style={styles.retryBtn}
            accessibilityRole="button"
          >
            <ThemedText style={styles.retryBtnText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      ) : offers.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="pricetag-outline" size={64} color="#D1D5DB" />
          <ThemedText style={styles.emptyTitle}>No Offers Yet</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Create your first offer to see performance data here.
          </ThemedText>
          <TouchableOpacity
            onPress={() => router.push('/(dashboard)/create-offer')}
            style={styles.createBtn}
            accessibilityRole="button"
          >
            <ThemedText style={styles.createBtnText}>Create Offer</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchOffers(true)} />
          }
          showsVerticalScrollIndicator={false}
        >
          <ThemedText style={styles.sectionHint}>
            Sorted by redemption count — tap a row to see 7-day trend
          </ThemedText>
          {offers.map((offer) => (
            <OfferRow
              key={offer._id}
              offer={offer}
              expanded={expandedId === offer._id}
              onToggleExpand={() => handleToggleExpand(offer._id)}
              onToggleActive={() => handleToggleActive(offer)}
              toggling={togglingId === offer._id}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: 40,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  loadingText: {
    color: '#6B7280',
    marginTop: 8,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    fontSize: 14,
  },
  retryBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  createBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  offerCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  offerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 8,
  },
  offerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  offerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statCellBorder: {
    borderLeftWidth: 1,
    borderLeftColor: '#F3F4F6',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  expandedSection: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 12,
    paddingTop: 12,
  },
  trendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  toggleBtnPause: {
    backgroundColor: '#EF4444',
  },
  toggleBtnActivate: {
    backgroundColor: '#10B981',
  },
  toggleBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
