import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { posService, POSBill } from '@/services/api/pos';
import { useStore } from '@/contexts/StoreContext';
import { logger } from '@/utils/logger';

// BUG FIX (C2): This screen previously called getRecentMerchantOrders() which
// hit rez-merchant-service's `/merchant/pos/recent-orders` endpoint. That
// endpoint queries the Order collection filtered by source='pos' — but
// rez-backend's markBillPaid never creates Order docs, it only writes to the
// PosBill collection. So the list was always empty regardless of how many
// sales the merchant had rung up. Switched to posService.getRecentBills()
// which hits `/store-payment/bills` (PosBill collection — the actual POS
// data source).
type RecentBill = POSBill & {
  _id?: string;
  totalAmount?: number;
};

export default function RecentOrdersScreen() {
  const { activeStore, isLoading: storeLoading } = useStore();
  const [orders, setOrders] = useState<RecentBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!activeStore?._id) {
        setLoading(false);
        setRefreshing(false);
        setError('No active store selected');
        return;
      }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const result = await posService.getRecentBills(1, activeStore._id);
        setOrders(Array.isArray(result.bills) ? (result.bills as RecentBill[]) : []);
      } catch (_e) {
        setError(_e.message || 'Failed to load orders');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeStore?._id]
  );

  // Run the fetch when activeStore becomes available. If StoreContext
  // resolves with NO active store, clear the spinner so the user sees
  // the error state instead of an eternal loader.
  useEffect(() => {
    if (storeLoading) return;
    if (activeStore?._id) {
      load();
    } else {
      setLoading(false);
      setError('No active store selected');
    }
  }, [load, activeStore?._id, storeLoading]);

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusColor = (status: string) => {
    if (status === 'paid') return '#10B981';
    if (status === 'cancelled') return '#EF4444';
    return '#F59E0B';
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.billId || item._id || `order-${item.createdAt}`}
      contentContainerStyle={orders.length === 0 ? styles.emptyContainer : styles.listContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={['#7C3AED']} />
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Ionicons name="receipt-outline" size={56} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>Bills created via POS will appear here</Text>
        </View>
      }
      renderItem={({ item }) => {
        const shortId = (item.billId || item._id || '').toString().slice(-6).toUpperCase();
        const amount = item.amount ?? item.totalAmount ?? 0;
        const paymentMethod = (item.paymentMethod || 'cash').toLowerCase();
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardId}>#{shortId}</Text>
              <View
                style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '20' }]}
              >
                <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
            <View style={styles.cardFooter}>
              <View style={styles.paymentMethod}>
                <Ionicons
                  name={paymentMethod === 'cash' ? 'cash-outline' : 'card-outline'}
                  size={14}
                  color="#6B7280"
                />
                <Text style={styles.paymentText}>{paymentMethod}</Text>
              </View>
              <Text style={styles.cardTotal}>{formatCurrency(amount)}</Text>
            </View>
            {item.items && item.items.length > 0 && (
              <Text style={styles.itemsSummary} numberOfLines={1}>
                {item.items.map((i) => `${i.name} x${i.quantity}`).join(', ')}
              </Text>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyContainer: { flex: 1 },
  listContainer: { padding: 16, gap: 12 },
  errorText: { fontSize: 15, color: '#EF4444', marginTop: 12, textAlign: 'center' },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryText: { color: '#fff', fontWeight: '700' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardId: { fontSize: 15, fontWeight: '700', color: '#111827' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardDate: { fontSize: 12, color: '#9CA3AF', marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paymentMethod: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  paymentText: { fontSize: 13, color: '#6B7280', textTransform: 'capitalize' },
  cardTotal: { fontSize: 18, fontWeight: '800', color: '#111827' },
  itemsSummary: { fontSize: 12, color: '#9CA3AF', marginTop: 8 },
});
