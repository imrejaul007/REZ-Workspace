/**
 * Pricing Suggestions Screen
 * Dynamic pricing recommendations powered by AI
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
  Text,
  Modal,
  FlatList,
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
import { StoreSelector } from '@/components/stores/StoreSelector';
import { formatTime } from '@/utils/dateUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PriceRecommendation {
  productId: string;
  productName: string;
  basePrice: number;
  recommendedPrice: number;
  minPrice: number;
  maxPrice: number;
  priceChange: number;
  priceChangePercent: number;
  strategy: {
    name: string;
    description: string;
  };
  confidence: number;
  factors: Array<{
    type: string;
    impact: number;
    description: string;
  }>;
  reason: string;
}

interface BundleRecommendation {
  bundleName: string;
  products: Array<{ productId: string; productName: string }>;
  currentBundlePrice: number;
  suggestedBundlePrice: number;
  discount: number;
  reason: string;
}

interface RecommendedAction {
  type: string;
  priority: 'low' | 'medium' | 'high';
  description: string;
  affectedProducts: string[];
  expectedImpact: string;
}

export default function PricingSuggestionsScreen() {
  const [horizon, setHorizon] = useState<7 | 14 | 30>(7);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PriceRecommendation | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'increase' | 'decrease'>('all');

  const { activeStore } = useStore();
  const storeId = activeStore?._id;

  React.useEffect(() => {
    if (storeId) {
      analyticsService.setActiveStore(storeId);
    }
  }, [storeId]);

  const canViewAnalytics = useHasPermission('analytics:view');

  // Fetch pricing recommendations
  const {
    data: pricing,
    isLoading: pricingLoading,
    error: pricingError,
    refetch: refetchPricing,
  } = useQuery({
    queryKey: ['pricing-recommendations', storeId, horizon],
    queryFn: () => analyticsService.getPricingRecommendations(horizon),
    enabled: canViewAnalytics && !!storeId,
    staleTime: 5 * 60 * 1000,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchPricing();
    setRefreshing(false);
  };

  const horizonOptions: { key: 7 | 14 | 30; label: string }[] = [
    { key: 7, label: '7 Days' },
    { key: 14, label: '14 Days' },
    { key: 30, label: '30 Days' },
  ];

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return '#10b981';
    if (change < 0) return '#ef4444';
    return Colors.light.textSecondary;
  };

  const getPriceChangeIcon = (change: number) => {
    if (change > 0) return 'arrow-up';
    if (change < 0) return 'arrow-down';
    return 'remove';
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy.toLowerCase()) {
      case 'premium': return '#8b5cf6';
      case 'competitive': return '#3b82f6';
      case 'penetration': return '#10b981';
      case 'dynamic': return '#f59e0b';
      case 'bundle': return '#ec4899';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'raise_prices': return 'arrow-up-circle';
      case 'lower_prices': return 'arrow-down-circle';
      case 'launch_promo': return 'megaphone';
      case 'bundle_deal': return 'cube';
      case 'time_discount': return 'time';
      default: return 'information-circle';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

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
        <ThemedText style={styles.noAccessText}>Please select a store to view pricing</ThemedText>
      </ThemedView>
    );
  }

  if (pricingLoading && !pricing) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <ThemedText style={styles.loadingText}>Calculating optimal prices...</ThemedText>
      </ThemedView>
    );
  }

  if (pricingError) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle" size={48} color={Colors.light.error} />
        <ThemedText style={styles.errorText}>Failed to load pricing recommendations</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetchPricing()}>
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const recommendations: PriceRecommendation[] = pricing?.recommendations || [];
  const bundles: BundleRecommendation[] = pricing?.bundles || [];
  const actions: RecommendedAction[] = pricing?.actions || [];
  const summary = pricing?.summary || {};

  // Filter recommendations based on selected filter
  const filteredRecommendations = useMemo(() => {
    let filtered = recommendations;
    if (filterType === 'increase') {
      filtered = filtered.filter(r => r.priceChange > 0);
    } else if (filterType === 'decrease') {
      filtered = filtered.filter(r => r.priceChange < 0);
    }
    return filtered.slice(0, 20); // Limit for performance
  }, [recommendations, filterType]);

  const openProductModal = (product: PriceRecommendation) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Store Selector Header */}
        <View style={styles.storeHeader}>
          <StoreSelector compact />
        </View>

        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <View>
              <ThemedText style={styles.headerTitle}>Pricing Suggestions</ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                AI-optimized prices for maximum revenue
              </ThemedText>
            </View>
            <TouchableOpacity
              style={styles.forecastButton}
              onPress={() => router.push('/analytics/demand-forecast')}
            >
              <Ionicons name="analytics" size={18} color={Colors.light.primary} />
              <ThemedText style={styles.forecastButtonText}>Forecast</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Horizon Selector */}
          <View style={styles.horizonContainer}>
            {horizonOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.horizonButton,
                  horizon === option.key && styles.horizonButtonActive,
                ]}
                onPress={() => setHorizon(option.key)}
              >
                <ThemedText
                  style={[
                    styles.horizonButtonText,
                    horizon === option.key && styles.horizonButtonTextActive,
                  ]}
                >
                  {option.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="arrow-up" size={24} color="#16a34a" />
            <ThemedText style={styles.summaryValue}>{summary.priceIncreases || 0}</ThemedText>
            <ThemedText style={styles.summaryLabel}>Price Increases</ThemedText>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="arrow-down" size={24} color="#dc2626" />
            <ThemedText style={styles.summaryValue}>{summary.priceDecreases || 0}</ThemedText>
            <ThemedText style={styles.summaryLabel}>Price Decreases</ThemedText>
          </View>
        </View>

        {/* Impact Summary */}
        <View style={styles.impactSection}>
          <View style={styles.impactCard}>
            <View style={styles.impactItem}>
              <ThemedText style={styles.impactLabel}>Total Products</ThemedText>
              <ThemedText style={styles.impactValue}>{summary.totalProducts || 0}</ThemedText>
            </View>
            <View style={styles.impactDivider} />
            <View style={styles.impactItem}>
              <ThemedText style={styles.impactLabel}>Est. Revenue Impact</ThemedText>
              <ThemedText style={[styles.impactValue, { color: summary.estimatedRevenueImpact >= 0 ? '#10b981' : '#ef4444' }]}>
                {summary.estimatedRevenueImpact >= 0 ? '+' : ''}{formatCurrency(summary.estimatedRevenueImpact || 0)}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Recommended Actions */}
        {actions.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Recommended Actions</ThemedText>
            {actions.map((action, index) => (
              <TouchableOpacity key={index} style={styles.actionCard}>
                <View style={styles.actionHeader}>
                  <Ionicons
                    name={getActionIcon(action.type) as unknown}
                    size={20}
                    color={getPriorityColor(action.priority)}
                  />
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(action.priority) + '20' }]}>
                    <Text style={[styles.priorityText, { color: getPriorityColor(action.priority) }]}>
                      {action.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <ThemedText style={styles.actionDescription}>{action.description}</ThemedText>
                <View style={styles.actionImpact}>
                  <Ionicons name="trending-up" size={14} color={Colors.light.primary} />
                  <ThemedText style={styles.actionImpactText}>{action.expectedImpact}</ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Bundle Recommendations */}
        {bundles.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Bundle Deals</ThemedText>
            {bundles.map((bundle, index) => (
              <View key={index} style={styles.bundleCard}>
                <View style={styles.bundleHeader}>
                  <Ionicons name="cube" size={20} color="#ec4899" />
                  <ThemedText style={styles.bundleName}>{bundle.bundleName}</ThemedText>
                </View>
                <View style={styles.bundleProducts}>
                  {bundle.products.map((p, i) => (
                    <Text key={i} style={styles.bundleProductText}>+ {p.productName}</Text>
                  ))}
                </View>
                <View style={styles.bundlePricing}>
                  <View>
                    <ThemedText style={styles.bundleCurrentLabel}>Current</ThemedText>
                    <ThemedText style={styles.bundleCurrentPrice}>{formatCurrency(bundle.currentBundlePrice)}</ThemedText>
                  </View>
                  <Ionicons name="arrow-forward" size={20} color={Colors.light.textMuted} />
                  <View>
                    <ThemedText style={styles.bundleSuggestedLabel}>Suggested</ThemedText>
                    <ThemedText style={styles.bundleSuggestedPrice}>{formatCurrency(bundle.suggestedBundlePrice)}</ThemedText>
                  </View>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{bundle.discount}% OFF</Text>
                  </View>
                </View>
                <ThemedText style={styles.bundleReason}>{bundle.reason}</ThemedText>
              </View>
            ))}
          </View>
        )}

        {/* Filter Tabs */}
        <View style={styles.filterSection}>
          <View style={styles.filterTabs}>
            {(['all', 'increase', 'decrease'] as const).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[styles.filterTab, filterType === filter && styles.filterTabActive]}
                onPress={() => setFilterType(filter)}
              >
                <ThemedText
                  style={[styles.filterTabText, filterType === filter && styles.filterTabTextActive]}
                >
                  {filter === 'all' ? 'All' : filter === 'increase' ? 'Increases' : 'Decreases'}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price Recommendations */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Price Changes</ThemedText>
          {filteredRecommendations.map((rec, index) => (
            <TouchableOpacity
              key={index}
              style={styles.recommendationCard}
              onPress={() => openProductModal(rec)}
            >
              <View style={styles.recommendationHeader}>
                <View style={styles.productInfo}>
                  <ThemedText style={styles.productName}>{rec.productName}</ThemedText>
                  <View style={[styles.strategyBadge, { backgroundColor: getStrategyColor(rec.strategy.name) + '20' }]}>
                    <Text style={[styles.strategyText, { color: getStrategyColor(rec.strategy.name) }]}>
                      {rec.strategy.name}
                    </Text>
                  </View>
                </View>
                <View style={styles.priceInfo}>
                  <View style={styles.priceChange}>
                    <Ionicons
                      name={getPriceChangeIcon(rec.priceChange) as unknown}
                      size={16}
                      color={getPriceChangeColor(rec.priceChange)}
                    />
                    <Text style={[styles.priceChangeText, { color: getPriceChangeColor(rec.priceChange) }]}>
                      {rec.priceChange >= 0 ? '+' : ''}{rec.priceChangePercent.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.pricingRow}>
                <View style={styles.priceItem}>
                  <ThemedText style={styles.priceLabel}>Current</ThemedText>
                  <ThemedText style={styles.currentPrice}>{formatCurrency(rec.basePrice)}</ThemedText>
                </View>
                <Ionicons name="arrow-forward" size={18} color={Colors.light.textMuted} />
                <View style={styles.priceItem}>
                  <ThemedText style={styles.priceLabel}>Suggested</ThemedText>
                  <ThemedText style={styles.suggestedPrice}>{formatCurrency(rec.recommendedPrice)}</ThemedText>
                </View>
              </View>
              <View style={styles.confidenceRow}>
                <View style={styles.confidenceBar}>
                  <View style={[styles.confidenceFill, { width: `${rec.confidence * 100}%` }]} />
                </View>
                <ThemedText style={styles.confidenceText}>{(rec.confidence * 100).toFixed(0)}% confidence</ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Context Info */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Pricing Context</ThemedText>
          <View style={styles.contextCard}>
            <View style={styles.contextRow}>
              <ThemedText style={styles.contextLabel}>Average Demand</ThemedText>
              <View style={[styles.contextBadge, {
                backgroundColor: pricing?.context?.averageDemandLevel === 'high' ? '#fee2e2' :
                                pricing?.context?.averageDemandLevel === 'low' ? '#dcfce7' : '#fef3c7'
              }]}>
                <Text style={styles.contextBadgeText}>
                  {(pricing?.context?.averageDemandLevel || 'medium').toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.contextRow}>
              <ThemedText style={styles.contextLabel}>Horizon</ThemedText>
              <ThemedText style={styles.contextValue}>{pricing?.context?.horizon || 7} days</ThemedText>
            </View>
            {pricing?.context?.peakHours?.length > 0 && (
              <View style={styles.contextRow}>
                <ThemedText style={styles.contextLabel}>Peak Hours</ThemedText>
                <ThemedText style={styles.contextValue}>
                  {pricing.context.peakHours.map((d: string) => formatDate(d)).join(', ')}
                </ThemedText>
              </View>
            )}
            {pricing?.context?.slowHours?.length > 0 && (
              <View style={styles.contextRow}>
                <ThemedText style={styles.contextLabel}>Slow Hours</ThemedText>
                <ThemedText style={styles.contextValue}>
                  {pricing.context.slowHours.map((d: string) => formatDate(d)).join(', ')}
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>
            Generated: {pricing?.generatedAt ? formatTime(pricing.generatedAt) : 'N/A'}
          </ThemedText>
          <ThemedText style={styles.footerSubtext}>
            Prices valid until: {pricing?.validUntil ? formatDate(pricing.validUntil) : 'N/A'}
          </ThemedText>
        </View>
      </ScrollView>

      {/* Product Detail Modal */}
      <Modal
        visible={showProductModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProductModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedProduct && (
              <>
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>{selectedProduct.productName}</ThemedText>
                  <TouchableOpacity onPress={() => setShowProductModal(false)}>
                    <Ionicons name="close" size={24} color={Colors.light.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScroll}>
                  {/* Price Summary */}
                  <View style={styles.modalPriceSection}>
                    <View style={styles.modalPriceCard}>
                      <ThemedText style={styles.modalPriceLabel}>Current Price</ThemedText>
                      <ThemedText style={styles.modalPriceValue}>{formatCurrency(selectedProduct.basePrice)}</ThemedText>
                    </View>
                    <View style={styles.modalArrow}>
                      <Ionicons name="arrow-forward" size={24} color={Colors.light.primary} />
                    </View>
                    <View style={[styles.modalPriceCard, { backgroundColor: '#DCFCE7' }]}>
                      <ThemedText style={styles.modalPriceLabel}>Suggested Price</ThemedText>
                      <ThemedText style={styles.modalSuggestedPrice}>{formatCurrency(selectedProduct.recommendedPrice)}</ThemedText>
                    </View>
                  </View>

                  {/* Price Range */}
                  <View style={styles.rangeSection}>
                    <ThemedText style={styles.rangeTitle}>Acceptable Price Range</ThemedText>
                    <View style={styles.rangeBar}>
                      <View style={styles.rangeFill}>
                        <View style={[styles.rangeMarker, { left: '0%' }]} />
                        <View style={[styles.rangeMarker, { left: '50%' }]} />
                        <View style={[styles.rangeMarker, { left: '100%' }]} />
                      </View>
                    </View>
                    <View style={styles.rangeLabels}>
                      <Text style={styles.rangeLabel}>{formatCurrency(selectedProduct.minPrice)}</Text>
                      <Text style={styles.rangeLabel}>{formatCurrency(selectedProduct.maxPrice)}</Text>
                    </View>
                  </View>

                  {/* Strategy */}
                  <View style={styles.strategySection}>
                    <View style={[styles.strategyCard, { borderColor: getStrategyColor(selectedProduct.strategy.name) }]}>
                      <Ionicons name="bulb" size={20} color={getStrategyColor(selectedProduct.strategy.name)} />
                      <View style={styles.strategyInfo}>
                        <ThemedText style={styles.strategyName}>{selectedProduct.strategy.name}</ThemedText>
                        <ThemedText style={styles.strategyDescription}>{selectedProduct.strategy.description}</ThemedText>
                      </View>
                    </View>
                  </View>

                  {/* Factors */}
                  <View style={styles.factorsSection}>
                    <ThemedText style={styles.factorsTitle}>Pricing Factors</ThemedText>
                    {selectedProduct.factors.map((factor, index) => (
                      <View key={index} style={styles.factorItem}>
                        <View style={styles.factorHeader}>
                          <Text style={styles.factorType}>{factor.type.toUpperCase()}</Text>
                          <Text style={[styles.factorImpact, { color: factor.impact >= 0 ? '#10b981' : '#ef4444' }]}>
                            {factor.impact >= 0 ? '+' : ''}{factor.impact.toFixed(1)}%
                          </Text>
                        </View>
                        <ThemedText style={styles.factorDescription}>{factor.description}</ThemedText>
                      </View>
                    ))}
                  </View>

                  {/* Reason */}
                  <View style={styles.reasonSection}>
                    <ThemedText style={styles.reasonTitle}>Why This Price?</ThemedText>
                    <ThemedText style={styles.reasonText}>{selectedProduct.reason}</ThemedText>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
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

  // Store Header
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
  forecastButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  forecastButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
  },

  // Horizon Selector
  horizonContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 10,
    padding: 4,
  },
  horizonButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  horizonButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  horizonButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  horizonButtonTextActive: {
    color: '#FFFFFF',
  },

  // Summary Grid
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },

  // Impact Section
  impactSection: {
    marginBottom: 16,
  },
  impactCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  impactItem: {
    flex: 1,
    alignItems: 'center',
  },
  impactDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.light.border,
    marginHorizontal: 16,
  },
  impactLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  impactValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },

  // Section
  section: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },

  // Action Cards
  actionCard: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  actionDescription: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  actionImpact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  actionImpactText: {
    fontSize: 12,
    color: Colors.light.primary,
    flex: 1,
  },

  // Bundle Card
  bundleCard: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  bundleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  bundleName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  bundleProducts: {
    marginBottom: 8,
  },
  bundleProductText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginLeft: 8,
  },
  bundlePricing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  bundleCurrentLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
  bundleCurrentPrice: {
    fontSize: 14,
    color: Colors.light.text,
    textDecorationLine: 'line-through',
  },
  bundleSuggestedLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
  bundleSuggestedPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
  discountBadge: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  discountText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  bundleReason: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
  },

  // Filter Section
  filterSection: {
    marginBottom: 16,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: Colors.light.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },

  // Recommendation Card
  recommendationCard: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  strategyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  strategyText: {
    fontSize: 10,
    fontWeight: '600',
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  priceChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceChangeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  priceItem: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  currentPrice: {
    fontSize: 14,
    color: Colors.light.text,
    textDecorationLine: 'line-through',
  },
  suggestedPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confidenceBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 2,
  },
  confidenceText: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    minWidth: 80,
  },

  // Context Card
  contextCard: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
  },
  contextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  contextLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  contextValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  contextBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  contextBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  footerSubtext: {
    fontSize: 11,
    color: Colors.light.textMuted,
    marginTop: 4,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  modalScroll: {
    padding: 16,
  },
  modalPriceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  modalPriceCard: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalPriceLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  modalPriceValue: {
    fontSize: 18,
    color: Colors.light.text,
    textDecorationLine: 'line-through',
  },
  modalArrow: {
    paddingHorizontal: 4,
  },
  modalSuggestedPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981',
  },

  // Range Section
  rangeSection: {
    marginBottom: 20,
  },
  rangeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  rangeBar: {
    marginBottom: 8,
  },
  rangeFill: {
    height: 8,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 4,
    position: 'relative',
  },
  rangeMarker: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    marginLeft: -8,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },

  // Strategy Section
  strategySection: {
    marginBottom: 20,
  },
  strategyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
  },
  strategyInfo: {
    flex: 1,
  },
  strategyName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  strategyDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },

  // Factors Section
  factorsSection: {
    marginBottom: 20,
  },
  factorsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  factorItem: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  factorType: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  factorImpact: {
    fontSize: 12,
    fontWeight: '600',
  },
  factorDescription: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
  },

  // Reason Section
  reasonSection: {
    marginBottom: 20,
  },
  reasonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
});
