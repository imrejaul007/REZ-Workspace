/**
 * Demand Forecast Screen
 * AI-powered demand forecasting with pattern detection and predictions
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

interface ForecastDay {
  date: string;
  predictedOrders: number;
  predictedRevenue: number;
  confidence: number;
  demandLevel: 'low' | 'medium' | 'high';
  factors: string[];
}

interface Pattern {
  type: string;
  description: string;
  impact: number;
  confidence: number;
}

interface DemandSignal {
  type: 'high_demand' | 'low_demand' | 'stock_alert' | 'opportunity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestedAction: string;
}

export default function DemandForecastScreen() {
  const [horizon, setHorizon] = useState<7 | 14 | 30>(7);
  const [refreshing, setRefreshing] = useState(false);
  const [historicalDays, setHistoricalDays] = useState(90);

  const { activeStore } = useStore();
  const storeId = activeStore?._id;

  React.useEffect(() => {
    if (storeId) {
      analyticsService.setActiveStore(storeId);
    }
  }, [storeId]);

  const canViewAnalytics = useHasPermission('analytics:view');

  // Fetch forecast data
  const {
    data: forecast,
    isLoading: forecastLoading,
    error: forecastError,
    refetch: refetchForecast,
  } = useQuery({
    queryKey: ['demand-forecast', storeId, horizon, historicalDays],
    queryFn: () => analyticsService.getDemandForecast(horizon, historicalDays),
    enabled: canViewAnalytics && !!storeId,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch demand signals
  const {
    data: signals,
    refetch: refetchSignals,
  } = useQuery({
    queryKey: ['demand-signals', storeId, horizon],
    queryFn: () => analyticsService.getDemandSignals(horizon),
    enabled: canViewAnalytics && !!storeId,
    staleTime: 5 * 60 * 1000,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchForecast(), refetchSignals()]);
    setRefreshing(false);
  };

  const horizonOptions: { key: 7 | 14 | 30; label: string }[] = [
    { key: 7, label: '7 Days' },
    { key: 14, label: '14 Days' },
    { key: 30, label: '30 Days' },
  ];

  const getDemandLevelColor = (level: string) => {
    switch (level) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getDemandLevelIcon = (level: string) => {
    switch (level) {
      case 'high': return 'trending-up';
      case 'medium': return 'trending-forward';
      case 'low': return 'trending-down';
      default: return 'remove';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'high_demand': return 'arrow-up-circle';
      case 'low_demand': return 'arrow-down-circle';
      case 'opportunity': return 'star';
      case 'stock_alert': return 'warning';
      default: return 'information-circle';
    }
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

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
        <ThemedText style={styles.noAccessText}>Please select a store to view forecasts</ThemedText>
      </ThemedView>
    );
  }

  if (forecastLoading && !forecast) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <ThemedText style={styles.loadingText}>Analyzing demand patterns...</ThemedText>
      </ThemedView>
    );
  }

  if (forecastError) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle" size={48} color={Colors.light.error} />
        <ThemedText style={styles.errorText}>Failed to load forecast</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetchForecast()}>
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const forecasts: ForecastDay[] = forecast?.forecasts || [];
  const patterns: Pattern[] = forecast?.patterns || [];
  const demandSignals: DemandSignal[] = signals?.signals || [];
  const recommendations: string[] = forecast?.recommendations || [];

  // Calculate summary stats
  const highDemandDays = forecasts.filter(f => f.demandLevel === 'high').length;
  const lowDemandDays = forecasts.filter(f => f.demandLevel === 'low').length;
  const avgOrders = forecasts.length > 0
    ? forecasts.reduce((sum, f) => sum + f.predictedOrders, 0) / forecasts.length
    : 0;
  const avgRevenue = forecasts.length > 0
    ? forecasts.reduce((sum, f) => sum + f.predictedRevenue, 0) / forecasts.length
    : 0;
  const totalPredictedOrders = forecasts.reduce((sum, f) => sum + f.predictedOrders, 0);
  const totalPredictedRevenue = forecasts.reduce((sum, f) => sum + f.predictedRevenue, 0);

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

      {/* Header */}
      <View style={styles.headerSection}>
        <View style={styles.headerTop}>
          <View>
            <ThemedText style={styles.headerTitle}>Demand Forecast</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              AI-powered predictions for the next {horizon} days
            </ThemedText>
          </View>
          <TouchableOpacity
            style={styles.pricingButton}
            onPress={() => router.push('/analytics/pricing-suggestions')}
          >
            <Ionicons name="pricetag" size={18} color={Colors.light.primary} />
            <ThemedText style={styles.pricingButtonText}>Pricing</ThemedText>
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
        <View style={[styles.summaryCard, { backgroundColor: '#FEE2E2' }]}>
          <Ionicons name="trending-up" size={24} color="#dc2626" />
          <ThemedText style={styles.summaryValue}>{highDemandDays}</ThemedText>
          <ThemedText style={styles.summaryLabel}>High Demand Days</ThemedText>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#DCFCE7' }]}>
          <Ionicons name="trending-down" size={24} color="#16a34a" />
          <ThemedText style={styles.summaryValue}>{lowDemandDays}</ThemedText>
          <ThemedText style={styles.summaryLabel}>Low Demand Days</ThemedText>
        </View>
      </View>

      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, { backgroundColor: '#DBEAFE' }]}>
          <Ionicons name="receipt" size={24} color="#2563eb" />
          <ThemedText style={styles.summaryValue}>{Math.round(avgOrders)}</ThemedText>
          <ThemedText style={styles.summaryLabel}>Avg Daily Orders</ThemedText>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="cash" size={24} color="#d97706" />
          <ThemedText style={styles.summaryValue}>{formatCurrency(avgRevenue)}</ThemedText>
          <ThemedText style={styles.summaryLabel}>Avg Daily Revenue</ThemedText>
        </View>
      </View>

      {/* Total Predictions */}
      <View style={styles.totalSection}>
        <View style={styles.totalItem}>
          <ThemedText style={styles.totalLabel}>Total Predicted Orders</ThemedText>
          <ThemedText style={styles.totalValue}>{totalPredictedOrders.toLocaleString()}</ThemedText>
        </View>
        <View style={styles.totalDivider} />
        <View style={styles.totalItem}>
          <ThemedText style={styles.totalLabel}>Total Predicted Revenue</ThemedText>
          <ThemedText style={styles.totalValue}>{formatCurrency(totalPredictedRevenue)}</ThemedText>
        </View>
      </View>

      {/* Demand Signals */}
      {demandSignals.length > 0 && (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Demand Signals</ThemedText>
          {demandSignals.map((signal, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.signalCard,
                { borderLeftColor: getSeverityColor(signal.severity) },
              ]}
            >
              <View style={styles.signalHeader}>
                <Ionicons
                  name={getSignalIcon(signal.type) as unknown}
                  size={20}
                  color={getSeverityColor(signal.severity)}
                />
                <View style={styles.signalBadge}>
                  <Text style={[styles.signalBadgeText, { color: getSeverityColor(signal.severity) }]}>
                    {signal.severity.toUpperCase()}
                  </Text>
                </View>
              </View>
              <ThemedText style={styles.signalMessage}>{signal.message}</ThemedText>
              <View style={styles.signalAction}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.light.primary} />
                <ThemedText style={styles.signalActionText}>{signal.suggestedAction}</ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Detected Patterns */}
      {patterns.length > 0 && (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Detected Patterns</ThemedText>
          <View style={styles.patternsContainer}>
            {patterns.map((pattern, index) => (
              <View key={index} style={styles.patternCard}>
                <View style={styles.patternHeader}>
                  <Ionicons
                    name={
                      pattern.type === 'weekend_peak' ? 'calendar' :
                      pattern.type === 'weekday_low' ? 'business' :
                      pattern.type === 'seasonal' ? 'leaf' :
                      pattern.type === 'trend' ? 'trending-up' : 'pulse'
                    }
                    size={18}
                    color={Colors.light.primary}
                  />
                  <ThemedText style={styles.patternType}>
                    {pattern.type.replace('_', ' ').toUpperCase()}
                  </ThemedText>
                </View>
                <ThemedText style={styles.patternDescription}>{pattern.description}</ThemedText>
                <View style={styles.patternMeta}>
                  <Text style={styles.patternImpact}>Impact: +{pattern.impact.toFixed(0)}%</Text>
                  <Text style={styles.patternConfidence}>Confidence: {(pattern.confidence * 100).toFixed(0)}%</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Forecast Timeline */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Forecast Timeline</ThemedText>
        {forecasts.map((day, index) => (
          <View key={index} style={styles.forecastDay}>
            <View style={styles.forecastDate}>
              <ThemedText style={styles.forecastDateText}>{formatDate(day.date)}</ThemedText>
            </View>
            <View style={styles.forecastContent}>
              <View style={styles.forecastMetrics}>
                <View style={styles.forecastMetric}>
                  <Ionicons name="receipt-outline" size={14} color={Colors.light.textSecondary} />
                  <ThemedText style={styles.forecastMetricValue}>{day.predictedOrders} orders</ThemedText>
                </View>
                <View style={styles.forecastMetric}>
                  <Ionicons name="cash-outline" size={14} color={Colors.light.textSecondary} />
                  <ThemedText style={styles.forecastMetricValue}>{formatCurrency(day.predictedRevenue)}</ThemedText>
                </View>
              </View>
              <View style={styles.forecastRight}>
                <View
                  style={[
                    styles.demandBadge,
                    { backgroundColor: getDemandLevelColor(day.demandLevel) + '20' },
                  ]}
                >
                  <Ionicons
                    name={getDemandLevelIcon(day.demandLevel) as unknown}
                    size={14}
                    color={getDemandLevelColor(day.demandLevel)}
                  />
                  <Text style={[styles.demandBadgeText, { color: getDemandLevelColor(day.demandLevel) }]}>
                    {day.demandLevel.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>{(day.confidence * 100).toFixed(0)}%</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Recommendations</ThemedText>
          {recommendations.slice(0, 5).map((rec, index) => (
            <View key={index} style={styles.recommendationItem}>
              <View style={styles.recommendationBullet}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.light.primary} />
              </View>
              <ThemedText style={styles.recommendationText}>{rec}</ThemedText>
            </View>
          ))}
        </View>
      )}

      {/* Historical Analysis */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Historical Analysis</ThemedText>
          <TouchableOpacity
            style={styles.analysisToggle}
            onPress={() => setHistoricalDays(historicalDays === 90 ? 180 : 90)}
          >
            <ThemedText style={styles.analysisToggleText}>
              {historicalDays} days
            </ThemedText>
          </TouchableOpacity>
        </View>
        <View style={styles.analysisCard}>
          <View style={styles.analysisRow}>
            <ThemedText style={styles.analysisLabel}>Period</ThemedText>
            <ThemedText style={styles.analysisValue}>
              {historicalDays} days ending today
            </ThemedText>
          </View>
          <View style={styles.analysisRow}>
            <ThemedText style={styles.analysisLabel}>Total Orders</ThemedText>
            <ThemedText style={styles.analysisValue}>
              {(forecast?.historicalAnalysis?.totalOrders || 0).toLocaleString()}
            </ThemedText>
          </View>
          <View style={styles.analysisRow}>
            <ThemedText style={styles.analysisLabel}>Total Revenue</ThemedText>
            <ThemedText style={styles.analysisValue}>
              {formatCurrency(forecast?.historicalAnalysis?.totalRevenue || 0)}
            </ThemedText>
          </View>
          <View style={styles.analysisRow}>
            <ThemedText style={styles.analysisLabel}>Avg Daily Orders</ThemedText>
            <ThemedText style={styles.analysisValue}>
              {forecast?.historicalAnalysis?.avgDailyOrders?.toFixed(1) || 0}
            </ThemedText>
          </View>
          <View style={styles.analysisRow}>
            <ThemedText style={styles.analysisLabel}>Avg Daily Revenue</ThemedText>
            <ThemedText style={styles.analysisValue}>
              {formatCurrency(forecast?.historicalAnalysis?.avgDailyRevenue || 0)}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <ThemedText style={styles.footerText}>
          Generated: {forecast?.generatedAt ? formatTime(forecast.generatedAt) : 'N/A'}
        </ThemedText>
        <ThemedText style={styles.footerSubtext}>
          Predictions based on historical data and AI pattern analysis
        </ThemedText>
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
  pricingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  pricingButtonText: {
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
    marginBottom: 12,
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

  // Total Section
  totalSection: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalItem: {
    flex: 1,
    alignItems: 'center',
  },
  totalDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.light.border,
    marginHorizontal: 16,
  },
  totalLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  totalValue: {
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  analysisToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 6,
  },
  analysisToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
  },

  // Signal Cards
  signalCard: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
  },
  signalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  signalBadge: {
    marginLeft: 'auto',
  },
  signalBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  signalMessage: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  signalAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  signalActionText: {
    fontSize: 12,
    color: Colors.light.primary,
    flex: 1,
  },

  // Patterns
  patternsContainer: {
    gap: 8,
  },
  patternCard: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  patternType: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  patternDescription: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
  },
  patternMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  patternImpact: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
  },
  patternConfidence: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },

  // Forecast Timeline
  forecastDay: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  forecastDate: {
    width: 80,
  },
  forecastDateText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  forecastContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forecastMetrics: {
    gap: 4,
  },
  forecastMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  forecastMetricValue: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  forecastRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  demandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  demandBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  confidenceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 10,
    color: Colors.light.textSecondary,
  },

  // Recommendations
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  recommendationBullet: {
    marginRight: 10,
    marginTop: 2,
  },
  recommendationText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
  },

  // Analysis Card
  analysisCard: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
  },
  analysisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  analysisLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  analysisValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
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
});
