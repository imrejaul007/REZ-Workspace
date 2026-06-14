/**
 * Restaurant Orders Management
 * Real-time order list with filtering and status management
 */

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  TextInput,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography } from '@/constants/DesignTokens';
import { OrderCard } from './components/OrderCard';
import { storageService } from '@/services/storage';
import { ordersService } from '@/services/api/orders';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '@/config/api';
import { format, parseISO, isToday } from 'date-fns';
import { logger } from '@/utils/logger';

interface Order {
  id: string;
  _id?: string;
  orderNumber: string;
  status: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    specialInstructions?: string;
  }>;
  totalAmount: number;
  customerName: string;
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  tableNumber?: string;
  createdAt: string;
  platform?: string;
  paymentStatus?: string;
}

type FilterType = 'all' | 'new' | 'preparing' | 'ready' | 'completed';
type SortType = 'newest' | 'oldest' | 'amount_high' | 'amount_low';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  header: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    color: Colors.text.primary,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    marginRight: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.primary[500],
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  countBadge: {
    backgroundColor: Colors.error[500],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    paddingHorizontal: 4,
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  ordersList: {
    paddingHorizontal: Spacing.lg,
  },
  orderItem: {
    marginBottom: Spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.gray[100],
    borderRadius: 8,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  summaryText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.primary,
    borderRadius: 8,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
  },
});

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  placed: { label: 'New', color: Colors.success[500] },
  confirmed: { label: 'Confirmed', color: Colors.info[500] },
  preparing: { label: 'Preparing', color: Colors.warning[500] },
  ready: { label: 'Ready', color: Colors.primary[500] },
  dispatched: { label: 'Dispatched', color: Colors.primary[600] },
  delivered: { label: 'Delivered', color: Colors.success[600] },
  cancelled: { label: 'Cancelled', color: Colors.error[500] },
};

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'completed', label: 'Completed' },
];

const SORT_OPTIONS: { key: SortType; label: string }[] = [
  { key: 'newest', label: 'Newest First' },
  { key: 'oldest', label: 'Oldest First' },
  { key: 'amount_high', label: 'Highest Amount' },
  { key: 'amount_low', label: 'Lowest Amount' },
];

