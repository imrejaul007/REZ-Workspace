/**
 * Inventory Analytics Screen
 * Stockout predictions, reorder recommendations, and inventory risk management
 * Production-ready with ReZ Design System and responsive layout
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
import { useQuery } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { analyticsService } from '@/services/api/analytics';
import { useHasPermission } from '@/hooks/usePermissions';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { router } from 'expo-router';
import { StockoutPrediction } from '@/types/analytics';

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

type RiskFilter = 'all' | 'high' | 'medium' | 'safe';
type ViewTab = 'overview' | 'products' | 'actions';

export default function InventoryAnalyticsScreen() {
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [activeTab, setActiveTab] = useState<ViewTab>('overview');
  const [refreshing, setRefreshing] = useState(false);

  const { isDesktop, isTablet } = useResponsiveLayout();
  const canViewAnalytics = useHasPermission('analytics:view');
  const canViewInventory = useHasPermission('products:view');

  const {
    data: inventory,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['inventory-predictions'],
    queryFn: () => analyticsService.getStockoutPredictions(),
    enabled: canViewAnalytics && canViewInventory,
    staleTime: 5 * 60 * 1000,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return REZ_COLORS.error;
      case 'medium':
        return REZ_COLORS.warning;
      default:
        return REZ_COLORS.success;
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'alert-circle';
      case 'medium':
        return 'warning';
      default:
        return 'checkmark-circle';
    }
  };

  const formatCurrency = (amount: number) => `₹${(amount || 0).toLocaleString()}`;
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Safe percentage calculation
  const getPercentage = (value: number, total: number) => {
    if (!total || total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const getFilteredProducts = (): StockoutPrediction[] => {
    if (!inventory) return [];

    const { highRisk = [], mediumRisk = [], safeStock = [] } = inventory;

    switch (riskFilter) {
      case 'high':
        return highRisk;
      case 'medium':
        return mediumRisk;
      case 'safe':
        return safeStock;
      default:
        return [...highRisk, ...mediumRisk, ...safeStock];
    }
  };

  const getCounts = () => {
    if (!inventory) return { all: 0, high: 0, medium: 0, safe: 0 };
    const { highRisk = [], mediumRisk = [], safeStock = [] } = inventory;
    return {
      all: highRisk.length + mediumRisk.length + safeStock.length,
      high: highRisk.length,
      medium: mediumRisk.length,
      safe: safeStock.length,
    };
  };

  const counts = getCounts();

  // Responsive widths
  const contentMaxWidth = isDesktop ? 1200 : isTablet ? 900 : undefined;
  const cardMaxWidth = isDesktop ? 280 : isTablet ? 220 : undefined;
  const productCardMaxWidth = isDesktop ? 580 : isTablet ? 440 : undefined;

  // Tab Button Component
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

  // KPI Card Component
  const KPICard = ({
    label,
    value,
    subtext,
    icon,
    color,
    trend,
  }: {
    label: string;
    value: string | number;
    subtext: string;
    icon: string;
    color: string;
    trend?: 'up' | 'down';
  }) => (
    <View style={[styles.kpiCard, { maxWidth: Platform.OS === 'web' ? cardMaxWidth : undefined }]}>
      <View style={[styles.kpiIconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as unknown as keyof typeof Ionicons.glyphMap} size={20} color={color} />
      </View>
      <View style={styles.kpiContent}>
        <ThemedText style={styles.kpiLabel} numberOfLines={1}>
          {label}
        </ThemedText>
        <View style={styles.kpiValueRow}>
          <ThemedText style={[styles.kpiValue, { color }]} numberOfLines={1}>
            {value}
          </ThemedText>
          {trend && (
            <Ionicons
              name={trend === 'up' ? 'arrow-up' : 'arrow-down'}
              size={14}
              color={trend === 'up' ? REZ_COLORS.error : REZ_COLORS.success}
            />
          )}
        </View>
        <ThemedText style={styles.kpiSubtext} numberOfLines={1}>
          {subtext}
        </ThemedText>
      </View>
    </View>
  );

  // Risk Filter Chip
  const FilterChip = ({
    filterKey,
    label,
    count,
    color,
  }: {
    filterKey: RiskFilter;
    label: string;
    count: number;
    color: string;
  }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        riskFilter === filterKey && styles.filterChipActive,
        riskFilter === filterKey && { backgroundColor: color },
      ]}
      onPress={() => setRiskFilter(filterKey)}
    >
      <ThemedText
        style={[styles.filterChipText, riskFilter === filterKey && styles.filterChipTextActive]}
      >
        {label}
      </ThemedText>
      <View
        style={[styles.filterChipBadge, riskFilter === filterKey && styles.filterChipBadgeActive]}
      >
        <ThemedText
          style={[
            styles.filterChipBadgeText,
            riskFilter === filterKey && styles.filterChipBadgeTextActive,
          ]}
        >
          {count}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  // Product Card Component
  const ProductCard = ({ product }: { product: StockoutPrediction }) => {
    const riskColor = getRiskColor(product.riskLevel);

    return (
      <View
        style={[
          styles.productCard,
          {
            borderLeftColor: riskColor,
            maxWidth: Platform.OS === 'web' ? productCardMaxWidth : undefined,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.productHeader}>
          <View style={styles.productInfo}>
            <ThemedText style={styles.productName} numberOfLines={1}>
              {product.productName}
            </ThemedText>
            <ThemedText style={styles.productSku}>SKU: {product.sku}</ThemedText>
          </View>
          <View style={[styles.riskBadge, { backgroundColor: riskColor }]}>
            <Ionicons
              name={getRiskIcon(product.riskLevel) as unknown as keyof typeof Ionicons.glyphMap}
              size={12}
              color={REZ_COLORS.white}
            />
            <ThemedText style={styles.riskBadgeText}>{product.riskLevel.toUpperCase()}</ThemedText>
          </View>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <ThemedText style={styles.metricLabel}>Stock</ThemedText>
            <ThemedText
              style={[
                styles.metricValue,
                product.currentStock <= 10 && { color: REZ_COLORS.error },
              ]}
            >
              {product.currentStock}
            </ThemedText>
          </View>
          <View style={styles.metricItem}>
            <ThemedText style={styles.metricLabel}>Daily Usage</ThemedText>
            <ThemedText style={styles.metricValue}>
              {(product.dailyAvgUsage || 0).toFixed(1)}/day
            </ThemedText>
          </View>
          <View style={styles.metricItem}>
            <ThemedText style={styles.metricLabel}>Lead Time</ThemedText>
            <ThemedText style={styles.metricValue}>{product.lead_time_days}d</ThemedText>
          </View>
        </View>

        {/* Stockout Warning */}
        {product.daysUntilStockout !== null && product.daysUntilStockout > 0 && (
          <View style={[styles.stockoutWarning, { backgroundColor: `${riskColor}10` }]}>
            <Ionicons name="time" size={16} color={riskColor} />
            <ThemedText style={[styles.stockoutText, { color: riskColor }]}>
              Stockout in {product.daysUntilStockout} days
              {product.predictedStockoutDate && ` • ${formatDate(product.predictedStockoutDate)}`}
            </ThemedText>
          </View>
        )}

        {/* Recommendations */}
        <View style={styles.recommendationsRow}>
          <View style={styles.recommendationItem}>
            <Ionicons name="cube-outline" size={14} color={REZ_COLORS.primary} />
            <ThemedText style={styles.recommendationText}>
              Reorder {product.recommendedReorderQty} units
            </ThemedText>
          </View>
          <View style={styles.recommendationItem}>
            <Ionicons name="calendar-outline" size={14} color={REZ_COLORS.info} />
            <ThemedText style={styles.recommendationText}>
              By {formatDate(product.recommendedReorderDate)}
            </ThemedText>
          </View>
        </View>

        {/* Confidence Bar */}
        <View style={styles.confidenceContainer}>
          <View style={styles.confidenceBarBg}>
            <View
              style={[
                styles.confidenceBarFill,
                {
                  width: `${product.confidence}%`,
                  backgroundColor:
                    product.confidence >= 80
                      ? REZ_COLORS.success
                      : product.confidence >= 60
                        ? REZ_COLORS.warning
                        : REZ_COLORS.error,
                },
              ]}
            />
          </View>
          <ThemedText style={styles.confidenceText}>
            {(product.confidence || 0).toFixed(0)}% confidence
          </ThemedText>
        </View>

        {/* Reorder from Supplier Button - Optional if supplierId is available */}
        {Boolean((product as unknown as Record<string, unknown>).supplierId) && (
          <TouchableOpacity
            style={styles.reorderButton}
            onPress={() =>
              router.push({
                pathname: '/purchase-orders/create',
                params: {
                  supplierId: (product as unknown as Record<string, unknown>).supplierId as string,
                  productId: ((product as unknown as Record<string, unknown>).productId as string) || ((product as unknown as Record<string, unknown>)._id as string) || product.sku,
                },
              })
            }
          >
            <Ionicons name="refresh-outline" size={14} color="#4f46e5" />
            <ThemedText style={styles.reorderText}>Reorder from supplier</ThemedText>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Action Card Component
  const ActionCard = ({
    title,
    count,
    description,
    icon,
    color,
    onPress,
  }: {
    title: string;
    count: number;
    description: string;
    icon: string;
    color: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} disabled={!onPress}>
      <View style={[styles.actionIconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as unknown as keyof typeof Ionicons.glyphMap} size={24} color={color} />
      </View>
      <View style={styles.actionContent}>
        <View style={styles.actionHeader}>
          <ThemedText style={styles.actionTitle}>{title}</ThemedText>
          <View style={[styles.actionCountBadge, { backgroundColor: color }]}>
            <ThemedText style={styles.actionCountText}>{count}</ThemedText>
          </View>
        </View>
        <ThemedText style={styles.actionDescription}>{description}</ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={20} color={REZ_COLORS.textMuted} />
    </TouchableOpacity>
  );

  // Access Denied
  if (!canViewAnalytics || !canViewInventory) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <View style={styles.errorIcon}>
          <Ionicons name="lock-closed" size={48} color={REZ_COLORS.error} />
        </View>
        <ThemedText style={styles.errorTitle}>Access Denied</ThemedText>
        <ThemedText style={styles.errorText}>
          You don't have permission to view inventory analytics.
        </ThemedText>
      </ThemedView>
    );
  }

  // Loading
  if (isLoading && !inventory) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={REZ_COLORS.primary} />
        <ThemedText style={styles.loadingText}>Analyzing inventory...</ThemedText>
        <ThemedText style={styles.loadingSubtext}>Calculating stockout predictions</ThemedText>
      </ThemedView>
    );
  }

  // Error
  if (error && !inventory) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <View style={styles.errorIcon}>
          <Ionicons name="alert-circle" size={48} color={REZ_COLORS.error} />
        </View>
        <ThemedText style={styles.errorTitle}>Failed to Load</ThemedText>
        <ThemedText style={styles.errorText}>
          {error instanceof Error ? error.message : 'Unable to load inventory data'}
        </ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Ionicons name="refresh" size={20} color={REZ_COLORS.white} />
          <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const filteredProducts = getFilteredProducts();
  const isSampleData = (inventory as unknown as Record<string, unknown>)?.isSampleData as boolean | undefined;

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
        {/* Sample Data Notice */}
        {isSampleData && (
          <View style={styles.sampleDataBanner}>
            <Ionicons name="information-circle" size={20} color={REZ_COLORS.info} />
            <View style={styles.sampleDataContent}>
              <ThemedText style={styles.sampleDataTitle}>Sample Inventory Data</ThemedText>
              <ThemedText style={styles.sampleDataText}>
                This is demo data. Real predictions will appear once you have products with
                inventory.
              </ThemedText>
            </View>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TabButton tab="overview" label="Overview" icon="grid-outline" />
          <TabButton tab="products" label="Products" icon="cube-outline" />
          <TabButton tab="actions" label="Actions" icon="flash-outline" />
        </View>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* KPI Cards */}
            <View style={styles.kpiGrid}>
              <KPICard
                label="Total Products"
                value={inventory?.totalProducts || 0}
                subtext="Being tracked"
                icon="cube"
                color={REZ_COLORS.info}
              />
              <KPICard
                label="At Risk"
                value={inventory?.productsAtRisk || 0}
                subtext={`${getPercentage(inventory?.productsAtRisk || 0, inventory?.totalProducts || 0)}% of total`}
                icon="alert-circle"
                color={REZ_COLORS.error}
                trend={(inventory?.productsAtRisk || 0) > 0 ? 'up' : undefined}
              />
              <KPICard
                label="Avg Days to Stockout"
                value={inventory?.summary?.averageDaysToStockout || 0}
                subtext="For at-risk items"
                icon="time"
                color={REZ_COLORS.warning}
              />
              <KPICard
                label="Reorder Value"
                value={formatCurrency(inventory?.summary?.totalReorderValue || 0)}
                subtext={`${inventory?.summary?.criticalItems || 0} critical items`}
                icon="cart"
                color={REZ_COLORS.success}
              />
            </View>

            {/* Risk Distribution */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Risk Distribution</ThemedText>
              <View style={styles.riskDistribution}>
                <View style={styles.riskBarContainer}>
                  <View style={styles.riskBar}>
                    {counts.high > 0 && (
                      <View
                        style={[
                          styles.riskBarSegment,
                          {
                            backgroundColor: REZ_COLORS.error,
                            flex: counts.high,
                          },
                        ]}
                      />
                    )}
                    {counts.medium > 0 && (
                      <View
                        style={[
                          styles.riskBarSegment,
                          {
                            backgroundColor: REZ_COLORS.warning,
                            flex: counts.medium,
                          },
                        ]}
                      />
                    )}
                    {counts.safe > 0 && (
                      <View
                        style={[
                          styles.riskBarSegment,
                          {
                            backgroundColor: REZ_COLORS.success,
                            flex: counts.safe,
                          },
                        ]}
                      />
                    )}
                  </View>
                </View>
                <View style={styles.riskLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: REZ_COLORS.error }]} />
                    <ThemedText style={styles.legendText}>High Risk ({counts.high})</ThemedText>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: REZ_COLORS.warning }]} />
                    <ThemedText style={styles.legendText}>Medium ({counts.medium})</ThemedText>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: REZ_COLORS.success }]} />
                    <ThemedText style={styles.legendText}>Safe ({counts.safe})</ThemedText>
                  </View>
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => {
                  setActiveTab('products');
                  setRiskFilter('high');
                }}
              >
                <Ionicons name="alert-circle" size={18} color={REZ_COLORS.error} />
                <ThemedText style={styles.quickActionText}>View High Risk Items</ThemedText>
                <Ionicons name="chevron-forward" size={16} color={REZ_COLORS.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => setActiveTab('actions')}
              >
                <Ionicons name="flash" size={18} color={REZ_COLORS.warning} />
                <ThemedText style={styles.quickActionText}>Urgent Reorders Needed</ThemedText>
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
              <FilterChip
                filterKey="all"
                label="All"
                count={counts.all}
                color={REZ_COLORS.primary}
              />
              <FilterChip
                filterKey="high"
                label="High Risk"
                count={counts.high}
                color={REZ_COLORS.error}
              />
              <FilterChip
                filterKey="medium"
                label="Medium"
                count={counts.medium}
                color={REZ_COLORS.warning}
              />
              <FilterChip
                filterKey="safe"
                label="Safe"
                count={counts.safe}
                color={REZ_COLORS.success}
              />
            </View>

            {/* Products List */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Product Predictions</ThemedText>
                <ThemedText style={styles.sectionCount}>{filteredProducts.length} items</ThemedText>
              </View>
              <View style={styles.productsGrid}>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product, index) => (
                    <ProductCard key={product.productId || index} product={product} />
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIcon}>
                      <Ionicons name="cube-outline" size={48} color={REZ_COLORS.textMuted} />
                    </View>
                    <ThemedText style={styles.emptyTitle}>No Products</ThemedText>
                    <ThemedText style={styles.emptyText}>
                      {riskFilter === 'all'
                        ? 'No inventory data available'
                        : `No products in "${riskFilter}" risk category`}
                    </ThemedText>
                    {riskFilter !== 'all' && (
                      <TouchableOpacity
                        style={styles.emptyButton}
                        onPress={() => setRiskFilter('all')}
                      >
                        <ThemedText style={styles.emptyButtonText}>View All Products</ThemedText>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>
          </>
        )}

        {/* Actions Tab */}
        {activeTab === 'actions' && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Recommended Actions</ThemedText>
            <View style={styles.actionsGrid}>
              <ActionCard
                title="Urgent Reorders"
                count={inventory?.recommendations?.urgentReorders?.length || 0}
                description="Products that need immediate reordering to avoid stockouts"
                icon="alert-circle"
                color={REZ_COLORS.error}
                onPress={() => {
                  setActiveTab('products');
                  setRiskFilter('high');
                }}
              />
              <ActionCard
                title="Optimize Stock"
                count={inventory?.recommendations?.optimizeStockLevels?.length || 0}
                description="Products with sub-optimal inventory levels"
                icon="analytics"
                color={REZ_COLORS.warning}
                onPress={() => {
                  setActiveTab('products');
                  setRiskFilter('medium');
                }}
              />
              <ActionCard
                title="Well Stocked"
                count={counts.safe}
                description="Products with healthy inventory levels"
                icon="checkmark-circle"
                color={REZ_COLORS.success}
                onPress={() => {
                  setActiveTab('products');
                  setRiskFilter('safe');
                }}
              />
            </View>

            {/* Tips Section */}
            <View style={styles.tipsSection}>
              <ThemedText style={styles.tipsTitle}>
                <Ionicons name="bulb" size={16} color={REZ_COLORS.gold} /> Inventory Tips
              </ThemedText>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark" size={14} color={REZ_COLORS.success} />
                <ThemedText style={styles.tipText}>
                  Set reorder points at 2x your daily usage to maintain safety stock
                </ThemedText>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark" size={14} color={REZ_COLORS.success} />
                <ThemedText style={styles.tipText}>
                  Review high-risk items weekly to prevent stockouts
                </ThemedText>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark" size={14} color={REZ_COLORS.success} />
                <ThemedText style={styles.tipText}>
                  Consider bulk ordering for items with stable demand
                </ThemedText>
              </View>
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
    gap: 16,
    width: '100%',
  },

  // Sample Data Banner
  sampleDataBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${REZ_COLORS.info}10`,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: `${REZ_COLORS.info}30`,
  },
  sampleDataContent: {
    flex: 1,
  },
  sampleDataTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: REZ_COLORS.info,
    marginBottom: 2,
  },
  sampleDataText: {
    fontSize: 12,
    color: REZ_COLORS.textSecondary,
    lineHeight: 18,
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
    paddingHorizontal: 12,
    borderRadius: 10,
    ...Platform.select({ web: { cursor: 'pointer' }, default: {} }),
  },
  tabButtonActive: {
    backgroundColor: REZ_COLORS.primary,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: REZ_COLORS.textSecondary,
  },
  tabButtonTextActive: {
    color: REZ_COLORS.white,
  },

  // KPI Grid
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
    minWidth: 0,
  },
  kpiLabel: {
    fontSize: 11,
    color: REZ_COLORS.textSecondary,
    marginBottom: 2,
  },
  kpiValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  kpiValue: {
    fontSize: 18,
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

  // Risk Distribution
  riskDistribution: {
    gap: 12,
  },
  riskBarContainer: {
    paddingVertical: 4,
  },
  riskBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: REZ_COLORS.border,
  },
  riskBarSegment: {
    height: '100%',
  },
  riskLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: REZ_COLORS.textSecondary,
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
    ...Platform.select({ web: { cursor: 'pointer' }, default: {} }),
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
    ...Platform.select({ web: { cursor: 'pointer' }, default: {} }),
  },
  filterChipActive: {
    borderColor: 'transparent',
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
    backgroundColor: 'rgba(255,255,255,0.25)',
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
    gap: 12,
  },

  // Product Card
  productCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: REZ_COLORS.background,
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 16,
    gap: 12,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: REZ_COLORS.textPrimary,
  },
  productSku: {
    fontSize: 12,
    color: REZ_COLORS.textMuted,
    marginTop: 2,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskBadgeText: {
    color: REZ_COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricItem: {
    flex: 1,
    backgroundColor: REZ_COLORS.white,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: REZ_COLORS.textMuted,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: REZ_COLORS.textPrimary,
  },

  // Stockout Warning
  stockoutWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
  },
  stockoutText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },

  // Recommendations Row
  recommendationsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recommendationText: {
    fontSize: 12,
    color: REZ_COLORS.textSecondary,
  },

  // Confidence
  confidenceContainer: {
    gap: 6,
  },
  confidenceBarBg: {
    height: 6,
    backgroundColor: REZ_COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 10,
    color: REZ_COLORS.textMuted,
    textAlign: 'right',
  },

  // Actions Grid
  actionsGrid: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: REZ_COLORS.background,
    padding: 16,
    borderRadius: 12,
    gap: 14,
    ...Platform.select({ web: { cursor: 'pointer' }, default: {} }),
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: REZ_COLORS.textPrimary,
  },
  actionCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  actionCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: REZ_COLORS.white,
  },
  actionDescription: {
    fontSize: 12,
    color: REZ_COLORS.textSecondary,
    lineHeight: 18,
  },

  // Tips Section
  tipsSection: {
    backgroundColor: `${REZ_COLORS.gold}10`,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: REZ_COLORS.textPrimary,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: REZ_COLORS.textSecondary,
    lineHeight: 18,
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

  // Loading & Error
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: REZ_COLORS.textPrimary,
    marginTop: 12,
  },
  loadingSubtext: {
    fontSize: 14,
    color: REZ_COLORS.textMuted,
    marginTop: 4,
  },
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
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
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
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#4f46e515',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4f46e5',
    gap: 6,
  },
  reorderText: {
    fontSize: 12,
    color: '#4f46e5',
    fontWeight: '600',
  },
});
