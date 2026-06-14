// @ts-nocheck
/**
 * Smart Savings Screen
 *
 * Sprint 7 — full-screen savings intelligence screen.
 * - Summary card: lifetime saved, this month, streak
 * - Best Nearby stores list (cashback %, expected saving, distance)
 * - Uses expo-location.getLastKnownPositionAsync() for coords (fallback 0,0)
 * - Tap store card → /store-detail?storeId=
 * - Pull-to-refresh
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import apiClient from '@/services/apiClient';

// ── Brand tokens ─────────────────────────────────────────────────────────────
const NAVY = '#0A1628';
const NAVY_LIGHT = '#152540';
const GOLD = '#FFD700';
const WHITE = '#FFFFFF';
const SUCCESS = '#22C55E';
const BORDER = 'rgba(255,215,0,0.2)';
const TEXT_MUTED = 'rgba(255,255,255,0.55)';

// ── Types ────────────────────────────────────────────────────────────────────

interface SavingsSummary {
  lifetimeSavedPaise: number;
  thisMonthPaise: number;
  savingsStreak: number;
}

interface NearbyStore {
  storeId: string;
  storeName: string;
  cashbackPercent: number;
  expectedSavingPaise: number;
  distanceMetres: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function paise2Rupee(p: number): string {
  return (p / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

async function getCoords(): Promise<{ lat: number; lng: number }> {
  try {
    const pos = await Location.getLastKnownPositionAsync();
    if (pos) {
      return { lat: pos.coords.latitude, lng: pos.coords.longitude };
    }
  } catch {
    // fallback
  }
  return { lat: 0, lng: 0 };
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return <View style={skelStyles.card} />;
}

const skelStyles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    height: 80,
    marginBottom: 10,
  },
});

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryCard({ summary }: { summary: SavingsSummary }) {
  return (
    <View style={sumStyles.card}>
      <Text style={sumStyles.cardTitle}>Your Savings</Text>
      <View style={sumStyles.row}>
        <View style={sumStyles.stat}>
          <Text style={sumStyles.value}>&#8377;{paise2Rupee(summary.lifetimeSavedPaise)}</Text>
          <Text style={sumStyles.label}>Lifetime saved</Text>
        </View>
        <View style={sumStyles.divider} />
        <View style={sumStyles.stat}>
          <Text style={sumStyles.value}>&#8377;{paise2Rupee(summary.thisMonthPaise)}</Text>
          <Text style={sumStyles.label}>This month</Text>
        </View>
        <View style={sumStyles.divider} />
        <View style={sumStyles.stat}>
          <Text style={[sumStyles.value, { color: SUCCESS }]}>{summary.savingsStreak}</Text>
          <Text style={sumStyles.label}>Day streak</Text>
        </View>
      </View>
    </View>
  );
}

const sumStyles = StyleSheet.create({
  card: {
    backgroundColor: NAVY_LIGHT,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 14,
  },
  cardTitle: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  value: {
    color: WHITE,
    fontSize: 20,
    fontWeight: '800',
  },
  label: {
    color: TEXT_MUTED,
    fontSize: 11,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});

function StoreCard({ store, onPress }: { store: NearbyStore; onPress: () => void }) {
  const savingRupee = paise2Rupee(store.expectedSavingPaise);
  return (
    <Pressable style={storeStyles.card} onPress={onPress}>
      <View style={storeStyles.left}>
        <Text style={storeStyles.name} numberOfLines={1}>
          {store.storeName}
        </Text>
        <Text style={storeStyles.saving}>Earn up to &#8377;{savingRupee} on &#8377;500 spend</Text>
        <View style={storeStyles.metaRow}>
          <Ionicons name="location-outline" size={12} color={TEXT_MUTED} />
          <Text style={storeStyles.meta}>{store.distanceMetres}m away</Text>
        </View>
      </View>
      <View style={storeStyles.right}>
        <Text style={storeStyles.cashback}>{store.cashbackPercent}%</Text>
        <Text style={storeStyles.cashbackLabel}>cashback</Text>
        <Ionicons name="chevron-forward" size={16} color={GOLD} style={{ marginTop: 4 }} />
      </View>
    </Pressable>
  );
}

const storeStyles = StyleSheet.create({
  card: {
    backgroundColor: NAVY_LIGHT,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 10,
  },
  left: {
    flex: 1,
    gap: 3,
  },
  name: {
    color: WHITE,
    fontSize: 15,
    fontWeight: '700',
  },
  saving: {
    color: SUCCESS,
    fontSize: 12,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  meta: {
    color: TEXT_MUTED,
    fontSize: 11,
  },
  right: {
    alignItems: 'center',
    minWidth: 68,
    gap: 1,
  },
  cashback: {
    color: GOLD,
    fontSize: 22,
    fontWeight: '900',
  },
  cashbackLabel: {
    color: TEXT_MUTED,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function SmartSpendScreen() {
  const router = useRouter();

  const [summary, setSummary] = useState<SavingsSummary | null>(null);
  const [nearbyStores, setNearbyStores] = useState<NearbyStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setError('');
    try {
      const { lat, lng } = await getCoords();

      const [summaryRes, nearbyRes] = await Promise.allSettled([
        apiClient.get<{ data: SavingsSummary }>('/user/savings/summary'),
        apiClient.get<{ data: NearbyStore[] }>(`/user/savings/best-nearby?lat=${lat}&lng=${lng}&budgetPaise=50000`),
      ]);

      if (summaryRes.status === 'fulfilled') {
        const d = (summaryRes.value as unknown)?.data ?? (summaryRes.value as unknown);
        setSummary(d as SavingsSummary);
      }

      if (nearbyRes.status === 'fulfilled') {
        const d = (nearbyRes.value as unknown)?.data ?? (nearbyRes.value as unknown);
        setNearbyStores(Array.isArray(d) ? d : []);
      }
    } catch (err) {
      setError(err?.message ?? 'Failed to load savings data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setLoading(false);
    fetchData();
  }, [fetchData]);

  const handleStorePress = useCallback(
    (storeId: string) => {
      router.push(`/store-detail?storeId=${storeId}` as unknown as string);
    },
    [router],
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={24} color={GOLD} />
        </Pressable>
        <Text style={styles.headerTitle}>Smart Savings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={GOLD} colors={[GOLD]} />
        }
      >
        {/* Summary card */}
        {summary && <SummaryCard summary={summary} />}

        {/* Section header */}
        <Text style={styles.sectionTitle}>Best Nearby</Text>

        {/* Loading skeleton */}
        {loading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {/* Error */}
        {!loading && error ? (
          <View style={styles.centerBox}>
            <Ionicons name="alert-circle-outline" size={36} color={GOLD} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              style={styles.retryBtn}
              onPress={() => {
                setLoading(true);
                fetchData();
              }}
            >
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Empty state */}
        {!loading && !error && nearbyStores.length === 0 && (
          <View style={styles.centerBox}>
            <Ionicons name="map-outline" size={40} color={TEXT_MUTED} />
            <Text style={styles.emptyText}>No nearby offers found. Try expanding your search area.</Text>
          </View>
        )}

        {/* Store list */}
        {!loading &&
          nearbyStores.map((store) => (
            <StoreCard key={store.storeId} store={store} onPress={() => handleStorePress(store.storeId)} />
          ))}
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: NAVY,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: NAVY,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: WHITE,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
    gap: 8,
  },
  sectionTitle: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 4,
  },
  centerBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  errorText: {
    color: WHITE,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
    maxWidth: 260,
  },
  emptyText: {
    color: TEXT_MUTED,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: GOLD,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  retryText: {
    color: NAVY,
    fontWeight: '700',
    fontSize: 14,
  },
});
