/**
 * Restaurant Merchant Dashboard
 * Real-time overview of today's orders, earnings, and key metrics
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, Typography } from '@/constants/DesignTokens';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { useNotification } from '@/contexts/NotificationContext';
import { OrderCard } from './components/OrderCard';
import { storageService } from '@/services/storage';
import { ordersService } from '@/services/api/orders';
import { format, isToday, parseISO } from 'date-fns';
import { logger } from '@/utils/logger';

const { width } = Dimensions.get('window');

interface DashboardOrder {
  id: string;
  orderNumber: string;
  status: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
  customerName: string;
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  createdAt: string;
  platform?: string;
}

interface EarningsSummary {
  todayRevenue: number;
  todayOrders: number;
  avgOrderValue: number;
  pendingOrders: number;
}

interface QuickStat {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  trend?: 'up' | 'down';
}

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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  storeName: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.error[500],
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  earningsCard: {
    backgroundColor: Colors.primary[500],
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: 16,
    padding: Spacing.lg,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  earningsDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  earningsAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    marginTop: Spacing.sm,
  },
  earningsStats: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.lg,
  },
  earningsStat: {
    flex: 1,
  },
  earningsStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  earningsStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionActionText: {
    fontSize: 14,
    color: Colors.primary[500],
    fontWeight: '600',
  },
  quickStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  quickStat: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  quickStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStatContent: {
    flex: 1,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  quickStatLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  ordersList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  emptyIcon: {
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  navigationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  navCard: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  navIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  navTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  navSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.success[50],
    gap: Spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success[500],
  },
  statusText: {
    fontSize: 12,
    color: Colors.success[700],
    fontWeight: '500',
  },
});

export default function RestaurantDashboard() {
  const insets = useSafeAreaInsets();
  const { merchant } = useAuth();
  const { isConnected } = useSocket();
  const { unreadCount } = useNotification();
  const [storeName, setStoreName] = useState('My Restaurant');
  const [storeId, setStoreId] = useState<string | null>(null);
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [earnings, setEarnings] = useState<EarningsSummary>({
    todayRevenue: 0,
    todayOrders: 0,
    avgOrderValue: 0,
    pendingOrders: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      const merchantData = await storageService.getMerchantData<{ storeName?: string; activeStoreId?: string }>();
      if (merchantData?.storeName) setStoreName(merchantData.storeName);

      const activeStoreId = merchantData?.activeStoreId || merchantData?.storeId || null;
      setStoreId(activeStoreId);

      if (activeStoreId) {
        // Fetch today's orders
        const result = await ordersService.getOrders({ storeId: activeStoreId, limit: 20 });
        const todayOrders = (result.orders || []).filter((order) => {
          if (!order.createdAt) return false;
          return isToday(parseISO(order.createdAt));
        });

        // Calculate earnings
        const todayRevenue = todayOrders.reduce((sum: number, order) => sum + (order.totalAmount || order.amount || 0), 0);
        const pendingCount = todayOrders.filter((o) => ['placed', 'confirmed', 'preparing'].includes(o.status)).length;

        setEarnings({
          todayRevenue,
          todayOrders: todayOrders.length,
          avgOrderValue: todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0,
          pendingOrders: pendingCount,
        });

        // Transform orders for display
        setOrders(todayOrders.slice(0, 5).map((order) => ({
          id: order._id || order.id,
          orderNumber: order.orderNumber || String(order._id || order.id).slice(-6).toUpperCase(),
          status: order.status,
          items: (order.items || []).map((item) => ({
            name: item.productName || item.name || 'Item',
            quantity: item.quantity || 1,
            price: item.price || 0,
          })),
          totalAmount: order.totalAmount || order.amount || 0,
          customerName: order.customerName || 'Guest',
          orderType: order.orderType || 'dine_in',
          createdAt: order.createdAt,
          platform: order.platform,
        })));
      }
    } catch (error) {
      logger.error('[Restaurant Dashboard] Failed to load data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadDashboardData();
  }, [loadDashboardData]);

  const quickStats: QuickStat[] = useMemo(() => [
    {
      label: 'Pending',
      value: earnings.pendingOrders,
      icon: 'time-outline',
      color: Colors.warning[500],
    },
    {
      label: 'Completed',
      value: earnings.todayOrders - earnings.pendingOrders,
      icon: 'checkmark-circle-outline',
      color: Colors.success[500],
    },
    {
      label: 'Dine-In',
      value: orders.filter(o => o.orderType === 'dine_in').length,
      icon: 'restaurant-outline',
      color: Colors.primary[500],
    },
    {
      label: 'Takeaway',
      value: orders.filter(o => o.orderType === 'takeaway').length,
      icon: 'takeout-outline',
      color: Colors.info[500],
    },
  ], [earnings, orders]);

  const navigationCards = [
    {
      title: 'Orders',
      subtitle: 'Manage all orders',
      icon: 'receipt-outline',
      color: Colors.primary[500],
      route: '/restaurant/orders',
    },
    {
      title: 'Menu',
      subtitle: 'Edit menu items',
      icon: 'restaurant-outline',
      color: Colors.success[500],
      route: '/restaurant/menu',
    },
    {
      title: 'Tables',
      subtitle: 'Table layout',
      icon: 'grid-outline',
      color: Colors.info[500],
      route: '/restaurant/tables',
    },
    {
      title: 'Reservations',
      subtitle: 'Bookings',
      icon: 'calendar-outline',
      color: Colors.warning[500],
      route: '/restaurant/reservations',
    },
    {
      title: 'Kitchen',
      subtitle: 'KDS view',
      icon: 'flame-outline',
      color: Colors.error[500],
      route: '/restaurant/kitchen',
    },
    {
      title: 'Earnings',
      subtitle: 'Revenue report',
      icon: 'analytics-outline',
      color: Colors.primary[600],
      route: '/reports',
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>{storeName}</Text>
              <Text style={styles.storeDate}>{format(new Date(), 'EEEE, MMM d')}</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push('/notifications')}
              >
                <Ionicons name="notifications-outline" size={24} color={Colors.text.primary} />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Connection Status */}
        <View style={styles.statusBar}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? Colors.success[500] : Colors.error[500] }]} />
          <Text style={styles.statusText}>
            {isConnected ? 'Live updates enabled' : 'Reconnecting...'}
          </Text>
        </View>

        {/* Earnings Card */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsHeader}>
            <View>
              <Text style={styles.earningsTitle}>Today's Earnings</Text>
              <Text style={styles.earningsDate}>{format(new Date(), 'MMM d, yyyy')}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/reports')}>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>View Details</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.earningsAmount}>
            {Colors.typography.price.display({ value: earnings.todayRevenue })}
          </Text>
          <View style={styles.earningsStats}>
            <View style={styles.earningsStat}>
              <Text style={styles.earningsStatLabel}>Orders</Text>
              <Text style={styles.earningsStatValue}>{earnings.todayOrders}</Text>
            </View>
            <View style={styles.earningsStat}>
              <Text style={styles.earningsStatLabel}>Avg. Order</Text>
              <Text style={styles.earningsStatValue}>
                {Colors.typography.price.display({ value: earnings.avgOrderValue })}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
        </View>
        <View style={styles.quickStats}>
          {quickStats.map((stat, index) => (
            <View key={index} style={styles.quickStat}>
              <View style={[styles.quickStatIcon, { backgroundColor: `${stat.color}15` }]}>
                <Ionicons name={stat.icon} size={20} color={stat.color} />
              </View>
              <View style={styles.quickStatContent}>
                <Text style={styles.quickStatValue}>{stat.value}</Text>
                <Text style={styles.quickStatLabel}>{stat.label}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Navigation Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
        </View>
        <View style={styles.navigationGrid}>
          {navigationCards.map((card, index) => (
            <TouchableOpacity
              key={index}
              style={styles.navCard}
              onPress={() => router.push(card.route as unknown)}
            >
              <View style={[styles.navIcon, { backgroundColor: `${card.color}15` }]}>
                <Ionicons name={card.icon as unknown} size={24} color={card.color} />
              </View>
              <Text style={styles.navTitle}>{card.title}</Text>
              <Text style={styles.navSubtitle}>{card.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Orders */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity
            style={styles.sectionAction}
            onPress={() => router.push('/restaurant/orders')}
          >
            <Text style={styles.sectionActionText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.primary[500]} />
          </TouchableOpacity>
        </View>

        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={Colors.gray[300]} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySubtitle}>Orders will appear here when customers place them</Text>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onPress={() => router.push(`/orders?orderId=${order.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
