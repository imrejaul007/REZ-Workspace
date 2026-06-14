/**
 * Analytics Tab - Dashboard View (Production Ready)
 * Premium analytics dashboard with ReZ Design System
 * Features: Store-specific data, 6 stat cards, daily performance, peak hours, top offers, customer segments, popular items
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/DesignTokens';
import { analyticsService } from '@/services/api/analytics';
import { useHasPermission, usePermissionState } from '@/hooks/usePermissions';
import { formatTime } from '@/utils/dateUtils';
import { DateRangePreset } from '@/types/analytics';
import { useStore } from '@/contexts/StoreContext';
import { queryKeys } from '@/hooks/queries/queryKeys';

// Import analytics components
import {
  DailyPerformanceChart,
  PeakHoursChart,
  TopOffersCard,
  CustomerSegmentsCard,
  PopularItemsCard,
} from '@/components/analytics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ReZ Design System Colors
const REZ_COLORS = {
  primary: '#00C06A',
  primaryDark: '#00A85C',
  navy: '#0B2240',
  navyLight: '#1A3A5C',
  gold: '#FFC857',
  purple: '#6366F1',
  purpleLight: '#8B5CF6',
  success: '#10B981',
  warning: Colors.warning[500],
  error: Colors.error[500],
  info: '#3B82F6',
  background: '#F8FAFC',
  cardBg: Colors.background.primary,
  textPrimary: '#0B2240',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
};

// Responsive breakpoints
const TABLET_WIDTH = 768;
const DESKTOP_WIDTH = 1024;

export default function AnalyticsTab() {
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangePreset>('30d');

  // Get active store from context
  const { activeStore, isLoading: storeLoading } = useStore();

  // Set active store in analytics service when it changes
  useEffect(() => {
    if (activeStore?._id) {
      analyticsService.setActiveStore(activeStore._id);
    } else {
      analyticsService.setActiveStore(null);
    }
  }, [activeStore?._id]);

  // Responsive calculations
  const isTablet = SCREEN_WIDTH >= TABLET_WIDTH;
  const isDesktop = SCREEN_WIDTH >= DESKTOP_WIDTH;

  // Permission checks
  const { hasPermission: canViewAnalytics, isLoading: permissionsLoading } =
    usePermissionState('analytics:view');
  const canViewRevenue = useHasPermission('analytics:view_revenue');

  // Fetch analytics overview
  const {
    data: overview,
    isLoading: overviewLoading,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: queryKeys.analytics.overview(dateRange, activeStore?._id ?? undefined),
    queryFn: () => analyticsService.getAnalyticsOverview({ preset: dateRange }),
    enabled: canViewAnalytics && !!activeStore?._id,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch real-time metrics
  const { data: realTimeMetrics, refetch: refetchRealTime } = useQuery({
    queryKey: queryKeys.analytics.realTimeMetrics(activeStore?._id ?? undefined),
    queryFn: () => analyticsService.getRealTimeMetrics(),
    enabled: canViewAnalytics && !!activeStore?._id,
    refetchInterval: 30000,
  });

  // Fetch sales by day (for daily performance chart)
  const {
    data: salesByDay,
    isLoading: salesByDayLoading,
    refetch: refetchSalesByDay,
  } = useQuery({
    queryKey: queryKeys.analytics.salesByDay(dateRange, activeStore?._id ?? undefined),
    queryFn: () => analyticsService.getSalesByDay({ preset: dateRange }),
    enabled: canViewAnalytics && !!activeStore?._id,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch sales by time (for peak hours)
  const {
    data: salesByTime,
    isLoading: salesByTimeLoading,
    refetch: refetchSalesByTime,
  } = useQuery({
    queryKey: queryKeys.analytics.salesByTime(dateRange, activeStore?._id ?? undefined),
    queryFn: () => analyticsService.getSalesByTime({ preset: dateRange }),
    enabled: canViewAnalytics && !!activeStore?._id,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch top offers
  const {
    data: topOffers,
    isLoading: topOffersLoading,
    refetch: refetchTopOffers,
  } = useQuery({
    queryKey: queryKeys.analytics.topOffers(dateRange, activeStore?._id ?? undefined),
    queryFn: () => analyticsService.getTopOffers({ preset: dateRange }),
    enabled: canViewAnalytics && !!activeStore?._id,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch customer segments
  const {
    data: customerSegments,
    isLoading: segmentsLoading,
    refetch: refetchSegments,
  } = useQuery({
    queryKey: queryKeys.analytics.customerSegments(dateRange, activeStore?._id ?? undefined),
    queryFn: () => analyticsService.getCustomerSegments({ preset: dateRange }),
    enabled: canViewAnalytics && !!activeStore?._id,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch top selling products
  const {
    data: topProducts,
    isLoading: productsLoading,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: queryKeys.analytics.topSellingProducts(dateRange, activeStore?._id ?? undefined),
    queryFn: () => analyticsService.getTopSellingProducts({ preset: dateRange }),
    enabled: canViewAnalytics && !!activeStore?._id,
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

  // Calculate average order value client-side if backend returns 0
  const calculatedAvgOrderValue = useMemo(() => {
    const backendAvg = overview?.sales?.avgOrderValue || 0;
    if (backendAvg > 0) return backendAvg;

    // Client-side calculation fallback
    const revenue = overview?.sales?.totalRevenue || 0;
    const orders = overview?.sales?.totalOrders || 0;
    return orders > 0 ? Math.round(revenue / orders) : 0;
  }, [overview?.sales?.avgOrderValue, overview?.sales?.totalRevenue, overview?.sales?.totalOrders]);

  // Date range options
  const dateRangeOptions: { key: DateRangePreset; label: string }[] = [
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '90 Days' },
  ];

  // Stat cards configuration with calculated values
  const statCards = useMemo(() => {
    const cards = [];

    if (canViewRevenue) {
      cards.push({
        title: 'Total Revenue',
        value: formatCurrency(overview?.sales?.totalRevenue || 0),
        icon: 'wallet' as const,
        color: REZ_COLORS.primary,
        gradientColors: ['#00C06A', '#00A85C'] as [string, string],
        growth: overview?.sales?.revenueGrowth,
      });
    }

    cards.push(
      {
        title: 'Total Orders',
        value: formatNumber(overview?.sales?.totalOrders || 0),
        icon: 'receipt' as const,
        color: REZ_COLORS.info,
        gradientColors: ['#3B82F6', '#2563EB'] as [string, string],
      },
      {
        title: 'Customers',
        value: formatNumber(overview?.customers?.totalCustomers || 0),
        icon: 'people' as const,
        color: REZ_COLORS.purple,
        gradientColors: ['#6366F1', '#4F46E5'] as [string, string],
      }
    );

    if (canViewRevenue) {
      cards.push({
        title: 'Avg Order Value',
        value: formatCurrency(calculatedAvgOrderValue),
        icon: 'analytics' as const,
        color: REZ_COLORS.gold,
        gradientColors: ['#FFC857', '#F59E0B'] as [string, string],
      });
    }

    cards.push(
      {
        title: 'New Customers',
        value: formatNumber(overview?.customers?.newCustomers || 0),
        icon: 'person-add' as const,
        color: REZ_COLORS.success,
        gradientColors: ['#10B981', '#059669'] as [string, string],
      },
      {
        title: 'Retention Rate',
        value: `${(overview?.customers?.retentionRate || 0).toFixed(0)}%`,
        icon: 'repeat' as const,
        color: '#EC4899',
        gradientColors: ['#EC4899', '#DB2777'] as [string, string],
      },
      {
        title: 'Student Redemptions',
        value: formatNumber((overview as unknown as { segmentBreakdown?: { student?: number } })?.segmentBreakdown?.student || 0),
        icon: 'school' as const,
        color: '#7C3AED',
        gradientColors: ['#7C3AED', '#6366F1'] as [string, string],
      },
      {
        title: 'Employee Redemptions',
        value: formatNumber((overview as unknown as { segmentBreakdown?: { corporate?: number } })?.segmentBreakdown?.corporate || 0),
        icon: 'briefcase' as const,
        color: '#1a3a52',
        gradientColors: ['#1a3a52', '#2A5577'] as [string, string],
      }
    );

    return cards;
  }, [overview, canViewRevenue, calculatedAvgOrderValue]);

  // Calculate stat card width based on screen size
  const getStatCardWidth = () => {
    if (isDesktop) {
      return (SCREEN_WIDTH - 64 - 50) / 6; // 6 cards in a row
    } else if (isTablet) {
      return (SCREEN_WIDTH - 48 - 24) / 3; // 3 cards per row
    } else {
      return (SCREEN_WIDTH - 48 - 12) / 2; // 2 cards per row
    }
  };

  if (permissionsLoading || storeLoading || (overviewLoading && !overview)) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={REZ_COLORS.primary} />
          <ThemedText style={styles.loadingText}>Loading analytics...</ThemedText>
          <ThemedText style={styles.loadingSubtext}>
            {storeLoading ? 'Fetching store data...' : 'Processing metrics...'}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!canViewAnalytics) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <View style={styles.noAccessContainer}>
          <View style={styles.noAccessIconWrapper}>
            <Ionicons name="lock-closed" size={48} color={REZ_COLORS.textMuted} />
          </View>
          <ThemedText style={styles.noAccessTitle}>Access Restricted</ThemedText>
          <ThemedText style={styles.noAccessText}>
            You don't have permission to view analytics. Contact your administrator for access.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!activeStore) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <View style={styles.noAccessContainer}>
          <View style={styles.noAccessIconWrapper}>
            <Ionicons name="storefront-outline" size={48} color={REZ_COLORS.textMuted} />
          </View>
          <ThemedText style={styles.noAccessTitle}>No Store Selected</ThemedText>
          <ThemedText style={styles.noAccessText}>
            Please select a store to view its analytics data.
          </ThemedText>
          <TouchableOpacity style={styles.selectStoreButton} onPress={() => router.push('/stores')}>
            <ThemedText style={styles.selectStoreButtonText}>Select Store</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[REZ_COLORS.primary]}
          tintColor={REZ_COLORS.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Premium Header with Gradient */}
      <LinearGradient
        colors={[REZ_COLORS.navy, REZ_COLORS.navyLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.headerTitleSection}>
              <ThemedText style={styles.headerTitle}>Business Analytics</ThemedText>
              <View style={styles.storeBadge}>
                <Ionicons name="storefront" size={12} color={REZ_COLORS.primary} />
                <ThemedText style={styles.storeBadgeText} numberOfLines={1}>
                  {activeStore.name}
                </ThemedText>
              </View>
            </View>
            <View style={styles.headerActions}>
              {realTimeMetrics && (
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <ThemedText style={styles.liveText}>Live</ThemedText>
                </View>
              )}
              <TouchableOpacity style={styles.exportButton} onPress={handleExportReport}>
                <Ionicons name="download-outline" size={16} color={Colors.text.inverse} />
                <ThemedText style={styles.exportButtonText}>Export</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Last Updated */}
          <ThemedText style={styles.lastUpdated}>
            Last updated: {formatTime(realTimeMetrics?.lastUpdated)}
          </ThemedText>

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
      </LinearGradient>

      {/* Key Metrics Section */}
      <View style={styles.metricsSection}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Key Metrics</ThemedText>
          <View style={styles.periodBadge}>
            <Ionicons name="calendar-outline" size={12} color={REZ_COLORS.textSecondary} />
            <ThemedText style={styles.periodBadgeText}>
              {dateRange === '7d'
                ? 'Last 7 days'
                : dateRange === '30d'
                  ? 'Last 30 days'
                  : 'Last 90 days'}
            </ThemedText>
          </View>
        </View>

        {/* Stat Cards Grid */}
        <View style={styles.statCardsContainer}>
          {statCards.map((card, index) => (
            <View
              key={`${card.title}-${index}`}
              style={[styles.statCardWrapper, { width: getStatCardWidth() }]}
            >
              <LinearGradient
                colors={card.gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statCard}
              >
                <View style={styles.statCardIconWrapper}>
                  <Ionicons name={card.icon} size={20} color="rgba(255,255,255,0.9)" />
                </View>
                <ThemedText style={styles.statCardValue}>{card.value}</ThemedText>
                <ThemedText style={styles.statCardTitle}>{card.title}</ThemedText>
                {card.growth !== undefined && (
                  <View
                    style={[
                      styles.growthBadge,
                      card.growth >= 0 ? styles.growthPositive : styles.growthNegative,
                    ]}
                  >
                    <Ionicons
                      name={card.growth >= 0 ? 'trending-up' : 'trending-down'}
                      size={10}
                      color={Colors.text.inverse}
                    />
                    <ThemedText style={styles.growthText}>
                      {card.growth >= 0 ? '+' : ''}
                      {card.growth.toFixed(1)}%
                    </ThemedText>
                  </View>
                )}
              </LinearGradient>
            </View>
          ))}
        </View>
      </View>

      {/* Daily Performance Chart Section */}
      <View style={styles.section}>
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleRow}>
              <Ionicons name="bar-chart" size={18} color={REZ_COLORS.primary} />
              <ThemedText style={styles.chartTitle}>Daily Performance</ThemedText>
            </View>
            <TouchableOpacity
              style={styles.viewMoreButton}
              onPress={() => router.push('/analytics/trends')}
            >
              <ThemedText style={styles.viewMoreText}>View More</ThemedText>
              <Ionicons name="chevron-forward" size={14} color={REZ_COLORS.primary} />
            </TouchableOpacity>
          </View>
          <DailyPerformanceChart data={salesByDay?.data || []} isLoading={salesByDayLoading} />
        </View>
      </View>

      {/* Two Column Layout: Peak Hours + Top Offers */}
      <View style={[styles.twoColumnSection, !isTablet && styles.stackedSection]}>
        <View style={[styles.columnCard, !isTablet && styles.fullWidthCard]}>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View style={styles.chartTitleRow}>
                <Ionicons name="time" size={18} color={REZ_COLORS.purple} />
                <ThemedText style={styles.chartTitle}>Peak Hours</ThemedText>
              </View>
            </View>
            <PeakHoursChart
              data={salesByTime?.data || []}
              peakHours={salesByTime?.peakHours}
              isLoading={salesByTimeLoading}
            />
          </View>
        </View>
        <View style={[styles.columnCard, !isTablet && styles.fullWidthCard]}>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View style={styles.chartTitleRow}>
                <Ionicons name="pricetag" size={18} color={REZ_COLORS.gold} />
                <ThemedText style={styles.chartTitle}>Top Offers</ThemedText>
              </View>
              <TouchableOpacity
                style={styles.viewMoreButton}
                onPress={() => router.push('/analytics/offers')}
              >
                <ThemedText style={styles.viewMoreText}>View All</ThemedText>
                <Ionicons name="chevron-forward" size={14} color={REZ_COLORS.primary} />
              </TouchableOpacity>
            </View>
            <TopOffersCard
              offers={topOffers?.offers || []}
              isLoading={topOffersLoading}
              onViewAll={() => router.push('/analytics/offers')}
            />
          </View>
        </View>
      </View>

      {/* Two Column Layout: Customer Segments + Popular Items */}
      <View style={[styles.twoColumnSection, !isTablet && styles.stackedSection]}>
        <View style={[styles.columnCard, !isTablet && styles.fullWidthCard]}>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View style={styles.chartTitleRow}>
                <Ionicons name="people" size={18} color={REZ_COLORS.info} />
                <ThemedText style={styles.chartTitle}>Customer Segments</ThemedText>
              </View>
              <TouchableOpacity
                style={styles.viewMoreButton}
                onPress={() => router.push('/analytics/customers')}
              >
                <ThemedText style={styles.viewMoreText}>Details</ThemedText>
                <Ionicons name="chevron-forward" size={14} color={REZ_COLORS.primary} />
              </TouchableOpacity>
            </View>
            <CustomerSegmentsCard
              segments={customerSegments?.segments || []}
              totalCustomers={customerSegments?.totalCustomers || 0}
              isLoading={segmentsLoading}
              onViewAll={() => router.push('/analytics/customers')}
            />
          </View>
        </View>
        <View style={[styles.columnCard, !isTablet && styles.fullWidthCard]}>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View style={styles.chartTitleRow}>
                <Ionicons name="trending-up" size={18} color={REZ_COLORS.success} />
                <ThemedText style={styles.chartTitle}>Popular Items</ThemedText>
              </View>
              <TouchableOpacity
                style={styles.viewMoreButton}
                onPress={() => router.push('/analytics/products')}
              >
                <ThemedText style={styles.viewMoreText}>View All</ThemedText>
                <Ionicons name="chevron-forward" size={14} color={REZ_COLORS.primary} />
              </TouchableOpacity>
            </View>
            <PopularItemsCard
              items={topProducts?.products || []}
              isLoading={productsLoading}
              onViewAll={() => router.push('/analytics/products')}
            />
          </View>
        </View>
      </View>

      {/* View Full Analytics Button */}
      <TouchableOpacity
        style={styles.fullAnalyticsButton}
        onPress={() => router.push('/analytics')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[REZ_COLORS.purple, REZ_COLORS.purpleLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.fullAnalyticsGradient}
        >
          <Ionicons name="analytics" size={20} color={Colors.text.inverse} />
          <ThemedText style={styles.fullAnalyticsText}>View Full Analytics Dashboard</ThemedText>
          <Ionicons name="arrow-forward" size={18} color={Colors.text.inverse} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Footer Spacing */}
      <View style={styles.footerSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: REZ_COLORS.background,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Loading States
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: REZ_COLORS.textPrimary,
  },
  loadingSubtext: {
    marginTop: 4,
    fontSize: 13,
    color: REZ_COLORS.textSecondary,
  },

  // No Access / No Store States
  noAccessContainer: {
    alignItems: 'center',
    padding: 40,
    maxWidth: 320,
  },
  noAccessIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${REZ_COLORS.textMuted}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  noAccessTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: REZ_COLORS.textPrimary,
    marginBottom: 8,
  },
  noAccessText: {
    fontSize: 14,
    color: REZ_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  selectStoreButton: {
    marginTop: 24,
    backgroundColor: REZ_COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  selectStoreButtonText: {
    color: Colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },

  // Header
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 0 : 8,
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    gap: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitleSection: {
    flex: 1,
    gap: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text.inverse,
    letterSpacing: -0.5,
  },
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  storeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.inverse,
    maxWidth: 150,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: REZ_COLORS.success,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: REZ_COLORS.success,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  exportButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  lastUpdated: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },

  // Date Range
  dateRangeContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 4,
    alignSelf: 'flex-start',
  },
  dateRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dateRangeButtonActive: {
    backgroundColor: Colors.background.primary,
  },
  dateRangeText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  dateRangeTextActive: {
    color: REZ_COLORS.navy,
  },

  // Metrics Section
  metricsSection: {
    padding: 16,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: REZ_COLORS.textPrimary,
  },
  periodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${REZ_COLORS.textSecondary}10`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  periodBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: REZ_COLORS.textSecondary,
  },

  // Stat Cards
  statCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCardWrapper: {
    // Width set dynamically
  },
  statCard: {
    padding: 14,
    borderRadius: 16,
    minHeight: 110,
  },
  statCardIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.inverse,
    marginBottom: 2,
  },
  statCardTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 8,
    gap: 2,
  },
  growthPositive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  growthNegative: {
    backgroundColor: 'rgba(239,68,68,0.3)',
  },
  growthText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text.inverse,
  },

  // Sections
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },

  // Chart Cards
  chartCard: {
    backgroundColor: REZ_COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      },
    }),
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: REZ_COLORS.textPrimary,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: REZ_COLORS.primary,
  },

  // Two Column Layout
  twoColumnSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  stackedSection: {
    flexDirection: 'column',
  },
  columnCard: {
    flex: 1,
  },
  fullWidthCard: {
    flex: 0,
    width: '100%',
    marginBottom: 12,
  },

  // Full Analytics Button
  fullAnalyticsButton: {
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
  },
  fullAnalyticsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  fullAnalyticsText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.inverse,
  },

  // Footer
  footerSpacer: {
    height: 24,
  },
});
