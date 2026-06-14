import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { apiClient } from '@/services/api/client';
import type {
  LTVSummary,
  LTVMetrics,
  LTVSegmentProfile,
  LTVSegment,
} from '@/types/analytics';

const SEGMENT_COLORS: Record<LTVSegment, string> = {
  VIP: '#8b5cf6',
  High: '#10b981',
  Medium: '#f59e0b',
  Low: '#6b7280',
};

const SEGMENT_BG_COLORS: Record<LTVSegment, string> = {
  VIP: '#ede9fe',
  High: '#d1fae5',
  Medium: '#fef3c7',
  Low: '#f3f4f6',
};

export default function LTVSegmentsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<LTVSummary | null>(null);
  const [segmentProfiles, setSegmentProfiles] = useState<LTVSegmentProfile[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<LTVSegment | null>(null);
  const [segmentCustomers, setSegmentCustomers] = useState<LTVMetrics[]>([]);

  const fetchData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      // Fetch LTV summary
      const summaryRes = await apiClient.get<LTVSummary>(
        'merchant/analytics/ltv/summary'
      );

      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);

        // Fetch segment profiles
        const profilesRes = await apiClient.get<{ segments: LTVSegmentProfile[] }>(
          'merchant/analytics/ltv/segments'
        );

        if (profilesRes.success && profilesRes.data) {
          setSegmentProfiles(profilesRes.data.segments || []);
        }
      } else {
        setError(summaryRes.message || 'Failed to load LTV data');
      }
    } catch (err) {
      setError(err.message || 'Failed to load LTV segments data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchSegmentCustomers = useCallback(async (segment: LTVSegment) => {
    try {
      setSelectedSegment(segment);
      setLoading(true);

      const res = await apiClient.get<{ customers: LTVMetrics[] }>(
        `merchant/analytics/ltv/segment/${segment}`
      );

      if (res.success && res.data) {
        setSegmentCustomers(res.data.customers || []);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  const formatCurrency = (value: number) =>
    `Rs.${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const renderSegmentCard = (profile: LTVSegmentProfile) => (
    <TouchableOpacity
      key={profile.segment}
      style={[styles.segmentCard, { borderLeftColor: SEGMENT_COLORS[profile.segment] }]}
      onPress={() => fetchSegmentCustomers(profile.segment)}
    >
      <View style={styles.segmentHeader}>
        <View
          style={[styles.segmentBadge, { backgroundColor: SEGMENT_BG_COLORS[profile.segment] }]}
        >
          <Text style={[styles.segmentBadgeText, { color: SEGMENT_COLORS[profile.segment] }]}>
            {profile.segment}
          </Text>
        </View>
        <Text style={styles.segmentCount}>{profile.count} customers</Text>
      </View>

      <View style={styles.segmentMetrics}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Avg LTV</Text>
          <Text style={styles.metricValue}>{formatCurrency(profile.averageLTV)}</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Total LTV</Text>
          <Text style={styles.metricValue}>{formatCurrency(profile.totalLTV)}</Text>
        </View>
      </View>

      <View style={styles.segmentPercentageRow}>
        <Text style={styles.percentageText}>
          {profile.percentageOfCustomers.toFixed(1)}% of customers
        </Text>
        <Text style={styles.percentageText}>
          {profile.percentageOfTotalLTV.toFixed(1)}% of total LTV
        </Text>
      </View>

      {profile.recommendedActions.length > 0 && (
        <View style={styles.actionsPreview}>
          <Text style={styles.actionsLabel}>Top Action:</Text>
          <Text style={styles.actionText} numberOfLines={1}>
            {profile.recommendedActions[0]}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>LTV Segments</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Analyzing customer value...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>LTV Segments</Text>
        <View style={{ width: 40 }} />
      </View>

      {error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchData()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {summary && (
            <>
              {/* Summary Card */}
              <View style={styles.summaryCard}>
                <Text style={styles.sectionTitle}>Lifetime Value Overview</Text>

                <View style={styles.summaryGrid}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total LTV</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(summary.totalLTV)}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Avg LTV</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(summary.averageLTV)}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Median LTV</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(summary.medianLTV)}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Customers</Text>
                    <Text style={styles.summaryValue}>{summary.totalCustomers}</Text>
                  </View>
                </View>

                {/* VIP Highlight */}
                {summary.vipPercentage > 0 && (
                  <View style={styles.vipHighlight}>
                    <View style={styles.vipHighlightIcon}>
                      <Ionicons name="diamond" size={20} color="#8b5cf6" />
                    </View>
                    <View style={styles.vipHighlightContent}>
                      <Text style={styles.vipHighlightTitle}>VIP Customers</Text>
                      <Text style={styles.vipHighlightText}>
                        {summary.segmentDistribution.vip} VIPs contribute{' '}
                        {summary.vipPercentage.toFixed(1)}% of total LTV (
                        {formatCurrency(summary.vipTotalLTV)})
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Segment Distribution Bar */}
              <View style={styles.distributionSection}>
                <Text style={styles.sectionTitle}>Segment Distribution</Text>
                <View style={styles.distributionBar}>
                  {segmentProfiles
                    .filter((p) => p.count > 0)
                    .sort((a, b) => {
                      const order: LTVSegment[] = ['VIP', 'High', 'Medium', 'Low'];
                      return order.indexOf(a.segment) - order.indexOf(b.segment);
                    })
                    .map((profile) => (
                      <View
                        key={profile.segment}
                        style={[
                          styles.distributionSegment,
                          {
                            backgroundColor: SEGMENT_COLORS[profile.segment],
                            flex: profile.percentageOfCustomers || 0.01,
                          },
                        ]}
                      />
                    ))}
                </View>
                <View style={styles.distributionLegend}>
                  {['VIP', 'High', 'Medium', 'Low'].map((seg) => {
                    const profile = segmentProfiles.find((p) => p.segment === seg);
                    return (
                      <View key={seg} style={styles.legendItem}>
                        <View
                          style={[
                            styles.legendDot,
                            { backgroundColor: SEGMENT_COLORS[seg as LTVSegment] },
                          ]}
                        />
                        <Text style={styles.legendText}>
                          {seg}: {profile?.count || 0}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Segment Cards */}
              <Text style={styles.sectionTitle}>Segments</Text>
              {segmentProfiles
                .filter((p) => p.count > 0)
                .sort((a, b) => {
                  const order: LTVSegment[] = ['VIP', 'High', 'Medium', 'Low'];
                  return order.indexOf(a.segment) - order.indexOf(b.segment);
                })
                .map(renderSegmentCard)}

              {/* Customer List */}
              {selectedSegment && (
                <View style={styles.customerSection}>
                  <View style={styles.customerSectionHeader}>
                    <Text style={styles.sectionTitle}>{selectedSegment} Customers</Text>
                    <TouchableOpacity onPress={() => setSelectedSegment(null)}>
                      <Text style={styles.clearButton}>Clear</Text>
                    </TouchableOpacity>
                  </View>

                  {segmentCustomers.length > 0 ? (
                    <>
                      {/* Top Customer */}
                      <View style={styles.topCustomerCard}>
                        <View style={styles.topCustomerHeader}>
                          <Ionicons name="trophy" size={24} color="#f59e0b" />
                          <Text style={styles.topCustomerLabel}>Top Customer</Text>
                        </View>
                        <View style={styles.topCustomerInfo}>
                          <Text style={styles.topCustomerId}>
                            ID: {segmentCustomers[0].userId.slice(0, 8)}...
                          </Text>
                          <Text style={styles.topCustomerLtv}>
                            LTV: {formatCurrency(segmentCustomers[0].ltv)}
                          </Text>
                        </View>
                        <View style={styles.topCustomerMetrics}>
                          <View style={styles.topCustomerMetric}>
                            <Text style={styles.topCustomerMetricLabel}>Orders</Text>
                            <Text style={styles.topCustomerMetricValue}>
                              {segmentCustomers[0].totalOrders}
                            </Text>
                          </View>
                          <View style={styles.topCustomerMetric}>
                            <Text style={styles.topCustomerMetricLabel}>Total Spent</Text>
                            <Text style={styles.topCustomerMetricValue}>
                              {formatCurrency(segmentCustomers[0].totalSpent)}
                            </Text>
                          </View>
                          <View style={styles.topCustomerMetric}>
                            <Text style={styles.topCustomerMetricLabel}>AOV</Text>
                            <Text style={styles.topCustomerMetricValue}>
                              {formatCurrency(segmentCustomers[0].averageOrderValue)}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Other Customers */}
                      {segmentCustomers.slice(1, 11).map((customer, idx) => (
                        <View key={customer.userId} style={styles.customerCard}>
                          <View style={styles.customerRank}>
                            <Text style={styles.customerRankText}>#{idx + 2}</Text>
                          </View>
                          <View style={styles.customerInfo}>
                            <Text style={styles.customerId}>
                              ID: {customer.userId.slice(0, 8)}...
                            </Text>
                            <Text style={styles.customerMetrics}>
                              {customer.totalOrders} orders | AOV:{' '}
                              {formatCurrency(customer.averageOrderValue)}
                            </Text>
                          </View>
                          <View style={styles.customerLtv}>
                            <Text style={styles.customerLtvValue}>
                              {formatCurrency(customer.ltv)}
                            </Text>
                            <View
                              style={[
                                styles.confidenceBadge,
                                {
                                  backgroundColor:
                                    customer.confidence === 'high'
                                      ? '#d1fae5'
                                      : customer.confidence === 'medium'
                                      ? '#fef3c7'
                                      : '#f3f4f6',
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.confidenceText,
                                  {
                                    color:
                                      customer.confidence === 'high'
                                        ? '#059669'
                                        : customer.confidence === 'medium'
                                        ? '#d97706'
                                        : '#6b7280',
                                  },
                                ]}
                              >
                                {customer.confidence}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </>
                  ) : (
                    <Text style={styles.noDataText}>No customers in this segment</Text>
                  )}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6b7280' },
  errorText: { marginTop: 12, fontSize: 14, color: '#ef4444', textAlign: 'center' },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: { color: '#fff', fontWeight: '600' },
  scrollContent: { padding: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  summaryItem: {
    width: '50%',
    paddingVertical: 8,
  },
  summaryLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  vipHighlight: {
    flexDirection: 'row',
    backgroundColor: '#ede9fe',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  vipHighlightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vipHighlightContent: { flex: 1 },
  vipHighlightTitle: { fontSize: 14, fontWeight: '700', color: '#7c3aed', marginBottom: 4 },
  vipHighlightText: { fontSize: 12, color: '#6b7280' },
  distributionSection: { marginBottom: 16 },
  distributionBar: {
    flexDirection: 'row',
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  distributionSegment: {
    height: '100%',
    minWidth: 4,
  },
  distributionLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#6b7280' },
  segmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  segmentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  segmentBadgeText: { fontSize: 14, fontWeight: '700' },
  segmentCount: { fontSize: 12, color: '#6b7280' },
  segmentMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricItem: {},
  metricLabel: { fontSize: 11, color: '#9ca3af', marginBottom: 2 },
  metricValue: { fontSize: 16, fontWeight: '600', color: '#111827' },
  segmentPercentageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  percentageText: { fontSize: 11, color: '#9ca3af' },
  actionsPreview: {
    flexDirection: 'row',
    marginTop: 8,
    alignItems: 'center',
    gap: 4,
  },
  actionsLabel: { fontSize: 11, color: '#6b7280', fontWeight: '600' },
  actionText: { fontSize: 11, color: '#4f46e5', flex: 1 },
  customerSection: { marginTop: 8 },
  customerSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearButton: { color: '#6366f1', fontSize: 14, fontWeight: '600' },
  topCustomerCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  topCustomerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  topCustomerLabel: { fontSize: 14, fontWeight: '700', color: '#92400e' },
  topCustomerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  topCustomerId: { fontSize: 12, color: '#6b7280' },
  topCustomerLtv: { fontSize: 16, fontWeight: '700', color: '#111827' },
  topCustomerMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topCustomerMetric: { alignItems: 'center' },
  topCustomerMetricLabel: { fontSize: 10, color: '#9ca3af', marginBottom: 2 },
  topCustomerMetricValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  customerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  customerRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerRankText: { fontSize: 12, fontWeight: '700', color: '#6b7280' },
  customerInfo: { flex: 1 },
  customerId: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  customerMetrics: { fontSize: 12, color: '#374151' },
  customerLtv: { alignItems: 'flex-end' },
  customerLtvValue: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  confidenceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  confidenceText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  noDataText: { color: '#9ca3af', fontSize: 14, textAlign: 'center', padding: 20 },
});
