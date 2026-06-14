/**
 * Orders Screen
 * Purchase order list with status tabs (Pending, Approved, Delivered, Paid)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ViewStyle,
  TextStyle,
  Alert,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import {
  getOrders,
  updateOrderStatus,
  PurchaseOrder,
  OrderStatus,
} from '@/services/b2bApi';
import { OrderCard } from '@/components/b2b';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';

const ITEMS_PER_PAGE = 20;

type StatusTab = 'all' | OrderStatus;

export default function OrdersScreen(): React.JSX.Element {
  const { merchantId } = useAuth();

  // State
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    delivered: 0,
    paid: 0,
    total: 0,
  });

  // Fetch orders
  const fetchOrders = useCallback(async (page = 1, append = false) => {
    if (!merchantId) return;

    try {
      setError(null);
      const response = await getOrders(merchantId, {
        page,
        limit: ITEMS_PER_PAGE,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery || undefined,
      });

      if (append) {
        setOrders(prev => [...prev, ...response.data]);
      } else {
        setOrders(response.data);
      }
      setTotalPages(response.totalPages);
      setHasMore(page < response.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    }
  }, [merchantId, statusFilter, searchQuery]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!merchantId) return;

    try {
      const [pendingRes, approvedRes, deliveredRes, paidRes] = await Promise.all([
        getOrders(merchantId, { status: 'pending', limit: 1 }),
        getOrders(merchantId, { status: 'approved', limit: 1 }),
        getOrders(merchantId, { status: 'delivered', limit: 1 }),
        getOrders(merchantId, { status: 'paid', limit: 1 }),
      ]);

      setStats({
        pending: pendingRes.total,
        approved: approvedRes.total,
        delivered: deliveredRes.total,
        paid: paidRes.total,
        total: pendingRes.total + approvedRes.total + deliveredRes.total + paidRes.total,
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [merchantId]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchOrders(1), fetchStats()]);
      setLoading(false);
    };
    load();
  }, [statusFilter]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchOrders(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await Promise.all([fetchOrders(1), fetchStats()]);
    setRefreshing(false);
  }, [fetchOrders, fetchStats]);

  // Load more
  const onEndReached = useCallback(() => {
    if (!hasMore || loading) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchOrders(nextPage, true);
  }, [hasMore, loading, currentPage, fetchOrders]);

  // Handle status update
  const handleStatusUpdate = async (order: PurchaseOrder, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(order.id, newStatus, {
        deliveredDate: newStatus === 'delivered' ? new Date().toISOString() : undefined,
        paidDate: newStatus === 'paid' ? new Date().toISOString() : undefined,
      });
      fetchOrders(1);
      fetchStats();
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to update order status'
      );
    }
  };

  // Status tabs
  const statusTabs: { key: StatusTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'pending', label: 'Pending', count: stats.pending },
    { key: 'approved', label: 'Approved', count: stats.approved },
    { key: 'delivered', label: 'Delivered', count: stats.delivered },
    { key: 'paid', label: 'Paid', count: stats.paid },
  ];

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Purchase Orders</Text>
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>+ New Order</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by order number or supplier..."
          placeholderTextColor={colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <FlatList
        horizontal
        data={statusTabs}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.statusTab,
              statusFilter === item.key && styles.statusTabActive,
            ]}
            onPress={() => {
              setStatusFilter(item.key);
              setCurrentPage(1);
            }}
          >
            <Text
              style={[
                styles.statusTabText,
                statusFilter === item.key && styles.statusTabTextActive,
              ]}
            >
              {item.label}
            </Text>
            <View
              style={[
                styles.statusBadge,
                statusFilter === item.key && styles.statusBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  statusFilter === item.key && styles.statusBadgeTextActive,
                ]}
              >
                {item.count}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statusTabsContent}
      />
    </View>
  );

  const renderOrder = ({ item }: { item: PurchaseOrder }) => (
    <OrderCard
      order={item}
      onApprove={
        item.status === 'pending'
          ? () => handleStatusUpdate(item, 'approved')
          : undefined
      }
      onMarkDelivered={
        item.status === 'approved'
          ? () => handleStatusUpdate(item, 'delivered')
          : undefined
      }
      onMarkPaid={
        item.status === 'delivered'
          ? () => handleStatusUpdate(item, 'paid')
          : undefined
      }
      style={styles.orderCard}
    />
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <LoadingSpinner fullScreen message="Loading orders..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderFilters()}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchOrders(1)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primaryMain]}
            tintColor={colors.primaryMain}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <EmptyState
            title="No orders found"
            message={
              searchQuery
                ? "Try a different search term"
                : statusFilter !== 'all'
                ? `No ${statusFilter} orders`
                : "Create your first purchase order"
            }
            actionLabel={searchQuery ? "Clear Search" : "Create Order"}
            onAction={searchQuery ? () => setSearchQuery('') : () => {}}
          />
        }
        ListFooterComponent={
          loading && orders.length > 0 ? (
            <View style={styles.loadingFooter}>
              <LoadingSpinner size="small" />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  } as ViewStyle,
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  } as TextStyle,
  addButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  } as ViewStyle,
  addButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  } as TextStyle,
  filtersContainer: {
    backgroundColor: colors.surface.primary,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  } as ViewStyle,
  searchContainer: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
  } as ViewStyle,
  searchInput: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  } as TextStyle,
  statusTabsContent: {
    paddingHorizontal: spacing.base,
  } as ViewStyle,
  statusTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
  } as ViewStyle,
  statusTabActive: {
    backgroundColor: colors.primary[500],
  } as ViewStyle,
  statusTabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  } as TextStyle,
  statusTabTextActive: {
    color: colors.text.inverse,
  } as TextStyle,
  statusBadge: {
    marginLeft: spacing.xs,
    backgroundColor: colors.gray[200],
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    minWidth: 24,
    alignItems: 'center',
  } as ViewStyle,
  statusBadgeActive: {
    backgroundColor: colors.primary[400],
  } as ViewStyle,
  statusBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  } as TextStyle,
  statusBadgeTextActive: {
    color: colors.text.inverse,
  } as TextStyle,
  listContent: {
    padding: spacing.base,
    paddingBottom: 100,
  } as ViewStyle,
  orderCard: {
    marginBottom: spacing.md,
  } as ViewStyle,
  loadingFooter: {
    padding: spacing.lg,
    alignItems: 'center',
  } as ViewStyle,
  errorContainer: {
    backgroundColor: colors.error[50],
    padding: spacing.md,
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error[700],
    flex: 1,
  } as TextStyle,
  retryText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
    marginLeft: spacing.md,
  } as TextStyle,
});
