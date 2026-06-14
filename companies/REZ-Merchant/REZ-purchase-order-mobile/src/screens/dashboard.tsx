import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePOStore } from '../contexts/store';
import {
  StatsCard,
  NetworkBanner,
  LoadingSpinner,
  StatusBadge,
} from '../components/common';
import { RootStackParamList, DashboardStats } from '../types';
import { format } from 'date-fns';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const DashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const {
    dashboardStats,
    fetchDashboardStats,
    isLoading,
    isRefreshing,
    isOnline,
    pendingSyncCount,
    purchaseOrders,
    fetchPurchaseOrders,
  } = usePOStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    await Promise.all([
      fetchDashboardStats(),
      fetchPurchaseOrders(undefined, 1, false),
    ]);
  }, [fetchDashboardStats, fetchPurchaseOrders]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (hours: number) => {
    if (hours < 24) {
      return `${Math.round(hours)} hrs`;
    }
    const days = Math.round(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  // Get recent POs requiring attention
  const recentPOs = purchaseOrders
    .filter(po => ['pending_approval', 'in_transit'].includes(po.status))
    .slice(0, 5);

  if (isLoading && !dashboardStats) {
    return <LoadingSpinner fullScreen message="Loading dashboard..." />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <NetworkBanner isOnline={isOnline} pendingCount={pendingSyncCount} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={loadData}
            colors={['#2196F3']}
            tintColor="#2196F3"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back!</Text>
            <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM dd')}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Main', { screen: 'Settings' } as unknown)}
          >
            <MaterialCommunityIcons name="account-circle" size={40} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Stats Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <StatsCard
              title="Total POs"
              value={dashboardStats?.totalPOs || 0}
              icon="file-document-multiple"
              color="#2196F3"
            />
            <StatsCard
              title="Pending Approval"
              value={dashboardStats?.pendingApproval || 0}
              icon="clock-outline"
              color="#FF9800"
            />
          </View>
          <View style={styles.statsGrid}>
            <StatsCard
              title="In Transit"
              value={dashboardStats?.inTransit || 0}
              icon="truck-delivery"
              color="#9C27B0"
            />
            <StatsCard
              title="Delivered"
              value={dashboardStats?.deliveredThisMonth || 0}
              icon="package-variant-closed-check"
              color="#4CAF50"
            />
          </View>
        </View>

        {/* Financial Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Summary</Text>
          <View style={styles.financialCard}>
            <View style={styles.financialRow}>
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>Total Value</Text>
                <Text style={styles.financialValue}>
                  {formatCurrency(dashboardStats?.totalValue || 0)}
                </Text>
              </View>
              <View style={styles.financialDivider} />
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>Pending</Text>
                <Text style={[styles.financialValue, { color: '#FF9800' }]}>
                  {formatCurrency(dashboardStats?.pendingValue || 0)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.performanceCard}>
            <View style={styles.performanceItem}>
              <View style={styles.performanceHeader}>
                <MaterialCommunityIcons name="clock-fast" size={20} color="#2196F3" />
                <Text style={styles.performanceLabel}>Avg. Delivery Time</Text>
              </View>
              <Text style={styles.performanceValue}>
                {formatTime(dashboardStats?.avgDeliveryTime || 0)}
              </Text>
            </View>
            <View style={styles.performanceItem}>
              <View style={styles.performanceHeader}>
                <MaterialCommunityIcons name="check-decagram" size={20} color="#4CAF50" />
                <Text style={styles.performanceLabel}>On-Time Rate</Text>
              </View>
              <Text style={[styles.performanceValue, { color: '#4CAF50' }]}>
                {(dashboardStats?.onTimeDeliveryRate || 0).toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Recent POs Requiring Attention */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Needs Attention</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Main' as unknown)}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentPOs.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="check-circle-outline" size={48} color="#4CAF50" />
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptyMessage}>No pending actions</Text>
            </View>
          ) : (
            recentPOs.map((po) => (
              <TouchableOpacity
                key={po.id}
                style={styles.recentPOCard}
                onPress={() => navigation.navigate('PODetail', { poId: po.id })}
              >
                <View style={styles.recentPOHeader}>
                  <Text style={styles.recentPONumber}>{po.poNumber}</Text>
                  <StatusBadge status={po.status} type="po" size="small" />
                </View>
                <View style={styles.recentPODetails}>
                  <Text style={styles.recentPOSupplier}>{po.supplier?.name}</Text>
                  <Text style={styles.recentPOAmount}>
                    {formatCurrency(po.grandTotal)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('CreatePO', {})}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#E3F2FD' }]}>
                <MaterialCommunityIcons name="plus" size={24} color="#2196F3" />
              </View>
              <Text style={styles.quickActionText}>New PO</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('SupplierSearch', {})}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#E8F5E9' }]}>
                <MaterialCommunityIcons name="domain" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.quickActionText}>Suppliers</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Main' as unknown)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#FFF3E0' }]}>
                <MaterialCommunityIcons name="chart-bar" size={24} color="#FF9800" />
              </View>
              <Text style={styles.quickActionText}>Reports</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Main' as unknown)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#F3E5F5' }]}>
                <MaterialCommunityIcons name="cog" size={24} color="#9C27B0" />
              </View>
              <Text style={styles.quickActionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  financialCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  financialRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  financialItem: {
    flex: 1,
    alignItems: 'center',
  },
  financialDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  financialLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  financialValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  performanceCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  performanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  performanceLabel: {
    fontSize: 14,
    color: '#666',
  },
  performanceValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  emptyCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 12,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  recentPOCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recentPOHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentPONumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  recentPODetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentPOSupplier: {
    fontSize: 13,
    color: '#666',
  },
  recentPOAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});

export default DashboardScreen;
