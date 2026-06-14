/**
 * Sales Forecast Analytics Screen
 * AI-powered sales forecasting with confidence intervals and seasonal patterns
 * Production-ready with ReZ Design System and responsive layout
 */

import React, { useState } from 'react';
import { logger } from '@/utils/logger';
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
import { showAlert } from '@/utils/alert';
import { useQuery } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { analyticsService } from '@/services/api/analytics';
import { useHasPermission } from '@/hooks/usePermissions';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { SALES_FORECAST_AXIS_ZERO_LABEL } from '@/constants/merchantConstants';

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

type ForecastPeriod = 7 | 30 | 60 | 90;

export default function SalesForecastScreen() {
  const [forecastDays, setForecastDays] = useState<ForecastPeriod>(30);
  const [refreshing, setRefreshing] = useState(false);

  const { isDesktop, isTablet } = useResponsiveLayout();
  const canViewAnalytics = useHasPermission('analytics:view');
  const canExport = useHasPermission('analytics:export');

  const {
    data: forecast,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['sales-forecast', forecastDays],
    queryFn: () => analyticsService.getSalesForecast(forecastDays),
    enabled: canViewAnalytics,
    staleTime: 5 * 60 * 1000,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleExport = async () => {
    if (!canExport) {
      showAlert('Permission Denied', 'You do not have permission to export data.');
      return;
    }

    try {
      const exportResponse = await analyticsService.exportAnalytics({
        format: 'excel',
        reportTypes: ['sales_forecast'],
        includeCharts: true,
      });

      logger.debug('Download URL:', exportResponse.url);
      showAlert(
        'Export Successful',
        `Your forecast has been exported. File: ${exportResponse.filename}`
      );
    } catch (err) {
      showAlert('Export Failed', err.message);
    }
  };

  const forecastPeriods: { value: ForecastPeriod; label: string }[] = [
    { value: 7, label: '7 Days' },
    { value: 30, label: '30 Days' },
    { value: 60, label: '60 Days' },
    { value: 90, label: '90 Days' },
  ];

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      default:
        return 'remove';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return REZ_COLORS.success;
      case 'down':
        return REZ_COLORS.error;
      default:
        return REZ_COLORS.textSecondary;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return REZ_COLORS.success;
    if (confidence >= 60) return REZ_COLORS.warning;
    return REZ_COLORS.error;
  };

  // Responsive widths
  const contentMaxWidth = isDesktop ? 1200 : isTablet ? 900 : undefined;
  const cardMaxWidth = isDesktop ? 380 : isTablet ? 340 : undefined;

  // Period Selector Button
  const PeriodButton = ({ period }: { period: { value: ForecastPeriod; label: string } }) => (
    <TouchableOpacity
      style={[styles.periodButton, forecastDays === period.value && styles.periodButtonActive]}
      onPress={() => setForecastDays(period.value)}
    >
      <ThemedText
        style={[
          styles.periodButtonText,
          forecastDays === period.value && styles.periodButtonTextActive,
        ]}
      >
        {period.label}
      </ThemedText>
    </TouchableOpacity>
  );

  // Summary Card Component
  const SummaryCard = ({
    label,
    value,
    subtext,
    trend,
    trendValue,
    color,
  }: {
    label: string;
    value: string;
    subtext?: string;
    trend?: string;
    trendValue?: string;
    color?: string;
  }) => (
    <View
      style={[styles.summaryCard, { maxWidth: Platform.OS === 'web' ? cardMaxWidth : undefined }]}
    >
      <ThemedText style={styles.summaryLabel}>{label}</ThemedText>
      <ThemedText style={[styles.summaryValue, color ? { color } : null]}>{value}</ThemedText>
      {trend && trendValue && (
        <View style={styles.trendContainer}>
          <Ionicons name={getTrendIcon(trend) as unknown as keyof typeof Ionicons.glyphMap} size={16} color={getTrendColor(trend)} />
          <ThemedText style={[styles.trendText, { color: getTrendColor(trend) }]}>
            {trendValue}
          </ThemedText>
        </View>
      )}
      {subtext && <ThemedText style={styles.summarySubtext}>{subtext}</ThemedText>}
    </View>
  );

  // Forecast Chart Component
  const ForecastChart = () => {
    if (!forecast?.forecasts?.length) {
      return (
        <View style={styles.emptyChart}>
          <View style={styles.emptyChartIcon}>
            <Ionicons name="bar-chart-outline" size={48} color={REZ_COLORS.textMuted} />
          </View>
          <ThemedText style={styles.emptyChartText}>No forecast data available</ThemedText>
          <ThemedText style={styles.emptyChartSubtext}>
            Forecasts are generated based on your store's sales history
          </ThemedText>
        </View>
      );
    }

    const allValues = forecast.forecasts.map((f) => [f.forecasted, f.lower, f.upper]).flat();
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);
    const range = maxValue - minValue || 1;

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartArea}>
          {/* Y-axis */}
          <View style={styles.yAxis}>
            <ThemedText style={styles.axisLabel}>{formatCurrency(maxValue)}</ThemedText>
            <ThemedText style={styles.axisLabel}>{formatCurrency(maxValue * 0.5)}</ThemedText>
            <ThemedText style={styles.axisLabel}>{SALES_FORECAST_AXIS_ZERO_LABEL}</ThemedText>
          </View>

          {/* Chart plot area */}
          <View style={styles.chartPlot}>
            {/* Grid lines */}
            <View style={styles.gridLines}>
              {[0, 25, 50, 75, 100].map((i) => (
                <View key={i} style={[styles.gridLine, { top: `${i}%` }]} />
              ))}
            </View>

            {/* Confidence interval area */}
            <View style={styles.confidenceArea}>
              {forecast.forecasts.map((item, index) => {
                const x = (index / (forecast.forecasts.length - 1)) * 100;
                const yUpper = 100 - ((item.upper - minValue) / range) * 100;
                const yLower = 100 - ((item.lower - minValue) / range) * 100;
                const height = yLower - yUpper;

                return (
                  <View
                    key={`confidence-${index}`}
                    style={[
                      styles.confidenceBar,
                      { left: `${x}%`, top: `${yUpper}%`, height: `${height}%` },
                    ]}
                  />
                );
              })}
            </View>

            {/* Forecast points */}
            <View style={styles.forecastLine}>
              {forecast.forecasts.map((item, index) => {
                const x = (index / (forecast.forecasts.length - 1)) * 100;
                const y = 100 - ((item.forecasted - minValue) / range) * 100;

                return (
                  <View
                    key={`point-${index}`}
                    style={[styles.forecastPoint, { left: `${x}%`, top: `${y}%` }]}
                  />
                );
              })}
            </View>
          </View>
        </View>

        {/* X-axis */}
        <View style={styles.xAxis}>
          {forecast.forecasts
            .filter((_, index) => index % Math.ceil(forecast.forecasts.length / 5) === 0)
            .slice(0, 5)
            .map((item, index) => (
              <ThemedText key={index} style={styles.axisLabel}>
                {formatDate(item.period)}
              </ThemedText>
            ))}
        </View>
      </View>
    );
  };

  // Forecast Item Component
  const ForecastItem = ({ item, index }: { item; index: number }) => (
    <View style={styles.forecastItem}>
      <View style={styles.forecastItemLeft}>
        <ThemedText style={styles.forecastDate}>{formatDate(item.period)}</ThemedText>
        <View
          style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(item.confidence) }]}
        >
          <ThemedText style={styles.confidenceBadgeText}>{item.confidence.toFixed(0)}%</ThemedText>
        </View>
      </View>
      <View style={styles.forecastItemCenter}>
        <ThemedText style={styles.forecastValue}>{formatCurrency(item.forecasted)}</ThemedText>
        <ThemedText style={styles.forecastRange}>
          {formatCurrency(item.lower)} - {formatCurrency(item.upper)}
        </ThemedText>
      </View>
      <Ionicons
        name={getTrendIcon(item.trend) as unknown as keyof typeof Ionicons.glyphMap}
        size={20}
        color={getTrendColor(item.trend)}
      />
    </View>
  );

  // Access Denied State
  if (!canViewAnalytics) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <View style={styles.errorIcon}>
          <Ionicons name="lock-closed" size={48} color={REZ_COLORS.error} />
        </View>
        <ThemedText style={styles.errorTitle}>Access Denied</ThemedText>
        <ThemedText style={styles.errorText}>
          You don't have permission to view sales forecasts.
        </ThemedText>
      </ThemedView>
    );
  }

  // Loading State
  if (isLoading && !forecast) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={REZ_COLORS.primary} />
        <ThemedText style={styles.loadingText}>Generating forecast...</ThemedText>
        <ThemedText style={styles.loadingSubtext}>Analyzing historical data</ThemedText>
      </ThemedView>
    );
  }

  // Error State
  if (error && !forecast) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <View style={styles.errorIcon}>
          <Ionicons name="alert-circle" size={48} color={REZ_COLORS.error} />
        </View>
        <ThemedText style={styles.errorTitle}>Failed to Load</ThemedText>
        <ThemedText style={styles.errorText}>
          {error instanceof Error ? error.message : 'Unable to generate forecast'}
        </ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Ionicons name="refresh" size={20} color={REZ_COLORS.white} />
          <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

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
        {forecast?.metadata?.isSampleData && (
          <View style={styles.sampleDataBanner}>
            <Ionicons name="information-circle" size={20} color={REZ_COLORS.info} />
            <View style={styles.sampleDataContent}>
              <ThemedText style={styles.sampleDataTitle}>Sample Forecast Data</ThemedText>
              <ThemedText style={styles.sampleDataText}>
                This is demo data. Real forecasts will appear once your store has order history.
              </ThemedText>
            </View>
          </View>
        )}

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {forecastPeriods.map((period) => (
            <PeriodButton key={period.value} period={period} />
          ))}
          {canExport && (
            <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
              <Ionicons name="download-outline" size={20} color={REZ_COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Summary Cards */}
        {forecast?.summary && (
          <View style={styles.summaryGrid}>
            <SummaryCard
              label="Total Forecast"
              value={formatCurrency(forecast.summary.totalForecast)}
              trend={forecast.summary.trend}
              trendValue={`${(forecast.summary.growthRate * 100).toFixed(1)}% growth`}
            />
            <SummaryCard
              label="Daily Average"
              value={formatCurrency(forecast.summary.averageForecast)}
              subtext={`Method: ${forecast.method?.replace('_', ' ') || 'AI'}`}
            />
            <SummaryCard
              label="Model Accuracy"
              value={`${forecast.accuracy?.toFixed(1) || 0}%`}
              subtext="Based on historical data"
              color={getConfidenceColor(forecast.accuracy || 0)}
            />
          </View>
        )}

        {/* Forecast Chart */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Forecast Visualization</ThemedText>
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: REZ_COLORS.primary }]} />
                <ThemedText style={styles.legendText}>Forecast</ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: REZ_COLORS.info, opacity: 0.3 }]}
                />
                <ThemedText style={styles.legendText}>Confidence</ThemedText>
              </View>
            </View>
          </View>
          <ForecastChart />
        </View>

        {/* Metadata */}
        {forecast?.metadata && (
          <View style={styles.metadataGrid}>
            <View style={styles.metadataCard}>
              <View
                style={[
                  styles.metadataIcon,
                  {
                    backgroundColor: forecast.metadata.seasonalityDetected
                      ? `${REZ_COLORS.success}15`
                      : `${REZ_COLORS.textMuted}15`,
                  },
                ]}
              >
                <Ionicons
                  name={forecast.metadata.seasonalityDetected ? 'checkmark-circle' : 'close-circle'}
                  size={24}
                  color={
                    forecast.metadata.seasonalityDetected
                      ? REZ_COLORS.success
                      : REZ_COLORS.textMuted
                  }
                />
              </View>
              <View style={styles.metadataContent}>
                <ThemedText style={styles.metadataTitle}>Seasonality</ThemedText>
                <ThemedText style={styles.metadataText}>
                  {forecast.metadata.seasonalityDetected ? 'Detected in data' : 'Not detected'}
                </ThemedText>
              </View>
            </View>

            <View style={styles.metadataCard}>
              <View
                style={[
                  styles.metadataIcon,
                  {
                    backgroundColor:
                      forecast.metadata.volatility === 'low'
                        ? `${REZ_COLORS.success}15`
                        : forecast.metadata.volatility === 'medium'
                          ? `${REZ_COLORS.warning}15`
                          : `${REZ_COLORS.error}15`,
                  },
                ]}
              >
                <Ionicons
                  name="pulse"
                  size={24}
                  color={
                    forecast.metadata.volatility === 'low'
                      ? REZ_COLORS.success
                      : forecast.metadata.volatility === 'medium'
                        ? REZ_COLORS.warning
                        : REZ_COLORS.error
                  }
                />
              </View>
              <View style={styles.metadataContent}>
                <ThemedText style={styles.metadataTitle}>Volatility</ThemedText>
                <ThemedText style={styles.metadataText}>
                  {forecast.metadata.volatility?.toUpperCase() || 'N/A'} (
                  {forecast.metadata.dataPoints || 0} data points)
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Daily Breakdown */}
        {forecast?.forecasts && forecast.forecasts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Daily Breakdown</ThemedText>
              <ThemedText style={styles.sectionCount}>{forecast.forecasts.length} days</ThemedText>
            </View>
            <View style={styles.forecastList}>
              {forecast.forecasts.slice(0, 10).map((item, index) => (
                <ForecastItem key={index} item={item} index={index} />
              ))}
            </View>
            {forecast.forecasts.length > 10 && (
              <ThemedText style={styles.moreText}>
                + {forecast.forecasts.length - 10} more days
              </ThemedText>
            )}
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

  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: REZ_COLORS.white,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' }, default: {} }),
  },
  periodButtonActive: {
    backgroundColor: REZ_COLORS.primary,
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: REZ_COLORS.textSecondary,
  },
  periodButtonTextActive: {
    color: REZ_COLORS.white,
  },
  exportButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: `${REZ_COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' }, default: {} }),
  },

  // Summary Grid
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: REZ_COLORS.white,
    padding: 16,
    borderRadius: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: REZ_COLORS.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: REZ_COLORS.navy,
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 11,
    color: REZ_COLORS.textMuted,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Section
  section: {
    backgroundColor: REZ_COLORS.white,
    borderRadius: 16,
    padding: 20,
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

  // Legend
  legendContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: REZ_COLORS.textSecondary,
  },

  // Chart
  chartContainer: {
    height: 250,
  },
  chartArea: {
    flexDirection: 'row',
    height: 200,
  },
  yAxis: {
    width: 60,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  axisLabel: {
    fontSize: 10,
    color: REZ_COLORS.textMuted,
  },
  chartPlot: {
    flex: 1,
    position: 'relative',
    backgroundColor: REZ_COLORS.background,
    borderRadius: 8,
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: REZ_COLORS.border,
    opacity: 0.5,
  },
  confidenceArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confidenceBar: {
    position: 'absolute',
    width: 3,
    backgroundColor: REZ_COLORS.info,
    opacity: 0.3,
    borderRadius: 1,
  },
  forecastLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  forecastPoint: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: REZ_COLORS.primary,
    marginLeft: -5,
    marginTop: -5,
    borderWidth: 2,
    borderColor: REZ_COLORS.white,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingLeft: 68,
  },
  emptyChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: REZ_COLORS.background,
    borderRadius: 8,
  },
  emptyChartIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: REZ_COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyChartText: {
    color: REZ_COLORS.textMuted,
    fontSize: 14,
  },
  emptyChartSubtext: {
    color: REZ_COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  // Metadata Grid
  metadataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metadataCard: {
    flex: 1,
    minWidth: 160,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: REZ_COLORS.white,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  metadataIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metadataContent: {
    flex: 1,
  },
  metadataTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: REZ_COLORS.textPrimary,
    marginBottom: 2,
  },
  metadataText: {
    fontSize: 12,
    color: REZ_COLORS.textSecondary,
  },

  // Forecast List
  forecastList: {
    gap: 8,
  },
  forecastItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: REZ_COLORS.background,
    padding: 12,
    borderRadius: 10,
    gap: 12,
  },
  forecastItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 100,
  },
  forecastDate: {
    fontSize: 14,
    fontWeight: '600',
    color: REZ_COLORS.textPrimary,
  },
  forecastItemCenter: {
    flex: 1,
    alignItems: 'flex-end',
  },
  forecastValue: {
    fontSize: 16,
    fontWeight: '700',
    color: REZ_COLORS.navy,
  },
  forecastRange: {
    fontSize: 11,
    color: REZ_COLORS.textMuted,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  confidenceBadgeText: {
    color: REZ_COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  moreText: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 13,
    color: REZ_COLORS.textSecondary,
  },

  // States
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
    maxWidth: 280,
  },
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
});
