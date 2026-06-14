/**
 * Analytics Dashboard Overview Screen (V2)
 * Enhanced analytics dashboard matching V2 design reference
 * Features: 6 stat cards, daily performance, peak hours, top offers, customer segments, popular items
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { analyticsService } from '@/services/api/analytics';
import { useHasPermission } from '@/hooks/usePermissions';
import { useStore } from '@/contexts/StoreContext';
import { useMerchantCapabilities } from '@/hooks/useMerchantCapabilities';
import { StoreSelector } from '@/components/stores/StoreSelector';
import { DateRangePreset } from '@/types/analytics';
import { formatTime } from '@/utils/dateUtils';

// Import new analytics components
import {
  StatCard,
  DailyPerformanceChart,
  PeakHoursChart,
  TopOffersCard,
  CustomerSegmentsCard,
  PopularItemsCard,
} from '@/components/analytics';
import NetworkStatsCard from '@/components/dashboard/NetworkStatsCard';
import REZAttributionCard from '@/components/dashboard/REZAttributionCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AnalyticsOverviewScreen() {
  const [dateRange, setDateRange] = useState<DateRangePreset>('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Store context - get active store for filtering data
  const { activeStore } = useStore();
  const storeId = activeStore?._id;
  const { hasInventoryManagement } = useMerchantCapabilities();

  // Update analytics service with active store ID
  React.useEffect(() => {
    analyticsService.setActiveStore(storeId || null);
  }, [storeId]);

  // Permission check
  const canViewAnalytics = useHasPermission('analytics:view');
  const canViewRevenue = useHasPermission('analytics:view_revenue');

  // Fetch analytics overview
  const {
    data: overview,
    isLoading: overviewLoading,
    error,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ['analytics-overview', storeId, dateRange],
    queryFn: () => analyticsService.getAnalyticsOverview({ preset: dateRange }),
    enabled: canViewAnalytics && !!storeId,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch real-time metrics
  const { data: realTimeMetrics, refetch: refetchRealTime } = useQuery({
    queryKey: ['real-time-metrics', storeId],
    queryFn: () => analyticsService.getRealTimeMetrics(),
    enabled: canViewAnalytics && !!storeId,
    refetchInterval: 30000,
  });

  // Fetch sales by day (for daily performance chart)
  const {
    data: salesByDay,
    isLoading: salesByDayLoading,
    refetch: refetchSalesByDay,
  } = useQuery({
    queryKey: ['sales-by-day', storeId, dateRange],
    queryFn: () => analyticsService.getSalesByDay({ preset: dateRange }),
    enabled: canViewAnalytics && !!storeId,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch sales by time (for peak hours)
  const {
    data: salesByTime,
    isLoading: salesByTimeLoading,
    refetch: refetchSalesByTime,
  } = useQuery({
    queryKey: ['sales-by-time', storeId, dateRange],
    queryFn: () => analyticsService.getSalesByTime({ preset: dateRange }),
    enabled: canViewAnalytics && !!storeId,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch top offers
  const {
    data: topOffers,
    isLoading: topOffersLoading,
    refetch: refetchTopOffers,
  } = useQuery({
    queryKey: ['top-offers', storeId, dateRange],
    queryFn: () => analyticsService.getTopOffers({ preset: dateRange }),
    enabled: canViewAnalytics && !!storeId,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch customer segments
  const {
    data: customerSegments,
    isLoading: segmentsLoading,
    refetch: refetchSegments,
  } = useQuery({
    queryKey: ['customer-segments', storeId, dateRange],
    queryFn: () => analyticsService.getCustomerSegments({ preset: dateRange }),
    enabled: canViewAnalytics && !!storeId,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch top selling products
  const {
    data: topProducts,
    isLoading: productsLoading,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ['top-products', storeId, dateRange],
    queryFn: () => analyticsService.getTopSellingProducts({ preset: dateRange }),
    enabled: canViewAnalytics && !!storeId,
    staleTime: 5 * 60 * 1000,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchOverview(),
      refetchRealTime(),
      refetchSalesByDay(),
      refetchSalesByTime(),
      refetchTopOffers(),
      refetchSegments(),
      refetchProducts(),
    ]);
    setRefreshing(false);
  };

  const handleExportReport = () => {
    router.push('/analytics/export');
  };

  // Format helpers
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;
  const formatNumber = (value: number) => value.toLocaleString();

  // Date range options
  const dateRangeOptions: { key: DateRangePreset; label: string }[] = [
    { key: '7d', label: '7D' },
    { key: '30d', label: '30D' },
    { key: '90d', label: '90D' },
    { key: '1y', label: '1Y' },
  ];

  // Stat cards configuration
  const statCards = useMemo(() => {
    const cards = [];

    if (canViewRevenue) {
      cards.push({
        title: 'Revenue',
        value: formatCurrency(overview?.sales?.totalRevenue || 0),
        icon: 'cash' as const,
        color: '#10B981',
        growth: overview?.sales?.revenueGrowth,
      });
    }

    cards.push(
      {
        title: 'Orders',
        value: formatNumber(overview?.sales?.totalOrders || 0),
        icon: 'receipt' as const,
        color: '#3B82F6',
      },
      {
        title: 'Customers',
        value: formatNumber(overview?.customers?.totalCustomers || 0),
        icon: 'people' as const,
        color: '#8B5CF6',
      }
    );

    if (canViewRevenue) {
      cards.push({
        title: 'Avg Order',
        value: formatCurrency(overview?.sales?.avgOrderValue || 0),
        icon: 'calculator' as const,
        color: '#F59E0B',
      });
    }

    cards.push(
      {
        title: 'New Customers',
        value: formatNumber(overview?.customers?.newCustomers || 0),
        icon: 'person-add' as const,
        color: '#EAB308',
      },
      {
        title: 'Retention',
        value: `${(overview?.customers?.retentionRate || 0).toFixed(0)}%`,
        icon: 'repeat' as const,
        color: '#EC4899',
      }
    );

    return cards;
  }, [overview, canViewRevenue]);

  if (!canViewAnalytics) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <Ionicons name="lock-closed" size={48} color={Colors.light.textMuted} />
        <ThemedText style={styles.noAccessText}>
          You don't have permission to view analytics
        </ThemedText>
      </ThemedView>
    );
  }

  if (!storeId) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <Ionicons name="storefront-outline" size={48} color={Colors.light.textMuted} />
        <ThemedText style={styles.noAccessText}>Please select a store to view analytics</ThemedText>
      </ThemedView>
    );
  }

  if (overviewLoading && !overview) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <ThemedText style={styles.loadingText}>Loading analytics...</ThemedText>
      </ThemedView>
    );
  }

  {
    dataError && (
      <View style={{ backgroundColor: '#FEE2E2', padding: 12, borderRadius: 8, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="warning" size={18} color="#DC2626" />
          <ThemedText style={{ color: '#DC2626', fontSize: 14 }}>{dataError}</ThemedText>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle" size={48} color={Colors.light.error} />
        <ThemedText style={styles.errorText}>Failed to load analytics</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetchOverview()}>
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Store Selector Header */}
      <View style={styles.storeHeader}>
        <StoreSelector compact />
      </View>

      {/* REZ Revenue Attribution — full summary */}
      <REZAttributionCard />

      {/* REZ Network Impact */}
      <NetworkStatsCard />

      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleContainer}>
            <ThemedText style={styles.headerTitle}>Business Analytics</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              {activeStore?.name} | Last updated: {formatTime(realTimeMetrics?.lastUpdated)}
            </ThemedText>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <ThemedText style={styles.liveText}>Live</ThemedText>
            </View>
            <TouchableOpacity style={styles.exportButton} onPress={handleExportReport}>
              <Ionicons name="download-outline" size={18} color={Colors.light.primary} />
              <ThemedText style={styles.exportButtonText}>Export</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Range Selector */}
        <View style={styles.dateRangeContainer}>
          {dateRangeOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.dateRangeButton,
                dateRange === option.key && styles.dateRangeButtonActive,
              ]}
              onPress={() => setDateRange(option.key)}
            >
              <ThemedText
                style={[
                  styles.dateRangeText,
                  dateRange === option.key && styles.dateRangeTextActive,
                ]}
              >
                {option.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 6 Stat Cards Grid */}
      <View style={styles.statCardsSection}>
        <View style={styles.statCardsGrid}>
          {statCards.map((card, index) => (
            <View key={`${card.title}-${index}`} style={styles.statCardWrapper}>
              <StatCard
                title={card.title}
                value={card.value}
                icon={card.icon}
                color={card.color}
                growth={card.growth}
                compact={true}
              />
            </View>
          ))}
        </View>
      </View>

      {/* Daily Performance Chart Section */}
      <DailyPerformanceChart data={salesByDay?.data || []} isLoading={salesByDayLoading} />

      {/* Peak Hours Analysis */}
      <View style={styles.chartSection}>
        <PeakHoursChart
          data={salesByTime?.data || []}
          peakHours={salesByTime?.peakHours}
          isLoading={salesByTimeLoading}
        />
      </View>

      {/* Top Offers */}
      <View style={styles.chartSection}>
        <TopOffersCard
          offers={topOffers?.offers || []}
          isLoading={topOffersLoading}
          onViewAll={() => router.push('/analytics/offers')}
        />
      </View>

      {/* Customer Segments */}
      <View style={styles.chartSection}>
        <CustomerSegmentsCard
          segments={customerSegments?.segments || []}
          totalCustomers={customerSegments?.totalCustomers || 0}
          isLoading={segmentsLoading}
          onViewAll={() => router.push('/analytics/customers')}
        />
      </View>

      {/* Popular Items */}
      <View style={styles.chartSection}>
        <PopularItemsCard
          items={topProducts?.products || []}
          isLoading={productsLoading}
          onViewAll={() => router.push('/analytics/products')}
        />
      </View>

      {/* Quick Navigation */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Detailed Reports</ThemedText>
        <View style={styles.navGrid}>
          <TouchableOpacity
            style={styles.navCard}
            onPress={() => router.push('/analytics/sales-forecast')}
          >
            <View style={[styles.navIcon, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="trending-up" size={24} color="#16A34A" />
            </View>
            <ThemedText style={styles.navLabel}>Forecast</ThemedText>
          </TouchableOpacity>

          {hasInventoryManagement && (
            <TouchableOpacity
              style={styles.navCard}
              onPress={() => router.push('/analytics/inventory')}
            >
              <View style={[styles.navIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="cube" size={24} color="#D97706" />
              </View>
              <ThemedText style={styles.navLabel}>Inventory</ThemedText>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.navCard}
            onPress={() => router.push('/analytics/customers')}
          >
            <View style={[styles.navIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="people" size={24} color="#2563EB" />
            </View>
            <ThemedText style={styles.navLabel}>Customers</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navCard} onPress={() => router.push('/analytics/trends')}>
            <View style={[styles.navIcon, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="pulse" size={24} color="#7C3AED" />
            </View>
            <ThemedText style={styles.navLabel}>Trends</ThemedText>
          </TouchableOpacity>

          {/* GAP FIX #5 — Store Performance Comparison */}
          <TouchableOpacity
            style={styles.navCard}
            onPress={() => router.push('/analytics/stores-compare')}
          >
            <View style={[styles.navIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="bar-chart" size={24} color="#DC2626" />
            </View>
            <ThemedText style={styles.navLabel}>Stores</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navCard} onPress={() => router.push('/analytics/pnl')}>
            <View style={[styles.navIcon, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="receipt" size={24} color="#059669" />
            </View>
            <ThemedText style={styles.navLabel}>P&L</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navCard}
            onPress={() => router.push('/analytics/rez-summary')}
          >
            <View style={[styles.navIcon, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="analytics" size={24} color="#6366F1" />
            </View>
            <ThemedText style={styles.navLabel}>REZ Summary</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navCard}
            onPress={() => router.push('/analytics/comparison')}
          >
            <View style={[styles.navIcon, { backgroundColor: '#FDF4FF' }]}>
              <Ionicons name="git-compare-outline" size={24} color="#A855F7" />
            </View>
            <ThemedText style={styles.navLabel}>Compare Periods</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navCard}
            onPress={() => router.push('/analytics/peak-hours')}
          >
            <View style={[styles.navIcon, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="time-outline" size={24} color="#3B82F6" />
            </View>
            <ThemedText style={styles.navLabel}>Peak Hours</ThemedText>
          </TouchableOpacity>

          {hasInventoryManagement && (
            <TouchableOpacity
              style={styles.navCard}
              onPress={() => router.push('/products/inventory')}
            >
              <View style={[styles.navIcon, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="layers" size={24} color="#EA580C" />
              </View>
              <ThemedText style={styles.navLabel}>Stock Mgmt</ThemedText>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.navCard}
            onPress={() => router.push('/customers/insights')}
          >
            <View style={[styles.navIcon, { backgroundColor: '#E0F2F1' }]}>
              <Ionicons name="person-circle-outline" size={24} color="#00796B" />
            </View>
            <ThemedText style={styles.navLabel}>Cust. Insights</ThemedText>
          </TouchableOpacity>

          {hasInventoryManagement && (
            <TouchableOpacity
              style={styles.navCard}
              onPress={() => router.push('/products/stock-alerts')}
            >
              <View style={[styles.navIcon, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="alert-circle-outline" size={24} color="#F57C00" />
              </View>
              <ThemedText style={styles.navLabel}>Stock Alerts</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: Colors.light.textSecondary,
  },
  errorText: {
    marginTop: 12,
    color: Colors.light.error,
    textAlign: 'center',
  },
  noAccessText: {
    marginTop: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },

  // Store Selector Header
  storeHeader: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },

  // Header Section
  headerSection: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  liveText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  exportButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
  },

  // Date Range
  dateRangeContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 10,
    padding: 4,
  },
  dateRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dateRangeButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  dateRangeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  dateRangeTextActive: {
    color: '#FFFFFF',
  },

  // Stat Cards Section
  statCardsSection: {
    marginBottom: 16,
  },
  statCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  statCardWrapper: {
    width: '50%',
    padding: 4,
  },

  // Sections
  section: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  chartSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },

  // Navigation Grid
  navGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  navCard: {
    width: (SCREEN_WIDTH - 64 - 36) / 4,
    minWidth: 70,
    backgroundColor: Colors.light.backgroundSecondary,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  navIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  navLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
});
