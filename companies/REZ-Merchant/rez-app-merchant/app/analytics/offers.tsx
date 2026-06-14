import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '@/services/api/client';
import { logger } from '@/utils/logger';

interface OfferRow {
  offerId: string;
  name: string;
  redemptions: number;
  views: number;
  clicks: number;
}

export default function OffersAnalyticsScreen() {
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOffers = useCallback(async () => {
    setError(null);
    try {
      const res = await apiClient.get<unknown>('merchant/analytics/offers/top?limit=20');
      if (res.success && res.data) {
        setOffers(res.data.offers ?? []);
      } else {
        setError((res as unknown as { message?: string }).message || 'Failed to load offers analytics');
      }
    } catch (err) {
      logger.error('Offers analytics error:', err);
      setError(err?.message || 'Failed to load offers analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOffers();
    }, [fetchOffers])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOffers();
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.screenTitle}>Offers Analytics</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1a3a52" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchOffers}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : offers.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="pricetag-outline" size={56} color="#999" />
          <Text style={styles.emptyTitle}>No offer data yet</Text>
          <Text style={styles.emptySubtitle}>
            Offer analytics will appear here once your offers receive activity.
          </Text>
        </View>
      ) : (
        <FlatList
          data={offers}
          keyExtractor={(item) => item.offerId}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.tableHeader}>
              <Text style={[styles.col, styles.colName, styles.headerText]}>Offer</Text>
              <Text style={[styles.col, styles.colNum, styles.headerText]}>Views</Text>
              <Text style={[styles.col, styles.colNum, styles.headerText]}>Clicks</Text>
              <Text style={[styles.col, styles.colNum, styles.headerText]}>Redeem</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={[styles.col, styles.colName]} numberOfLines={1}>
                {item.name || item.offerId}
              </Text>
              <Text style={[styles.col, styles.colNum]}>{item.views ?? 0}</Text>
              <Text style={[styles.col, styles.colNum]}>{item.clicks ?? 0}</Text>
              <Text style={[styles.col, styles.colNum]}>{item.redemptions ?? 0}</Text>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  backButton: { padding: 16 },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a3a52',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  errorText: { color: '#EF4444', fontSize: 14, textAlign: 'center' },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#1a3a52',
    borderRadius: 8,
  },
  retryBtnText: { color: '#fff', fontWeight: '600' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  emptySubtitle: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 20 },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
    marginBottom: 4,
  },
  headerText: { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
  },
  separator: { height: 1, backgroundColor: '#f3f4f6' },
  col: { fontSize: 14, color: '#374151' },
  colName: { flex: 1, marginRight: 8 },
  colNum: { width: 60, textAlign: 'right', fontWeight: '600', color: '#1a3a52' },
});
