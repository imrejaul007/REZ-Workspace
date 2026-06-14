/**
 * Trend Analysis Screen
 * Seasonal patterns, peak/trough identification, and cyclicity analysis
 * Production-ready with ReZ Design System
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
import { analyticsService } from '@/services/api/analytics';
import { useHasPermission } from '@/hooks/usePermissions';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

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
  purple: '#8B5CF6',
};

type DataType = 'sales' | 'orders' | 'customers' | 'products';

export default function TrendsAnalysisScreen() {
  const [dataType, setDataType] = useState<DataType>('sales');
  const [refreshing, setRefreshing] = useState(false);

  const { isDesktop, isTablet } = useResponsiveLayout();
  const canViewAnalytics = useHasPermission('analytics:view');

  const {
    data: trends,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['trends', dataType],
    queryFn: () => analyticsService.getSeasonalTrends(dataType),
    enabled: canViewAnalytics,
    staleTime: 5 * 60 * 1000,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const dataTypes: { value: DataType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'sales', label: 'Sales', icon: 'cash-outline' },
    { value: 'orders', label: 'Orders', icon: 'receipt-outline' },
    { value: 'customers', label: 'Customers', icon: 'people-outline' },
    { value: 'products', label: 'Products', icon: 'cube-outline' },
  ];

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return REZ_COLORS.success;
      case 'down':
        return REZ_COLORS.error;
      case 'cyclic':
        return REZ_COLORS.purple;
      default:
        return REZ_COLORS.textSecondary;
    }
  };

  const getTrendIcon = (trend: string): keyof typeof Ionicons.glyphMap => {
    switch (trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      case 'cyclic':
        return 'sync';
      default:
        return 'remove';
    }
  };

  const formatValue = (value: number) => {
    if (dataType === 'sales') return `₹${value.toLocaleString()}`;
    return value.toLocaleString();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return REZ_COLORS.success;
    if (confidence >= 60) return REZ_COLORS.warning;
    return REZ_COLORS.error;
  };

  // Check if we have minimal data (less than 2 data points)
  const hasMinimalData = trends?.seasonalTrends?.[0]?.dataPoints?.length === 1;

  // Responsive widths
  const contentMaxWidth = isDesktop ? 1200 : isTablet ? 900 : undefined;

  if (!canViewAnalytics) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <View style={styles.accessDeniedCard}>
          <View style={styles.accessDeniedIcon}>
            <Ionicons name="lock-closed" size={32} color={REZ_COLORS.error} />
          </View>
          <ThemedText style={styles.accessDeniedTitle}>Access Denied</ThemedText>
          <ThemedText style={styles.accessDeniedText}>
            You don't have permission to view analytics
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (isLoading && !trends) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={REZ_COLORS.primary} />
        <ThemedText style={styles.loadingText}>Analyzing trends...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        contentMaxWidth
          ? { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }
          : undefined,
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[REZ_COLORS.primary]}
          tintColor={REZ_COLORS.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={REZ_COLORS.navy} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>Trend Analysis</ThemedText>
          <ThemedText style={styles.headerSubtitle}>Seasonal patterns & insights</ThemedText>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={22} color={REZ_COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Data Type Selector */}
      <View style={styles.selectorContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.selectorScroll}
        >
          {dataTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.selectorButton,
                dataType === type.value && styles.selectorButtonActive,
              ]}
              onPress={() => setDataType(type.value)}
            >
              <Ionicons
                name={type.icon}
                size={18}
                color={dataType === type.value ? REZ_COLORS.white : REZ_COLORS.textSecondary}
              />
              <ThemedText
                style={[
                  styles.selectorButtonText,
                  dataType === type.value && styles.selectorButtonTextActive,
                ]}
              >
                {type.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Low Data Warning */}
      {hasMinimalData && (
        <View style={styles.warningCard}>
          <View style={styles.warningIcon}>
            <Ionicons name="information-circle" size={24} color={REZ_COLORS.warning} />
          </View>
          <View style={styles.warningContent}>
            <ThemedText style={styles.warningTitle}>Limited Data Available</ThemedText>
            <ThemedText style={styles.warningText}>
              Trend analysis works best with more historical data. Continue making sales to see
              richer insights.
            </ThemedText>
          </View>
        </View>
      )}

      {/* Overall Trend Card */}
      {trends?.overallAnalysis && (
        <View style={styles.trendCard}>
          <View style={styles.trendCardHeader}>
            <View
              style={[
                styles.trendIconContainer,
                { backgroundColor: `${getTrendColor(trends.overallAnalysis.trend)}15` },
              ]}
            >
              <Ionicons
                name={getTrendIcon(trends.overallAnalysis.trend)}
                size={28}
                color={getTrendColor(trends.overallAnalysis.trend)}
              />
            </View>
            <View style={styles.trendCardInfo}>
              <ThemedText style={styles.trendCardLabel}>Overall Trend</ThemedText>
              <View style={styles.trendCardValueRow}>
                {/* TS-H2 fix: overallAnalysis and trend can be absent on partial API response */}
                <ThemedText
                  style={[
                    styles.trendCardValue,
                    { color: getTrendColor(trends.overallAnalysis?.trend ?? 'stable') },
                  ]}
                >
                  {trends.overallAnalysis?.trend?.toUpperCase() ?? '—'}
                </ThemedText>
                <View
                  style={[
                    styles.growthBadge,
                    {
                      backgroundColor:
                        trends.overallAnalysis.growthRate >= 0
                          ? `${REZ_COLORS.success}15`
                          : `${REZ_COLORS.error}15`,
                    },
                  ]}
                >
                  <Ionicons
                    name={trends.overallAnalysis.growthRate >= 0 ? 'arrow-up' : 'arrow-down'}
                    size={12}
                    color={
                      trends.overallAnalysis.growthRate >= 0 ? REZ_COLORS.success : REZ_COLORS.error
                    }
                  />
                  <ThemedText
                    style={[
                      styles.growthBadgeText,
                      {
                        color:
                          trends.overallAnalysis.growthRate >= 0
                            ? REZ_COLORS.success
                            : REZ_COLORS.error,
                      },
                    ]}
                  >
                    {Math.abs(trends.overallAnalysis.growthRate).toFixed(1)}%
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* Progress Bars */}
          <View style={styles.progressBarsContainer}>
            <View style={styles.progressBarItem}>
              <View style={styles.progressBarHeader}>
                <ThemedText style={styles.progressBarLabel}>Trend Strength</ThemedText>
                <ThemedText style={styles.progressBarValue}>
                  {trends.overallAnalysis.strength}%
                </ThemedText>
              </View>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.max(5, trends.overallAnalysis.strength)}%`,
                      backgroundColor:
                        trends.overallAnalysis.strength >= 60
                          ? REZ_COLORS.success
                          : trends.overallAnalysis.strength >= 30
                            ? REZ_COLORS.warning
                            : REZ_COLORS.error,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.progressBarItem}>
              <View style={styles.progressBarHeader}>
                <ThemedText style={styles.progressBarLabel}>Seasonality</ThemedText>
                <ThemedText style={styles.progressBarValue}>
                  {trends.overallAnalysis.seasonality}%
                </ThemedText>
              </View>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.max(5, trends.overallAnalysis.seasonality)}%`,
                      backgroundColor: REZ_COLORS.info,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.progressBarItem}>
              <View style={styles.progressBarHeader}>
                <ThemedText style={styles.progressBarLabel}>Cyclicity</ThemedText>
                <ThemedText style={styles.progressBarValue}>
                  {trends.overallAnalysis.cyclicity}%
                </ThemedText>
              </View>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.max(5, trends.overallAnalysis.cyclicity)}%`,
                      backgroundColor: REZ_COLORS.purple,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Peaks & Troughs */}
      {trends?.peaks && trends.peaks.length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Peaks & Troughs</ThemedText>
          </View>

          <View style={styles.peaksGrid}>
            {/* Top Peak */}
            <View style={[styles.peakCard, { borderTopColor: REZ_COLORS.success }]}>
              <View style={[styles.peakIconBg, { backgroundColor: `${REZ_COLORS.success}15` }]}>
                <Ionicons name="trending-up" size={24} color={REZ_COLORS.success} />
              </View>
              <ThemedText style={styles.peakLabel}>Top Peak</ThemedText>
              <ThemedText style={styles.peakValue}>{formatValue(trends.peaks[0].value)}</ThemedText>
              <ThemedText style={styles.peakPeriod}>{trends.peaks[0].period}</ThemedText>
              {trends.peaks[0].seasonalIndex && (
                <View style={[styles.indexBadge, { backgroundColor: `${REZ_COLORS.success}15` }]}>
                  <ThemedText style={[styles.indexBadgeText, { color: REZ_COLORS.success }]}>
                    {trends.peaks[0].seasonalIndex.toFixed(2)}x avg
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Lowest Trough */}
            {trends?.troughs && trends.troughs.length > 0 && (
              <View style={[styles.peakCard, { borderTopColor: REZ_COLORS.error }]}>
                <View style={[styles.peakIconBg, { backgroundColor: `${REZ_COLORS.error}15` }]}>
                  <Ionicons name="trending-down" size={24} color={REZ_COLORS.error} />
                </View>
                <ThemedText style={styles.peakLabel}>Lowest Trough</ThemedText>
                <ThemedText style={styles.peakValue}>
                  {formatValue(trends.troughs[0].value)}
                </ThemedText>
                <ThemedText style={styles.peakPeriod}>{trends.troughs[0].period}</ThemedText>
                {trends.troughs[0].seasonalIndex && (
                  <View style={[styles.indexBadge, { backgroundColor: `${REZ_COLORS.error}15` }]}>
                    <ThemedText style={[styles.indexBadgeText, { color: REZ_COLORS.error }]}>
                      {trends.troughs[0].seasonalIndex.toFixed(2)}x avg
                    </ThemedText>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      )}

      {/* Seasonal Patterns */}
      {trends?.seasonalTrends && trends.seasonalTrends.length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Seasonal Patterns</ThemedText>
          </View>

          {trends.seasonalTrends.map((season, index) => (
            <View key={index} style={styles.seasonCard}>
              <View style={styles.seasonHeader}>
                <View style={styles.seasonTitleRow}>
                  <Ionicons name="calendar-outline" size={18} color={REZ_COLORS.primary} />
                  <ThemedText style={styles.seasonTitle}>
                    {season.season} {season.year}
                  </ThemedText>
                </View>
                <View style={styles.seasonBadges}>
                  <View style={[styles.miniBadge, { backgroundColor: `${REZ_COLORS.success}15` }]}>
                    <Ionicons name="arrow-up" size={12} color={REZ_COLORS.success} />
                    <ThemedText style={[styles.miniBadgeText, { color: REZ_COLORS.success }]}>
                      {formatValue(season.peak)}
                    </ThemedText>
                  </View>
                  <View style={[styles.miniBadge, { backgroundColor: `${REZ_COLORS.error}15` }]}>
                    <Ionicons name="arrow-down" size={12} color={REZ_COLORS.error} />
                    <ThemedText style={[styles.miniBadgeText, { color: REZ_COLORS.error }]}>
                      {formatValue(season.trough)}
                    </ThemedText>
                  </View>
                </View>
              </View>

              <View style={styles.seasonMetricsRow}>
                <View style={styles.seasonMetric}>
                  <ThemedText style={styles.seasonMetricLabel}>Average</ThemedText>
                  <ThemedText style={styles.seasonMetricValue}>
                    {formatValue(Math.round(season.average))}
                  </ThemedText>
                </View>
                <View style={[styles.seasonMetric, styles.seasonMetricBorder]}>
                  <ThemedText style={styles.seasonMetricLabel}>Volatility</ThemedText>
                  <ThemedText style={styles.seasonMetricValue}>
                    {season.volatility.toFixed(0)}%
                  </ThemedText>
                </View>
                <View style={styles.seasonMetric}>
                  <ThemedText style={styles.seasonMetricLabel}>Data Points</ThemedText>
                  <ThemedText style={styles.seasonMetricValue}>
                    {season.dataPoints?.length || 0}
                  </ThemedText>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Next Period Forecast */}
      {trends?.predictions && (
        <View style={[styles.sectionCard, styles.forecastCard]}>
          <View style={styles.forecastHeader}>
            <View style={styles.forecastIconContainer}>
              <Ionicons name="sparkles" size={20} color={REZ_COLORS.primary} />
            </View>
            <ThemedText style={styles.forecastTitle}>Next Period Forecast</ThemedText>
          </View>

          <View style={styles.forecastContent}>
            <View style={styles.forecastRow}>
              <ThemedText style={styles.forecastLabel}>Period</ThemedText>
              <ThemedText style={styles.forecastValue}>{trends.predictions.nextSeason}</ThemedText>
            </View>

            <View style={styles.forecastDivider} />

            <View style={styles.forecastRow}>
              <ThemedText style={styles.forecastLabel}>Expected Trend</ThemedText>
              <View style={styles.forecastTrendRow}>
                {/* TS-H2 fix: predictions and expectedTrend may be absent */}
                <Ionicons
                  name={getTrendIcon(trends.predictions?.expectedTrend ?? 'stable')}
                  size={18}
                  color={getTrendColor(trends.predictions?.expectedTrend ?? 'stable')}
                />
                <ThemedText
                  style={[
                    styles.forecastValue,
                    { color: getTrendColor(trends.predictions?.expectedTrend ?? 'stable') },
                  ]}
                >
                  {trends.predictions?.expectedTrend?.toUpperCase() ?? '—'}
                </ThemedText>
              </View>
            </View>

            <View style={styles.forecastDivider} />

            <View style={styles.forecastRow}>
              <ThemedText style={styles.forecastLabel}>Expected Value</ThemedText>
              <ThemedText style={[styles.forecastValue, styles.forecastValueLarge]}>
                {formatValue(trends.predictions.expectedValue)}
              </ThemedText>
            </View>

            <View style={styles.forecastDivider} />

            <View style={styles.forecastRow}>
              <ThemedText style={styles.forecastLabel}>Confidence</ThemedText>
              <View
                style={[
                  styles.confidenceBadge,
                  { backgroundColor: getConfidenceColor(trends.predictions.confidence) },
                ]}
              >
                <ThemedText style={styles.confidenceText}>
                  {/* TS-H2 fix: confidence may be absent */}
                  {trends.predictions?.confidence != null
                    ? trends.predictions.confidence.toFixed(0)
                    : '—'}
                  %
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Empty State */}
      {!trends?.overallAnalysis && !trends?.peaks?.length && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="analytics-outline" size={48} color={REZ_COLORS.textMuted} />
          </View>
          <ThemedText style={styles.emptyTitle}>No Trend Data</ThemedText>
          <ThemedText style={styles.emptyText}>
            Trend analysis requires order history. Once you have sales data, seasonal patterns and
            insights will appear here.
          </ThemedText>
        </View>
      )}

      {/* Bottom Spacing */}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: REZ_COLORS.background,
  },
  scrollContent: {
    padding: 16,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: REZ_COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: REZ_COLORS.navy,
  },
  headerSubtitle: {
    fontSize: 14,
    color: REZ_COLORS.textSecondary,
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${REZ_COLORS.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Selector
  selectorContainer: {
    marginBottom: 16,
  },
  selectorScroll: {
    gap: 8,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: REZ_COLORS.cardBg,
    borderWidth: 1,
    borderColor: REZ_COLORS.border,
  },
  selectorButtonActive: {
    backgroundColor: REZ_COLORS.primary,
    borderColor: REZ_COLORS.primary,
  },
  selectorButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: REZ_COLORS.textSecondary,
  },
  selectorButtonTextActive: {
    color: REZ_COLORS.white,
  },

  // Warning Card
  warningCard: {
    flexDirection: 'row',
    backgroundColor: `${REZ_COLORS.warning}10`,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: REZ_COLORS.warning,
  },
  warningIcon: {
    marginRight: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: REZ_COLORS.navy,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: REZ_COLORS.textSecondary,
    lineHeight: 18,
  },

  // Trend Card
  trendCard: {
    backgroundColor: REZ_COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
    }),
  },
  trendCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  trendIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendCardInfo: {
    flex: 1,
    marginLeft: 14,
  },
  trendCardLabel: {
    fontSize: 13,
    color: REZ_COLORS.textSecondary,
    marginBottom: 4,
  },
  trendCardValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trendCardValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  growthBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Progress Bars
  progressBarsContainer: {
    gap: 14,
  },
  progressBarItem: {
    gap: 8,
  },
  progressBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBarLabel: {
    fontSize: 13,
    color: REZ_COLORS.textSecondary,
    fontWeight: '500',
  },
  progressBarValue: {
    fontSize: 13,
    color: REZ_COLORS.navy,
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: REZ_COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Section Card
  sectionCard: {
    backgroundColor: REZ_COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
    }),
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: REZ_COLORS.navy,
  },

  // Peaks Grid
  peaksGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  peakCard: {
    flex: 1,
    backgroundColor: REZ_COLORS.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 3,
  },
  peakIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  peakLabel: {
    fontSize: 12,
    color: REZ_COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 6,
  },
  peakValue: {
    fontSize: 20,
    fontWeight: '700',
    color: REZ_COLORS.navy,
    marginBottom: 4,
  },
  peakPeriod: {
    fontSize: 13,
    color: REZ_COLORS.textSecondary,
    marginBottom: 8,
  },
  indexBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  indexBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Season Card
  seasonCard: {
    backgroundColor: REZ_COLORS.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  seasonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  seasonTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seasonTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: REZ_COLORS.navy,
  },
  seasonBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  miniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  miniBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  seasonMetricsRow: {
    flexDirection: 'row',
  },
  seasonMetric: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  seasonMetricBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: REZ_COLORS.border,
  },
  seasonMetricLabel: {
    fontSize: 11,
    color: REZ_COLORS.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  seasonMetricValue: {
    fontSize: 15,
    fontWeight: '700',
    color: REZ_COLORS.navy,
  },

  // Forecast Card
  forecastCard: {
    borderWidth: 2,
    borderColor: REZ_COLORS.primary,
    backgroundColor: `${REZ_COLORS.primary}05`,
  },
  forecastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  forecastIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${REZ_COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  forecastTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: REZ_COLORS.primary,
  },
  forecastContent: {
    gap: 4,
  },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  forecastDivider: {
    height: 1,
    backgroundColor: REZ_COLORS.border,
  },
  forecastLabel: {
    fontSize: 14,
    color: REZ_COLORS.textSecondary,
  },
  forecastValue: {
    fontSize: 14,
    fontWeight: '600',
    color: REZ_COLORS.navy,
  },
  forecastValueLarge: {
    fontSize: 18,
    fontWeight: '700',
  },
  forecastTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  confidenceText: {
    color: REZ_COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: REZ_COLORS.cardBg,
    borderRadius: 16,
  },
  emptyIconContainer: {
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
    color: REZ_COLORS.navy,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: REZ_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },

  // Access Denied
  accessDeniedCard: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: REZ_COLORS.cardBg,
    borderRadius: 16,
    margin: 16,
  },
  accessDeniedIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${REZ_COLORS.error}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  accessDeniedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: REZ_COLORS.navy,
    marginBottom: 8,
  },
  accessDeniedText: {
    fontSize: 14,
    color: REZ_COLORS.textSecondary,
    textAlign: 'center',
  },

  // Loading
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: REZ_COLORS.textSecondary,
  },
});