export default function RestaurantOrders() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    revenue: 0,
  });

  const loadOrders = useCallback(async () => {
    try {
      const merchantData = await storageService.getMerchantData<{ activeStoreId?: string }>();
      const storeId = merchantData?.activeStoreId || merchantData?.storeId;

      if (!storeId) {
        logger.warn('[Orders] No store ID found');
        return;
      }

      const [placed, preparing, ready, delivered] = await Promise.allSettled([
        ordersService.getOrders({ storeId, status: 'placed', limit: 100 }),
        ordersService.getOrders({ storeId, status: 'preparing', limit: 100 }),
        ordersService.getOrders({ storeId, status: 'ready', limit: 100 }),
        ordersService.getOrders({ storeId, status: 'delivered', limit: 50 }),
      ]);

      const allOrders: Order[] = [
        ...(placed.status === 'fulfilled' ? placed.value.orders : []),
        ...(preparing.status === 'fulfilled' ? preparing.value.orders : []),
        ...(ready.status === 'fulfilled' ? ready.value.orders : []),
        ...(delivered.status === 'fulfilled' ? delivered.value.orders : []),
      ].map((order) => ({
        id: order._id || order.id,
        _id: order._id,
        orderNumber: order.orderNumber || String(order._id || order.id).slice(-6).toUpperCase(),
        status: order.status,
        items: (order.items || []).map((item) => ({
          name: item.productName || item.name || 'Item',
          quantity: item.quantity || 1,
          price: item.price || 0,
          specialInstructions: item.specialInstructions || item.notes,
        })),
        totalAmount: order.totalAmount || order.amount || 0,
        customerName: order.customerName || 'Guest',
        orderType: order.orderType || 'dine_in',
        tableNumber: order.tableNumber || order.diningDetails?.tableNumber,
        createdAt: order.createdAt,
        platform: order.platform,
        paymentStatus: order.paymentStatus,
      }));

      // Calculate stats
      const pending = allOrders.filter(o => ['placed', 'confirmed', 'preparing'].includes(o.status)).length;
      const completed = allOrders.filter(o => ['delivered', 'dispatched'].includes(o.status)).length;
      const revenue = allOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      setStats({
        total: allOrders.length,
        pending,
        completed,
        revenue,
      });

      setOrders(allOrders);
    } catch (error) {
      logger.error('[Orders] Failed to load orders:', error);
      Alert.alert('Error', 'Failed to load orders. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initialize socket connection for real-time updates
  useEffect(() => {
    const initializeSocket = async () => {
      const authToken = await storageService.getAuthToken();
      const merchantData = await storageService.getMerchantData<{ activeStoreId?: string }>();
      const storeId = merchantData?.activeStoreId;

      if (!authToken || !storeId || !API_CONFIG.SOCKET_URL) return;

      socketRef.current = io(`${API_CONFIG.SOCKET_URL}/orders`, {
        auth: { token: authToken },
        transports: ['websocket'],
      });

      socketRef.current.on('connect', () => {
        socketRef.current?.emit('join-store', { storeId, token: authToken });
        logger.debug('[Orders] Socket connected');
      });

      socketRef.current.on('new-order', (data) => {
        const newOrder: Order = {
          id: data._id || data.id,
          _id: data._id,
          orderNumber: data.orderNumber,
          status: data.status,
          items: (data.items || []).map((item) => ({
            name: item.productName || item.name,
            quantity: item.quantity || 1,
            price: item.price || 0,
          })),
          totalAmount: data.totalAmount || data.amount || 0,
          customerName: data.customerName || 'Guest',
          orderType: data.orderType,
          tableNumber: data.tableNumber,
          createdAt: data.createdAt,
          platform: data.platform,
        };
        setOrders(prev => [newOrder, ...prev]);
      });

      socketRef.current.on('order-updated', (data) => {
        setOrders(prev =>
          prev.map(order =>
            order.id === (data.orderId || data.id)
              ? { ...order, status: data.status }
              : order
          )
        );
      });

      socketRef.current.on('disconnect', () => {
        logger.debug('[Orders] Socket disconnected');
      });

      return () => {
        socketRef.current?.disconnect();
      };
    };

    initializeSocket();
    loadOrders();
  }, [loadOrders]);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...orders];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        order =>
          order.orderNumber.toLowerCase().includes(query) ||
          order.customerName.toLowerCase().includes(query) ||
          order.tableNumber?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (activeFilter !== 'all') {
      if (activeFilter === 'new') {
        result = result.filter(o => ['placed', 'confirmed'].includes(o.status));
      } else if (activeFilter === 'preparing') {
        result = result.filter(o => o.status === 'preparing');
      } else if (activeFilter === 'ready') {
        result = result.filter(o => o.status === 'ready');
      } else if (activeFilter === 'completed') {
        result = result.filter(o => ['delivered', 'dispatched', 'cancelled'].includes(o.status));
      }
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'amount_high':
          return (b.totalAmount || 0) - (a.totalAmount || 0);
        case 'amount_low':
          return (a.totalAmount || 0) - (b.totalAmount || 0);
        default:
          return 0;
      }
    });

    setFilteredOrders(result);
  }, [orders, searchQuery, activeFilter, sortBy]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadOrders();
  }, [loadOrders]);

  const handleOrderPress = useCallback((order: Order) => {
    router.push(`/orders?orderId=${order.id}`);
  }, [router]);

  const getFilterCount = (filter: FilterType): number => {
    switch (filter) {
      case 'new':
        return orders.filter(o => ['placed', 'confirmed'].includes(o.status)).length;
      case 'preparing':
        return orders.filter(o => o.status === 'preparing').length;
      case 'ready':
        return orders.filter(o => o.status === 'ready').length;
      case 'completed':
        return orders.filter(o => ['delivered', 'dispatched', 'cancelled'].includes(o.status)).length;
      default:
        return orders.length;
    }
  };

  const renderOrder = useCallback(({ item }: { item: Order }) => (
    <View style={styles.orderItem}>
      <OrderCard
        order={item}
        onPress={() => handleOrderPress(item)}
        showStatus
      />
    </View>
  ), [handleOrderPress]);

  const renderHeader = () => (
    <>
      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.warning[500] }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.success[500] }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{Colors.typography.price.display({ value: stats.revenue })}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>
          {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
        </Text>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortMenu(!showSortMenu)}
        >
          <Ionicons name="swap-vertical" size={16} color={Colors.text.secondary} />
          <Text style={styles.sortButtonText}>
            {SORT_OPTIONS.find(o => o.key === sortBy)?.label}
          </Text>
          <Ionicons name="chevron-down" size={14} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Sort Menu */}
      {showSortMenu && (
        <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.md }}>
          {SORT_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.key}
              style={{
                paddingVertical: Spacing.sm,
                backgroundColor: sortBy === option.key ? Colors.primary[50] : 'transparent',
                borderRadius: 8,
                paddingHorizontal: Spacing.md,
              }}
              onPress={() => {
                setSortBy(option.key);
                setShowSortMenu(false);
              }}
            >
              <Text style={{
                fontSize: 14,
                color: sortBy === option.key ? Colors.primary[500] : Colors.text.primary,
                fontWeight: sortBy === option.key ? '600' : '400',
              }}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Orders</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push('/restaurant/kitchen')}
            >
              <Ionicons name="flame-outline" size={24} color={Colors.primary[500]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.text.tertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by order # or customer..."
            placeholderTextColor={Colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
        {FILTER_OPTIONS.map(filter => {
          const count = getFilterCount(filter.key);
          const isActive = activeFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {filter.label}
              </Text>
              {count > 0 && (
                <View style={[styles.countBadge, isActive && { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                  <Text style={[styles.countBadgeText, isActive && { color: '#fff' }]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.ordersList, { paddingBottom: insets.bottom + 100 }]}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={Colors.gray[300]} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Orders will appear here when customers place them'}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      />
    </View>
  );
}

// Import ScrollView for horizontal scroll
import { ScrollView } from 'react-native';
