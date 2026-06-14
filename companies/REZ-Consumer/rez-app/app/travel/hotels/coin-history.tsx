/**
 * Hotel Brand Coin Transaction History
 * Route: /travel/hotels/coin-history
 * Shows earn/burn log for a specific hotel's brand coin.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getHotelCoinTransactions, OtaCoinTransaction } from '@/services/hotelOtaApi';

const C = {
  bg: '#F8FAFC',
  white: '#FFFFFF',
  navy: '#0F172A',
  slate: '#64748B',
  slate200: '#E2E8F0',
  green: '#16A34A',
  red: '#EF4444',
  purple: '#7C3AED',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function paise(p: number) {
  return `₹${Math.round(p / 100).toLocaleString()}`;
}

function TxRow({ tx }: { tx: OtaCoinTransaction }) {
  const isEarn = tx.direction === 'earn';
  return (
    <View style={styles.txRow}>
      <View style={[styles.txIcon, { backgroundColor: isEarn ? '#DCFCE7' : '#FEF2F2' }]}>
        <Ionicons name={isEarn ? 'arrow-down-circle' : 'arrow-up-circle'} size={20} color={isEarn ? C.green : C.red} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.txDesc} numberOfLines={2}>
          {tx.description || (isEarn ? 'Coins Earned' : 'Coins Redeemed')}
        </Text>
        <Text style={styles.txDate}>{formatDate(tx.createdAt)}</Text>
      </View>
      <Text style={[styles.txAmount, { color: isEarn ? C.green : C.red }]}>
        {isEarn ? '+' : '-'}
        {paise(tx.amountPaise)}
      </Text>
    </View>
  );
}

export default function HotelCoinHistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    hotelId,
    hotelName,
    coinName,
    lifetimeEarned: lifetimeEarnedParam,
    lifetimeBurned: lifetimeBurnedParam,
  } = useLocalSearchParams<{
    hotelId: string;
    hotelName: string;
    coinName: string;
    lifetimeEarned?: string;
    lifetimeBurned?: string;
  }>();

  const [transactions, setTransactions] = useState<OtaCoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Use server-provided lifetime totals (passed via nav params from wallet screen).
  // These are authoritative — do not accumulate from loaded pages, which would
  // only reflect the current page subset and double-count on re-mount.
  const totalEarned = parseInt(lifetimeEarnedParam ?? '0', 10);
  const totalBurned = parseInt(lifetimeBurnedParam ?? '0', 10);

  const load = useCallback(
    async (p: number, replace = false) => {
      if (p === 1) setLoading(true);
      else setLoadingMore(true);
      try {
        const res = await getHotelCoinTransactions({ hotelId, coinType: 'hotel_brand', page: p, perPage: 20 });
        const txs = res.transactions;
        setTransactions((prev) => (replace ? txs : [...prev, ...txs]));
        setHasMore(res.hasMore);
        setPage(p);
      } catch {
        /* silently fail */
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [hotelId],
  );

  useEffect(() => {
    load(1, true);
  }, [load]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#5B21B6', '#7C3AED']} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{coinName ?? 'Hotel Coins'}</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {hotelName}
          </Text>
        </View>
      </LinearGradient>

      {/* Lifetime stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="arrow-down-circle" size={18} color={C.green} />
          <Text style={styles.statLabel}>Total Earned</Text>
          <Text style={[styles.statValue, { color: C.green }]}>{paise(totalEarned)}</Text>
        </View>
        <View style={[styles.statCard, { borderLeftWidth: 1, borderLeftColor: C.slate200 }]}>
          <Ionicons name="arrow-up-circle" size={18} color={C.red} />
          <Text style={styles.statLabel}>Total Redeemed</Text>
          <Text style={[styles.statValue, { color: C.red }]}>{paise(totalBurned)}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.purple} />
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="wallet-outline" size={48} color={C.slate200} />
          <Text style={styles.emptyText}>No transactions yet</Text>
          <Text style={styles.emptyHint}>Book a stay to start earning {coinName ?? 'hotel coins'}</Text>
        </View>
      ) : (
        <FlashList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TxRow tx={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (hasMore && !loadingMore) load(page + 1);
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator size="small" color={C.purple} style={{ marginVertical: 16 }} /> : null
          }
          estimatedItemSize={72}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: C.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 4 },
  statLabel: { fontSize: 11, color: C.slate, fontWeight: '600' },
  statValue: { fontSize: 16, fontWeight: '800' },
  listContent: { padding: 16 },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
      android: { elevation: 1 },
    }),
  },
  txIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  txDesc: { fontSize: 13, fontWeight: '600', color: C.navy, lineHeight: 18 },
  txDate: { fontSize: 11, color: C.slate, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '800' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  emptyText: { fontSize: 16, fontWeight: '700', color: C.navy },
  emptyHint: { fontSize: 13, color: C.slate, textAlign: 'center' },
});
