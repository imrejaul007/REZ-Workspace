/**
 * Merchant In-Store Payments Page
 *
 * Paginated transaction history with stats, status filters, and date range.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/contexts/StoreContext';
import paymentsService, { StorePaymentRecord, PaymentStatsResponse } from '@/services/api/payments';
import { logger } from '@/utils/logger';

type StatusFilter = 'all' | 'completed' | 'failed';

export default function PaymentsScreen() {
  const { activeStore, isLoading: storeLoading } = useStore();
  const storeId = activeStore?._id;

  const [payments, setPayments] = useState<StorePaymentRecord[]>([]);
  const [stats, setStats] = useState<PaymentStatsResponse['data'] | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(
    async (pageNum: number, append: boolean = false) => {
      if (!storeId) return;

      try {
        if (pageNum === 1 && !append) setIsLoading(true);
        else setIsLoadingMore(true);
        setError(null);

        const statusParam = statusFilter === 'all' ? undefined : statusFilter;
        const response = await paymentsService.getPayments(storeId, {
          page: pageNum,
          limit: 20,
          status: statusParam,
        });

        const newPayments = response?.data?.transactions ?? [];
        if (append) {
          setPayments((prev) => [...prev, ...newPayments]);
        } else {
          setPayments(newPayments);
        }
        setHasMore(response?.data?.pagination?.hasNext ?? false);
        setPage(pageNum);
      } catch (err) {
        setError(err.message || 'Failed to load payments');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
      }
    },
    [storeId, statusFilter]
  );

  const fetchStats = useCallback(async () => {
    if (!storeId) return;
    try {
      const response = await paymentsService.getPaymentStats(storeId);
      setStats(response?.data ?? null);
    } catch (err) {
      // Stats are non-critical
      if (__DEV__) console.error('[Payments] Stats fetch failed:', err);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) {
      fetchPayments(1);
      fetchStats();
    }
  }, [storeId, statusFilter, fetchPayments, fetchStats]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setError(null);
    setHasMore(true);
    fetchPayments(1);
    fetchStats();
  }, [fetchPayments, fetchStats]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    fetchPayments(page + 1, true);
  }, [hasMore, isLoadingMore, fetchPayments, page]);

  const handleStatusChange = useCallback((filter: StatusFilter) => {
    setStatusFilter(filter);
    setPage(1);
    setHasMore(true);
  }, []);

  const formatCurrency = useCallback((amount: number) => `₹${(amount || 0).toLocaleString()}`, []);
  const formatDate = useCallback((dateStr?: string | null) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'failed':
      case 'cancelled':
      case 'expired':
        return '#EF4444';
      case 'initiated':
      case 'processing':
        return '#F59E0B';
      case 'refunded':
        return '#6366F1';
      default:
        return '#6B7280';
    }
  }, []);

  const getPaymentMethodLabel = useCallback((method: string) => {
    switch (method) {
      case 'upi':
        return 'UPI';
      case 'card':
      case 'credit_card':
      case 'debit_card':
        return 'Card';
      case 'coins_only':
        return 'Coins Only';
      case 'net_banking':
      case 'netbanking':
        return 'Net Banking';
      default:
        return method?.toUpperCase() || 'Unknown';
    }
  }, []);

  const renderStatsHeader = useCallback(() => {
    if (!stats) return null;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="today-outline" size={20} color="#10B981" />
          <Text style={styles.statLabel}>Today</Text>
          <Text style={styles.statValue}>{formatCurrency(stats?.today?.revenue)}</Text>
          <Text style={styles.statSubtext}>{stats?.today?.paymentCount ?? 0} payments</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="calendar-outline" size={20} color="#6366F1" />
          <Text style={styles.statLabel}>This Month</Text>
          <Text style={styles.statValue}>{formatCurrency(stats?.thisMonth?.revenue)}</Text>
          <Text style={styles.statSubtext}>{stats?.thisMonth?.paymentCount ?? 0} payments</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="trending-up-outline" size={20} color="#F59E0B" />
          <Text style={styles.statLabel}>Avg. Value</Text>
          <Text style={styles.statValue}>
            {formatCurrency(stats?.thisMonth?.averageTransactionValue)}
          </Text>
          <Text style={styles.statSubtext}>per payment</Text>
        </View>
      </View>
    );
  }, [stats, formatCurrency]);

  const renderFilters = useCallback(
    () => (
      <View style={styles.filterContainer}>
        {(['all', 'completed', 'failed'] as StatusFilter[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, statusFilter === filter && styles.filterChipActive]}
            onPress={() => handleStatusChange(filter)}
          >
            <Text style={[styles.filterText, statusFilter === filter && styles.filterTextActive]}>
              {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    ),
    [statusFilter, handleStatusChange]
  );

  const renderPaymentItem = useCallback(
    ({ item }: { item: StorePaymentRecord }) => (
      <View style={styles.paymentCard}>
        <View style={styles.paymentCardTop}>
          <View style={styles.paymentIdRow}>
            <Ionicons name="receipt-outline" size={16} color="#6B7280" />
            <Text style={styles.paymentId} numberOfLines={1}>
              {item.paymentId}
            </Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}
          >
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {(item.status || 'unknown').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.paymentCardBody}>
          <Text style={styles.paymentAmount}>{formatCurrency(item.amount)}</Text>
          <View style={styles.paymentDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="card-outline" size={14} color="#9CA3AF" />
              <Text style={styles.detailText}>{getPaymentMethodLabel(item.paymentMethod)}</Text>
            </View>
            {(item.coinsUsed ?? 0) > 0 && (
              <View style={styles.detailRow}>
                <Ionicons name="star-outline" size={14} color="#F59E0B" />
                <Text style={styles.detailText}>{item.coinsUsed} coins used</Text>
              </View>
            )}
            {item.rewards?.cashbackEarned ? (
              <View style={styles.detailRow}>
                <Ionicons name="gift-outline" size={14} color="#10B981" />
                <Text style={styles.detailText}>{item.rewards.cashbackEarned} cashback</Text>
              </View>
            ) : null}
          </View>
        </View>

        <Text style={styles.paymentDate}>{formatDate(item.completedAt || item.createdAt)}</Text>
      </View>
    ),
    [getStatusColor, getPaymentMethodLabel, formatCurrency, formatDate]
  );

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return <View style={{ height: 120 }} />;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#7C3AED" />
      </View>
    );
  }, [isLoadingMore]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    const filterLabel =
      statusFilter === 'all' ? null : statusFilter === 'completed' ? 'completed' : 'failed';
    return (
      <View style={styles.emptyState}>
        <Ionicons name="cash-outline" size={56} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>
          {filterLabel ? `No ${filterLabel} payments` : 'No payments yet'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {filterLabel
            ? `Try switching filters to see other payments`
            : 'In-store payments from customers will appear here'}
        </Text>
      </View>
    );
  }, [isLoading, statusFilter]);

  // While the store context is still initialising (or the activeStore hasn't
  // resolved yet from the 2-phase load), show a loading state instead of
  // flashing "No store selected".
  if (!storeId && (storeLoading || !activeStore)) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading store...</Text>
        </View>
      </View>
    );
  }

  if (!storeId) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="storefront-outline" size={56} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No store selected</Text>
          <Text style={styles.emptySubtitle}>Select a store to view payments</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>In-Store Payments</Text>
        <Text style={styles.headerSubtitle}>{activeStore?.name}</Text>
      </View>

      {isLoading && payments.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading payments...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchPayments(1)}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.paymentId}
          renderItem={renderPaymentItem}
          ListHeaderComponent={
            <>
              {renderStatsHeader()}
              {renderFilters()}
            </>
          }
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#7C3AED']}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  statSubtext: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  paymentCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  paymentIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  paymentId: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  paymentCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  paymentAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  paymentDetails: {
    alignItems: 'flex-end',
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  paymentDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 8,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#7C3AED',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
