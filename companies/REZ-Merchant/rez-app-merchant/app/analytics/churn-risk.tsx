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
  ChurnAnalysisResult,
  ChurnSummary,
  ChurnPrediction,
  ChurnAlert,
} from '@/types/analytics';

const RISK_COLORS = {
  critical: '#dc2626',
  high: '#f59e0b',
  medium: '#eab308',
  low: '#22c55e',
};

const RISK_LABELS = {
  critical: 'Critical',
  high: 'High Risk',
  medium: 'Medium Risk',
  low: 'Low Risk',
};

export default function ChurnRiskScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ChurnSummary | null>(null);
  const [alerts, setAlerts] = useState<ChurnAlert[]>([]);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string | null>(null);
  const [atRiskCustomers, setAtRiskCustomers] = useState<ChurnPrediction[]>([]);

  const fetchData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      // Fetch churn summary
      const summaryRes = await apiClient.get<ChurnSummary>(
        'merchant/analytics/churn-prediction/summary'
      );

      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);

        // Fetch alerts
        const alertsRes = await apiClient.get<{ alerts: ChurnAlert[] }>(
          'merchant/analytics/churn-prediction/alerts'
        );
        if (alertsRes.success && alertsRes.data) {
          setAlerts(alertsRes.data.alerts || []);
        }
      } else {
        setError(summaryRes.message || 'Failed to load churn data');
      }
    } catch (err) {
      setError(err.message || 'Failed to load churn risk data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchAtRiskCustomers = useCallback(async (riskLevel: string) => {
    try {
      setSelectedRiskLevel(riskLevel);
      setLoading(true);

      const res = await apiClient.get<{ customers: ChurnPrediction[] }>(
        `merchant/analytics/churn-prediction/risk-level/${riskLevel}`
      );

      if (res.success && res.data) {
        setAtRiskCustomers(res.data.customers || []);
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const renderRiskCard = (title: string, count: number, risk: keyof typeof RISK_COLORS, percentage: number) => (
    <TouchableOpacity
      style={[styles.riskCard, { borderLeftColor: RISK_COLORS[risk] }]}
      onPress={() => fetchAtRiskCustomers(risk)}
    >
      <View style={styles.riskCardHeader}>
        <View style={[styles.riskBadge, { backgroundColor: RISK_COLORS[risk] }]}>
          <Text style={styles.riskBadgeText}>{RISK_LABELS[risk]}</Text>
        </View>
      </View>
      <Text style={styles.riskCount}>{count}</Text>
      <Text style={styles.riskPercentage}>{percentage.toFixed(1)}%</Text>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Churn Risk</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Analyzing customer churn...</Text>
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
        <Text style={styles.headerTitle}>Churn Risk Analysis</Text>
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
                <Text style={styles.sectionTitle}>Churn Overview</Text>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total Customers</Text>
                    <Text style={styles.summaryValue}>{summary.totalCustomers}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Avg Churn Prob.</Text>
                    <Text style={styles.summaryValue}>{summary.averageChurnProbability.toFixed(1)}%</Text>
                  </View>
                </View>
                <View style={styles.churnRateContainer}>
                  <Text style={styles.churnRateLabel}>Churn Rate</Text>
                  <Text
                    style={[
                      styles.churnRateValue,
                      {
                        color:
                          summary.churnRate > 30
                            ? '#dc2626'
                            : summary.churnRate > 15
                            ? '#f59e0b'
                            : '#22c55e',
                      },
                    ]}
                  >
                    {summary.churnRate.toFixed(1)}%
                  </Text>
                </View>
              </View>

              {/* Alerts Section */}
              {(summary.criticalAlerts > 0 || summary.warnings > 0) && (
                <View style={styles.alertsContainer}>
                  <Text style={styles.sectionTitle}>Active Alerts</Text>
                  {summary.criticalAlerts > 0 && (
                    <View style={[styles.alertBanner, styles.criticalAlert]}>
                      <Ionicons name="warning" size={20} color="#fff" />
                      <Text style={styles.alertBannerText}>
                        {summary.criticalAlerts} critical churn alerts
                      </Text>
                    </View>
                  )}
                  {summary.warnings > 0 && (
                    <View style={[styles.alertBanner, styles.warningAlert]}>
                      <Ionicons name="alert-circle" size={20} color="#fff" />
                      <Text style={styles.alertBannerText}>
                        {summary.warnings} warnings
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Risk Distribution */}
              <Text style={styles.sectionTitle}>Risk Distribution</Text>
              <View style={styles.riskGrid}>
                {renderRiskCard(
                  'Critical',
                  summary.riskDistribution.critical,
                  'critical',
                  summary.totalCustomers > 0
                    ? (summary.riskDistribution.critical / summary.totalCustomers) * 100
                    : 0
                )}
                {renderRiskCard(
                  'High Risk',
                  summary.riskDistribution.high,
                  'high',
                  summary.totalCustomers > 0
                    ? (summary.riskDistribution.high / summary.totalCustomers) * 100
                    : 0
                )}
                {renderRiskCard(
                  'Medium Risk',
                  summary.riskDistribution.medium,
                  'medium',
                  summary.totalCustomers > 0
                    ? (summary.riskDistribution.medium / summary.totalCustomers) * 100
                    : 0
                )}
                {renderRiskCard(
                  'Low Risk',
                  summary.riskDistribution.low,
                  'low',
                  summary.totalCustomers > 0
                    ? (summary.riskDistribution.low / summary.totalCustomers) * 100
                    : 0
                )}
              </View>

              {/* Customer List */}
              {selectedRiskLevel && (
                <View style={styles.customerSection}>
                  <View style={styles.customerSectionHeader}>
                    <Text style={styles.sectionTitle}>
                      {RISK_LABELS[selectedRiskLevel as keyof typeof RISK_LABELS]} Customers
                    </Text>
                    <TouchableOpacity onPress={() => setSelectedRiskLevel(null)}>
                      <Text style={styles.clearButton}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                  {atRiskCustomers.length > 0 ? (
                    atRiskCustomers.slice(0, 20).map((customer) => (
                      <View key={customer.userId} style={styles.customerCard}>
                        <View style={styles.customerHeader}>
                          <View
                            style={[
                              styles.customerRiskBadge,
                              { backgroundColor: RISK_COLORS[customer.churnRisk] },
                            ]}
                          >
                            <Text style={styles.customerRiskText}>
                              {customer.churnProbability}% risk
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.customerId}>ID: {customer.userId.slice(0, 8)}...</Text>
                        <Text style={styles.customerInfo}>
                          Last order: {customer.daysSinceLastOrder} days ago
                        </Text>
                        {customer.reasons.length > 0 && (
                          <Text style={styles.customerReasons}>
                            {customer.reasons.slice(0, 2).join(', ')}
                          </Text>
                        )}
                        <View style={styles.actionsContainer}>
                          {customer.recommendedActions.slice(0, 2).map((action, idx) => (
                            <View key={idx} style={styles.actionChip}>
                              <Text style={styles.actionChipText}>{action}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>No customers in this risk level</Text>
                  )}
                </View>
              )}

              {/* Recent Alerts */}
              {alerts.length > 0 && (
                <View style={styles.alertsListSection}>
                  <Text style={styles.sectionTitle}>Recent Alerts</Text>
                  {alerts.slice(0, 10).map((alert, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.alertItem,
                        {
                          borderLeftColor:
                            alert.severity === 'critical'
                              ? '#dc2626'
                              : alert.severity === 'warning'
                              ? '#f59e0b'
                              : '#3b82f6',
                        },
                      ]}
                    >
                      <Text style={styles.alertMessage}>{alert.message}</Text>
                      <Text style={styles.alertDate}>
                        {formatDate(alert.createdAt)}
                      </Text>
                    </View>
                  ))}
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
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: '700', color: '#111827' },
  churnRateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  churnRateLabel: { fontSize: 14, color: '#6b7280' },
  churnRateValue: { fontSize: 24, fontWeight: '700' },
  alertsContainer: { marginBottom: 16 },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  criticalAlert: { backgroundColor: '#dc2626' },
  warningAlert: { backgroundColor: '#f59e0b' },
  alertBannerText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  riskGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  riskCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  riskCardHeader: { marginBottom: 8 },
  riskBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start' },
  riskBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  riskCount: { fontSize: 28, fontWeight: '700', color: '#111827' },
  riskPercentage: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  customerSection: { marginBottom: 16 },
  customerSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearButton: { color: '#6366f1', fontSize: 14, fontWeight: '600' },
  customerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  customerHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  customerRiskBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  customerRiskText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  customerId: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  customerInfo: { fontSize: 14, color: '#374151', marginBottom: 4 },
  customerReasons: { fontSize: 12, color: '#9ca3af', fontStyle: 'italic', marginBottom: 8 },
  actionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  actionChip: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  actionChipText: { color: '#4f46e5', fontSize: 11 },
  noDataText: { color: '#9ca3af', fontSize: 14, textAlign: 'center', padding: 20 },
  alertsListSection: { marginBottom: 16 },
  alertItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
  },
  alertMessage: { fontSize: 14, color: '#374151', marginBottom: 4 },
  alertDate: { fontSize: 11, color: '#9ca3af' },
});
