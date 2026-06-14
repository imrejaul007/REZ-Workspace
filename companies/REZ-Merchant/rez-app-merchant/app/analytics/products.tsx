/**
 * Product Performance Analytics Screen
 * Top performers, profitability analysis, and product rankings
 * Desktop-friendly with ReZ Design System
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { analyticsService } from '@/services/api/analytics';
import { useHasPermission } from '@/hooks/usePermissions';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { ProductPerformance } from '@/types/analytics';

// ReZ Design System Colors
const REZ_COLORS = {
  primary: '#00C06A',
  navy: '#0B2240',
  gold: '#FFC857',
  white: '#FFFFFF',
  background: '#F8FAFC',
  cardBg: '#FFFFFF',
  textPrimary: '#0B2240',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  border: '#E2E8F0',
};

type PerformanceFilter = 'all' | 'top' | 'middle' | 'under';
type ViewTab = 'overview' | 'products' | 'categories';

export default function ProductPerformanceScreen() {
  const [filter, setFilter] = useState<PerformanceFilter>('all');
  const [activeTab, setActiveTab] = useState<ViewTab>('overview');
  const [refreshing, setRefreshing] = useState(false);

  const { isDesktop, isTablet } = useResponsiveLayout();
  const canViewAnalytics = useHasPermission('analytics:view');
  const canViewProducts = useHasPermission('products:view');

  const {
    data: performance,
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ['product-performance'],
    queryFn: () => analyticsService.getProductPerformance(),
    enabled: canViewAnalytics && canViewProducts,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  // Format growth - handle edge cases
  const formatGrowth = (value: number) => {
    if (!isFinite(value) || isNaN(value)) return 'New';
    if (value === 0) return 'No change';
    return `${Math.abs(value).toFixed(1)}% ${value > 0 ? 'growth' : 'decline'}`;
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent':
        return REZ_COLORS.success;
      case 'good':
        return REZ_COLORS.primary;
      case 'fair':
        return REZ_COLORS.warning;
      default:
        return REZ_COLORS.error;
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent':
        return 'star';
      case 'good':
        return 'checkmark-circle';
      case 'fair':
        return 'alert-circle';
      default:
        return 'warning';
    }
  };

  const getRankingBadge = (ranking: string) => {
    switch (ranking) {
      case 'top_tier':
        return { label: 'Top Tier', color: REZ_COLORS.success, icon: 'trophy' };
      case 'mid_tier':
        return { label: 'Mid Tier', color: REZ_COLORS.warning, icon: 'medal' };
      default:
        return { label: 'Needs Attention', color: REZ_COLORS.error, icon: 'trending-down' };
    }
  };

  // Safe access to byPerformance with fallbacks
  const getFilteredProducts = (): ProductPerformance[] => {
    if (!performance?.byPerformance) return [];

    const {
      topPerformers = [],
      middlePerformers = [],
      underperformers = [],
    } = performance.byPerformance;

    switch (filter) {
      case 'top':
        return topPerformers;
      case 'middle':
        return middlePerformers;
      case 'under':
        return underperformers;
      default:
        return [...topPerformers, ...middlePerformers, ...underperformers];
    }
  };

  // Get counts for filter badges
  const getCounts = () => {
    if (!performance?.byPerformance) {
      return { all: 0, top: 0, middle: 0, under: 0 };
    }
    const {
      topPerformers = [],
      middlePerformers = [],
      underperformers = [],
    } = performance.byPerformance;
    return {
      all: topPerformers.length + middlePerformers.length + underperformers.length,
      top: topPerformers.length,
      middle: middlePerformers.length,
      under: underperformers.length,
    };
  };

  const counts = getCounts();

  // Responsive content width
  const contentMaxWidth = isDesktop ? 1200 : isTablet ? 900 : undefined;
  const cardMaxWidth = isDesktop ? 380 : isTablet ? 340 : undefined;
  const productCardMaxWidth = isDesktop ? 580 : isTablet ? 440 : undefined;

  // Tab Component
  const TabButton = ({ tab, label, icon }: { tab: ViewTab; label: string; icon: string }) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons
        name={icon as unknown as keyof typeof Ionicons.glyphMap}
        size={18}
        color={activeTab === tab ? REZ_COLORS.white : REZ_COLORS.textSecondary}
      />
      <ThemedText style={[styles.tabButtonText, activeTab === tab && styles.tabButtonTextActive]}>
        {label}
      </ThemedText>
    </TouchableOpacity>
  );

  // Filter Chip Component
  const FilterChip = ({
    filterKey,
    label,
    count,
    icon,
  }: {
    filterKey: PerformanceFilter;
    label: string;
    count: number;
    icon: string;
  }) => (
    <TouchableOpacity
      style={[styles.filterChip, filter === filterKey && styles.filterChipActive]}
      onPress={() => setFilter(filterKey)}
    >
      <Ionicons
        name={icon as unknown as keyof typeof Ionicons.glyphMap}
        size={14}
        color={filter === filterKey ? REZ_COLORS.white : REZ_COLORS.textSecondary}
      />
      <ThemedText
        style={[styles.filterChipText, filter === filterKey && styles.filterChipTextActive]}
      >
        {label}
      </ThemedText>
      <View style={[styles.filterChipBadge, filter === filterKey && styles.filterChipBadgeActive]}>
        <ThemedText
          style={[
            styles.filterChipBadgeText,
            filter === filterKey && styles.filterChipBadgeTextActive,
          ]}
        >
          {count}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  // KPI Card Component - Improved layout to prevent text wrapping
  const KPICard = ({
    label,
    value,
    subtext,
    icon,
    iconColor,
  }: {
    label: string;
    value: string;
    subtext?: string;
    icon: string;
    iconColor: string;
  }) => (
    <View style={[styles.kpiCard, { maxWidth: Platform.OS === 'web' ? cardMaxWidth : undefined }]}>
      <View style={[styles.kpiIconContainer, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon as unknown as keyof typeof Ionicons.glyphMap} size={20} color={iconColor} />
      </View>
      <View style={styles.kpiContent}>
        <ThemedText style={styles.kpiLabel} numberOfLines={1}>
          {label}
        </ThemedText>
        <ThemedText style={styles.kpiValue} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </ThemedText>
        {subtext && (
          <ThemedText style={styles.kpiSubtext} numberOfLines={1}>
            {subtext}
          </ThemedText>
        )}
      </View>
    </View>
  );

  // Product Card Component
  const ProductCard = ({ product }: { product: ProductPerformance }) => {
    const healthColor = getHealthColor(product.performance?.health || 'fair');
    const rankingBadge = getRankingBadge(product.performance?.ranking || 'low_tier');

    return (
      <View
        style={[
          styles.productCard,
          {
            borderLeftColor: healthColor,
            maxWidth: Platform.OS === 'web' ? productCardMaxWidth : undefined,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.productHeader}>
          <View style={styles.productRankBadge}>
            <ThemedText style={styles.productRankText}>
              #{product.performance?.rank || '-'}
            </ThemedText>
          </View>
          <View style={styles.productInfo}>
            <ThemedText style={styles.productName} numberOfLines={1}>
              {product.productName || 'Unknown Product'}
            </ThemedText>
            <ThemedText style={styles.productMeta}>
              {product.category || 'Uncategorized'} • SKU: {product.sku || 'N/A'}
            </ThemedText>
          </View>
          <View style={[styles.healthBadge, { backgroundColor: `${healthColor}15` }]}>
            <Ionicons
              name={getHealthIcon(product.performance?.health || 'fair') as unknown as keyof typeof Ionicons.glyphMap}
              size={12}
              color={healthColor}
            />
            <ThemedText style={[styles.healthBadgeText, { color: healthColor }]}>
              {(product.performance?.health || 'N/A').toUpperCase()}
            </ThemedText>
          </View>
        </View>

        {/* Ranking Banner */}
        <View style={[styles.rankingBanner, { backgroundColor: `${rankingBadge.color}10` }]}>
          <Ionicons name={rankingBadge.icon as unknown as keyof typeof Ionicons.glyphMap} size={14} color={rankingBadge.color} />
          <ThemedText style={[styles.rankingBannerText, { color: rankingBadge.color }]}>
            {rankingBadge.label}
          </ThemedText>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <View style={styles.metricIconWrap}>
              <Ionicons name="cash-outline" size={14} color={REZ_COLORS.success} />
            </View>
            <View>
              <ThemedText style={styles.metricLabel}>Revenue</ThemedText>
              <ThemedText style={styles.metricValue}>
                {formatCurrency(product.sales?.revenue || 0)}
              </ThemedText>
            </View>
          </View>
          <View style={styles.metricItem}>
            <View style={styles.metricIconWrap}>
              <Ionicons name="cube-outline" size={14} color={REZ_COLORS.info} />
            </View>
            <View>
              <ThemedText style={styles.metricLabel}>Sold</ThemedText>
              <ThemedText style={styles.metricValue}>
                {product.sales?.quantity || 0} units
              </ThemedText>
            </View>
          </View>
          <View style={styles.metricItem}>
            <View style={styles.metricIconWrap}>
              <Ionicons name="layers-outline" size={14} color={REZ_COLORS.warning} />
            </View>
            <View>
              <ThemedText style={styles.metricLabel}>Stock</ThemedText>
              <ThemedText
                style={[
                  styles.metricValue,
                  product.inventory?.currentStock === 0 && { color: REZ_COLORS.error },
                ]}
              >
                {product.inventory?.currentStock != null
                  ? product.inventory.currentStock === 0
                    ? 'Out of stock'
                    : product.inventory.currentStock
                  : 'Unlimited'}
              </ThemedText>
            </View>
          </View>
          <View style={styles.metricItem}>
            <View style={styles.metricIconWrap}>
              <Ionicons
                name={product.customer?.avgRating ? 'star' : 'star-outline'}
                size={14}
                color={REZ_COLORS.gold}
              />
            </View>
            <View>
              <ThemedText style={styles.metricLabel}>Rating</ThemedText>
              <ThemedText style={styles.metricValue}>
                {product.customer?.avgRating
                  ? `${product.customer.avgRating.toFixed(1)} ★ (${product.customer.reviewCount || 0})`
                  : 'No reviews'}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.profitabilityRow}>
          <View style={styles.profitItem}>
            <ThemedText style={styles.profitLabel}>Avg Price</ThemedText>
            <ThemedText style={styles.profitValue}>
              {formatCurrency(product.sales?.avgUnitPrice || 0)}
            </ThemedText>
          </View>
          <View style={styles.profitDivider} />
          <View style={styles.profitItem}>
            <ThemedText style={styles.profitLabel}>Orders</ThemedText>
            <ThemedText style={styles.profitValue}>
              {product.customer?.uniqueBuyers || 0}
            </ThemedText>
          </View>
          <View style={styles.profitDivider} />
          <View style={styles.profitItem}>
            <ThemedText style={styles.profitLabel}>Est. Profit</ThemedText>
            <ThemedText style={[styles.profitValue, { color: REZ_COLORS.success }]}>
              {formatCurrency(product.profitability?.netProfit || 0)}
            </ThemedText>
          </View>
        </View>

        {/* Trend Indicator - Only show if there's meaningful trend data */}
        {product.sales?.trend !== undefined &&
          product.sales.trend !== 0 &&
          isFinite(product.sales.trend) && (
            <View
              style={[
                styles.trendIndicator,
                {
                  backgroundColor:
                    product.sales.trend > 0 ? `${REZ_COLORS.success}10` : `${REZ_COLORS.error}10`,
                },
              ]}
            >
              <Ionicons
                name={product.sales.trend > 0 ? 'trending-up' : 'trending-down'}
                size={14}
                color={product.sales.trend > 0 ? REZ_COLORS.success : REZ_COLORS.error}
              />
              <ThemedText
                style={[
                  styles.trendText,
                  { color: product.sales.trend > 0 ? REZ_COLORS.success : REZ_COLORS.error },
                ]}
              >
                {formatGrowth(product.sales.trend)} vs last period
              </ThemedText>
            </View>
          )}
      </View>
    );
  };

  // Category Card Component
  const CategoryCard = ({ category }: { category: unknown }) => (
    <View
      style={[styles.categoryCard, { maxWidth: Platform.OS === 'web' ? cardMaxWidth : undefined }]}
    >
      <View style={styles.categoryHeader}>
        <View style={styles.categoryIconWrap}>
          <Ionicons name="folder-open" size={18} color={REZ_COLORS.primary} />
        </View>
        <View style={styles.categoryInfo}>
          <ThemedText style={styles.categoryName} numberOfLines={1}>
            {category.category}
          </ThemedText>
          <ThemedText style={styles.categoryMeta}>
            {category.productCount} {category.productCount === 1 ? 'product' : 'products'} •{' '}
            {category.totalSales} {category.totalSales === 1 ? 'sale' : 'sales'}
          </ThemedText>
        </View>
        <View style={styles.categoryRevenueContainer}>
          <ThemedText style={styles.categoryRevenue}>
            {formatCurrency(category.totalRevenue)}
          </ThemedText>
          <ThemedText style={styles.categoryRevenueLabel}>revenue</ThemedText>
        </View>
      </View>
      {category.topProduct && (
        <View style={styles.topProductBanner}>
          <Ionicons name="trophy" size={14} color={REZ_COLORS.gold} />
          <ThemedText style={styles.topProductText} numberOfLines={1}>
            Best seller: {category.topProduct.productName}
          </ThemedText>
          <ThemedText style={styles.topProductRevenue}>
            {formatCurrency(category.topProduct.sales?.revenue || 0)}
          </ThemedText>
        </View>
      )}
    </View>
  );

  // Access Denied State
  if (!canViewAnalytics || !canViewProducts) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <View style={styles.errorIcon}>
          <Ionicons name="lock-closed" size={48} color={REZ_COLORS.error} />
        </View>
        <ThemedText style={styles.errorTitle}>Access Denied</ThemedText>
        <ThemedText style={styles.errorText}>
          You don't have permission to view product analytics.
        </ThemedText>
        <TouchableOpacity style={styles.backButtonLarge} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={REZ_COLORS.white} />
          <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  // Loading State
  if (isLoading && !performance) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={REZ_COLORS.primary} />
          <ThemedText style={styles.loadingText}>Analyzing product performance...</ThemedText>
          <ThemedText style={styles.loadingSubtext}>This may take a moment</ThemedText>
        </View>
      </ThemedView>
    );
  }

  // Error State
  if (error && !performance) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <View style={styles.errorIcon}>
          <Ionicons name="alert-circle" size={48} color={REZ_COLORS.error} />
        </View>
        <ThemedText style={styles.errorTitle}>Failed to Load Data</ThemedText>
        <ThemedText style={styles.errorText}>
          {error instanceof Error ? error.message : 'An error occurred while loading product data.'}
        </ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Ionicons name="refresh" size={20} color={REZ_COLORS.white} />
          <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const filteredProducts = getFilteredProducts();
  const categories = performance?.byCategory || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        Platform.OS === 'web' && { alignItems: 'center' },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[REZ_COLORS.primary]}
        />
      }
    >
      <ThemedView
        style={[styles.content, { maxWidth: Platform.OS === 'web' ? contentMaxWidth : undefined }]}
      >
        {/* Note: Header is handled by _layout.tsx, so we don't duplicate it here */}

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TabButton tab="overview" label="Overview" icon="grid-outline" />
          <TabButton tab="products" label="Products" icon="cube-outline" />
          <TabButton tab="categories" label="Categories" icon="pricetags-outline" />
        </View>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* KPI Cards */}
            <View style={styles.kpiGrid}>
              <KPICard
                label="Total Products"
                value={String(performance?.totalProducts || 0)}
                subtext={`${performance?.analyzedProducts || 0} analyzed`}
                icon="cube"
                iconColor={REZ_COLORS.primary}
              />
              <KPICard
                label="Total Revenue"
                value={formatCurrency(performance?.summary?.totalRevenue || 0)}
                subtext={`${performance?.summary?.totalSalesQty || 0} units sold`}
                icon="cash"
                iconColor={REZ_COLORS.success}
              />
              <KPICard
                label="Avg Revenue/Product"
                value={formatCurrency(performance?.summary?.avgProductRevenue || 0)}
                subtext={`${formatPercentage(performance?.summary?.avgMargin || 0)} avg margin`}
                icon="analytics"
                iconColor={REZ_COLORS.info}
              />
              <KPICard
                label="Top Category"
                value={performance?.summary?.topCategory || 'N/A'}
                subtext="Best performing"
                icon="trophy"
                iconColor={REZ_COLORS.gold}
              />
            </View>

            {/* Performance Breakdown */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Performance Breakdown</ThemedText>
              <View style={styles.breakdownGrid}>
                <View style={[styles.breakdownCard, { borderLeftColor: REZ_COLORS.success }]}>
                  <View style={styles.breakdownHeader}>
                    <Ionicons name="trending-up" size={20} color={REZ_COLORS.success} />
                    <ThemedText style={[styles.breakdownValue, { color: REZ_COLORS.success }]}>
                      {counts.top}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.breakdownLabel}>Top Performers</ThemedText>
                  <ThemedText style={styles.breakdownSubtext}>Exceeding expectations</ThemedText>
                </View>
                <View style={[styles.breakdownCard, { borderLeftColor: REZ_COLORS.warning }]}>
                  <View style={styles.breakdownHeader}>
                    <Ionicons name="remove" size={20} color={REZ_COLORS.warning} />
                    <ThemedText style={[styles.breakdownValue, { color: REZ_COLORS.warning }]}>
                      {counts.middle}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.breakdownLabel}>Middle Tier</ThemedText>
                  <ThemedText style={styles.breakdownSubtext}>Meeting targets</ThemedText>
                </View>
                <View style={[styles.breakdownCard, { borderLeftColor: REZ_COLORS.error }]}>
                  <View style={styles.breakdownHeader}>
                    <Ionicons name="trending-down" size={20} color={REZ_COLORS.error} />
                    <ThemedText style={[styles.breakdownValue, { color: REZ_COLORS.error }]}>
                      {counts.under}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.breakdownLabel}>Need Attention</ThemedText>
                  <ThemedText style={styles.breakdownSubtext}>Below expectations</ThemedText>
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => {
                  setActiveTab('products');
                  setFilter('top');
                }}
              >
                <Ionicons name="star" size={18} color={REZ_COLORS.gold} />
                <ThemedText style={styles.quickActionText}>View Top Performers</ThemedText>
                <Ionicons name="chevron-forward" size={16} color={REZ_COLORS.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => {
                  setActiveTab('products');
                  setFilter('under');
                }}
              >
                <Ionicons name="alert-circle" size={18} color={REZ_COLORS.error} />
                <ThemedText style={styles.quickActionText}>Review Underperformers</ThemedText>
                <Ionicons name="chevron-forward" size={16} color={REZ_COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <>
            {/* Filter Chips */}
            <View style={styles.filterChipsContainer}>
              <FilterChip filterKey="all" label="All" count={counts.all} icon="apps" />
              <FilterChip filterKey="top" label="Top" count={counts.top} icon="trending-up" />
              <FilterChip filterKey="middle" label="Middle" count={counts.middle} icon="remove" />
              <FilterChip
                filterKey="under"
                label="Needs Work"
                count={counts.under}
                icon="trending-down"
              />
            </View>

            {/* Products List */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Product Rankings</ThemedText>
                <ThemedText style={styles.sectionCount}>
                  {filteredProducts.length} products
                </ThemedText>
              </View>
              <View style={styles.productsGrid}>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <ProductCard key={product.productId} product={product} />
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIcon}>
                      <Ionicons name="cube-outline" size={48} color={REZ_COLORS.textMuted} />
                    </View>
                    <ThemedText style={styles.emptyTitle}>No Products Found</ThemedText>
                    <ThemedText style={styles.emptyText}>
                      {filter === 'all'
                        ? 'No product data available for analysis.'
                        : `No products in the "${filter}" category.`}
                    </ThemedText>
                    {filter !== 'all' && (
                      <TouchableOpacity style={styles.emptyButton} onPress={() => setFilter('all')}>
                        <ThemedText style={styles.emptyButtonText}>View All Products</ThemedText>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>
          </>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Performance by Category</ThemedText>
              <ThemedText style={styles.sectionCount}>{categories.length} categories</ThemedText>
            </View>
            <View style={styles.categoriesGrid}>
              {categories.length > 0 ? (
                categories.map((category, index) => (
                  <CategoryCard key={`${category.category}-${index}`} category={category} />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="pricetags-outline" size={48} color={REZ_COLORS.textMuted} />
                  </View>
                  <ThemedText style={styles.emptyTitle}>No Categories</ThemedText>
                  <ThemedText style={styles.emptyText}>
                    No category data available for analysis.
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: REZ_COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 20,
    width: '100%',
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: REZ_COLORS.white,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    ...Platform.select({
      web: { cursor: 'pointer' },
      default: {},
    }),
  },
  tabButtonActive: {
    backgroundColor: REZ_COLORS.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: REZ_COLORS.textSecondary,
  },
  tabButtonTextActive: {
    color: REZ_COLORS.white,
  },

  // KPI Grid - Better mobile layout
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    minWidth: 150,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: REZ_COLORS.white,
    padding: 12,
    borderRadius: 12,
  },
  kpiIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  kpiContent: {
    flex: 1,
    minWidth: 0, // Allows text truncation
  },
  kpiLabel: {
    fontSize: 11,
    color: REZ_COLORS.textSecondary,
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '700',
    color: REZ_COLORS.navy,
  },
  kpiSubtext: {
    fontSize: 10,
    color: REZ_COLORS.textMuted,
    marginTop: 2,
  },

  // Section
  section: {
    backgroundColor: REZ_COLORS.white,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: REZ_COLORS.navy,
  },
  sectionCount: {
    fontSize: 13,
    color: REZ_COLORS.textSecondary,
    backgroundColor: REZ_COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  // Breakdown Grid
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  breakdownCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: REZ_COLORS.background,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  breakdownLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: REZ_COLORS.textPrimary,
    marginBottom: 2,
  },
  breakdownSubtext: {
    fontSize: 12,
    color: REZ_COLORS.textMuted,
  },

  // Quick Actions
  quickActions: {
    backgroundColor: REZ_COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: REZ_COLORS.border,
    ...Platform.select({
      web: { cursor: 'pointer' },
      default: {},
    }),
  },
  quickActionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: REZ_COLORS.textPrimary,
  },

  // Filter Chips
  filterChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: REZ_COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: REZ_COLORS.border,
    ...Platform.select({
      web: { cursor: 'pointer' },
      default: {},
    }),
  },
  filterChipActive: {
    backgroundColor: REZ_COLORS.primary,
    borderColor: REZ_COLORS.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: REZ_COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: REZ_COLORS.white,
  },
  filterChipBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: REZ_COLORS.background,
  },
  filterChipBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  filterChipBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: REZ_COLORS.textSecondary,
  },
  filterChipBadgeTextActive: {
    color: REZ_COLORS.white,
  },

  // Products Grid
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },

  // Product Card
  productCard: {
    flex: 1,
    minWidth: 300,
    backgroundColor: REZ_COLORS.background,
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 16,
    gap: 12,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  productRankBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: REZ_COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: REZ_COLORS.white,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: REZ_COLORS.textPrimary,
  },
  productMeta: {
    fontSize: 12,
    color: REZ_COLORS.textMuted,
    marginTop: 2,
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  healthBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Ranking Banner
  rankingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 8,
  },
  rankingBannerText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricItem: {
    flex: 1,
    minWidth: 120,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: REZ_COLORS.white,
    padding: 10,
    borderRadius: 8,
  },
  metricIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: REZ_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: REZ_COLORS.textMuted,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '600',
    color: REZ_COLORS.textPrimary,
  },

  // Profitability Row
  profitabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: REZ_COLORS.white,
    padding: 12,
    borderRadius: 8,
  },
  profitItem: {
    alignItems: 'center',
  },
  profitLabel: {
    fontSize: 10,
    color: REZ_COLORS.textMuted,
    marginBottom: 4,
  },
  profitValue: {
    fontSize: 14,
    fontWeight: '600',
    color: REZ_COLORS.textPrimary,
  },
  profitDivider: {
    width: 1,
    height: 30,
    backgroundColor: REZ_COLORS.border,
  },

  // Trend Indicator
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Categories Grid
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  // Category Card
  categoryCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: REZ_COLORS.background,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: `${REZ_COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: REZ_COLORS.textPrimary,
  },
  categoryMeta: {
    fontSize: 12,
    color: REZ_COLORS.textMuted,
    marginTop: 2,
  },
  categoryRevenueContainer: {
    alignItems: 'flex-end',
  },
  categoryRevenue: {
    fontSize: 16,
    fontWeight: '700',
    color: REZ_COLORS.navy,
  },
  categoryRevenueLabel: {
    fontSize: 10,
    color: REZ_COLORS.textMuted,
  },
  topProductBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: REZ_COLORS.white,
    borderRadius: 8,
  },
  topProductText: {
    flex: 1,
    fontSize: 12,
    color: REZ_COLORS.textSecondary,
  },
  topProductRevenue: {
    fontSize: 12,
    fontWeight: '600',
    color: REZ_COLORS.success,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    minWidth: '100%',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: REZ_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: REZ_COLORS.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: REZ_COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: REZ_COLORS.primary,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: REZ_COLORS.white,
  },

  // Loading State
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: REZ_COLORS.textPrimary,
    marginTop: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: REZ_COLORS.textMuted,
  },

  // Error State
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${REZ_COLORS.error}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: REZ_COLORS.textPrimary,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: REZ_COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 300,
  },
  backButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: REZ_COLORS.primary,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: REZ_COLORS.white,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: REZ_COLORS.primary,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: REZ_COLORS.white,
  },
});
