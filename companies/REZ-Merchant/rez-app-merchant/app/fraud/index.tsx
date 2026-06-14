/**
 * Merchant Fraud Visibility — read-only view of anomaly alerts
 * and cashback fraud metrics scoped to this merchant's transactions.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import fraudService, { AnomalyAlert, FraudStatus } from '@/services/api/fraud';
import { logger } from '@/utils/logger';

const ALERT_TYPE_LABELS: Record<string, string> = {
  high_coin_velocity: 'High Coin Velocity',
  payment_failure_spike: 'Payment Failure Spike',
  revenue_anomaly: 'Revenue Anomaly',
};

const STATUS_COLORS: Record<string, string> = {
  monitoring: '#f59e0b',
  reviewed: '#3b82f6',
  dismissed: '#6b7280',
  escalated: '#ef4444',
};

export default function FraudAlertsScreen() {
  const [status, setStatus] = useState<FraudStatus | null>(null);
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [statusRes, alertsRes] = await Promise.all([
        fraudService.getStatus(),
        fraudService.getAlerts({ limit: 20 }),
      ]);
      if (statusRes.data?.data) setStatus(statusRes.data.data);
      if (alertsRes.data?.data?.items) setAlerts(alertsRes.data.data.items);
    } catch (err) {
      logger.error('Failed to load fraud data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <ThemedText style={styles.title}>Fraud & Security</ThemedText>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Summary Cards */}
        {status && (
          <View style={styles.cardsRow}>
            <View style={[styles.card, { borderLeftColor: '#f59e0b' }]}>
              <ThemedText style={styles.cardValue}>{status.anomalies.total}</ThemedText>
              <ThemedText style={styles.cardLabel}>Anomalies (30d)</ThemedText>
            </View>
            <View style={[styles.card, { borderLeftColor: '#ef4444' }]}>
              <ThemedText style={styles.cardValue}>{status.anomalies.escalated}</ThemedText>
              <ThemedText style={styles.cardLabel}>Escalated</ThemedText>
            </View>
            <View style={[styles.card, { borderLeftColor: '#3b82f6' }]}>
              <ThemedText style={styles.cardValue}>{status.cashback.fraudRate}%</ThemedText>
              <ThemedText style={styles.cardLabel}>Fraud Rate</ThemedText>
            </View>
          </View>
        )}

        {/* Cashback Fraud Summary */}
        {status && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Cashback Fraud Summary</ThemedText>
            <View style={styles.statRow}>
              <ThemedText style={styles.statLabel}>Total Requests</ThemedText>
              <ThemedText style={styles.statValue}>{status.cashback.totalRequests}</ThemedText>
            </View>
            <View style={styles.statRow}>
              <ThemedText style={styles.statLabel}>Flagged for Review</ThemedText>
              <ThemedText style={[styles.statValue, { color: '#f59e0b' }]}>
                {status.cashback.flaggedRequests}
              </ThemedText>
            </View>
            <View style={styles.statRow}>
              <ThemedText style={styles.statLabel}>High Risk</ThemedText>
              <ThemedText style={[styles.statValue, { color: '#ef4444' }]}>
                {status.cashback.highRiskRequests}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Anomaly Alerts List */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Recent Anomaly Alerts</ThemedText>
          {loading && <ThemedText style={styles.emptyText}>Loading...</ThemedText>}
          {!loading && alerts.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="shield-checkmark-outline" size={48} color="#10b981" />
              <ThemedText style={styles.emptyText}>No anomalies detected</ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Your store transactions look clean
              </ThemedText>
            </View>
          )}
          {alerts.map((alert) => (
            <TouchableOpacity
              key={alert._id}
              style={styles.alertCard}
              onPress={() => router.push(`/fraud/${alert._id}`)}
            >
              <View style={styles.alertHeader}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: STATUS_COLORS[alert.status] || '#6b7280' },
                  ]}
                >
                  <ThemedText style={styles.statusText}>{alert.status}</ThemedText>
                </View>
                <ThemedText style={styles.alertDate}>
                  {new Date(alert.flaggedAt).toLocaleDateString()}
                </ThemedText>
              </View>
              <ThemedText style={styles.alertType}>
                {ALERT_TYPE_LABELS[alert.type] || alert.type}
              </ThemedText>
              {alert.value != null && alert.threshold != null && (
                <ThemedText style={styles.alertDetail}>
                  Value: {alert.value} (threshold: {alert.threshold})
                </ThemedText>
              )}
              {alert.coinsEarned != null && (
                <ThemedText style={styles.alertDetail}>
                  Coins earned: {alert.coinsEarned} in {alert.windowMinutes}min window
                </ThemedText>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: { marginRight: 12 },
  title: { fontSize: 20, fontWeight: '700' },
  scroll: { flex: 1 },
  cardsRow: { flexDirection: 'row', padding: 16, gap: 10 },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardValue: { fontSize: 22, fontWeight: '700' },
  cardLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  statLabel: { fontSize: 14, color: '#475569' },
  statValue: { fontSize: 14, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, fontWeight: '600', marginTop: 12, color: '#64748b' },
  emptySubtext: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600', color: '#fff', textTransform: 'uppercase' },
  alertDate: { fontSize: 12, color: '#94a3b8' },
  alertType: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  alertDetail: { fontSize: 13, color: '#64748b' },
});
