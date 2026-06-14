/**
 * Salon Earnings - Commission and earnings tracking
 *
 * Features:
 * - View earnings summary
 * - Commission breakdown by service
 * - Daily/weekly/monthly earnings
 * - Staff earnings
 * - Payout history
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { EarningsChart } from './components/EarningsChart';
import { salonService, EarningsSummary, EarningTransaction, StaffEarning } from '@/services/api/salon';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  headerSpacer: {
    width: 32,
  },
  periodTabs: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: Colors.light.background,
    gap: 8,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  periodTabActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  periodTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  periodTabTextActive: {
    color: '#fff',
  },
  summarySection: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  chartSection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  chartCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  chartContainer: {
    height: 200,
    marginTop: 8,
  },
  breakdownList: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  breakdownItemLast: {
    borderBottomWidth: 0,
  },
  breakdownIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primaryLight2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  breakdownInfo: {
    flex: 1,
  },
  breakdownName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  breakdownMeta: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  breakdownAmount: {
    alignItems: 'flex-end',
  },
  breakdownAmountValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
  },
  breakdownAmountCommission: {
    fontSize: 12,
    color: Colors.light.success,
    marginTop: 2,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionIconSuccess: {
    backgroundColor: Colors.light.successLight,
  },
  transactionIconPending: {
    backgroundColor: Colors.light.warningLight,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.success,
  },
  transactionAmountPending: {
    color: Colors.light.warning,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.light.text, marginTop: 16 },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});

type Period = 'today' | 'week' | 'month';

export default function SalonEarningsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<Period>('week');
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [transactions, setTransactions] = useState<EarningTransaction[]>([]);
  const [staffEarnings, setStaffEarnings] = useState<StaffEarning[]>([]);

  const storeId = (user as unknown as { storeId?: string; stores?: Array<{ _id?: string }> })?.storeId ||
    (user as unknown as { stores?: Array<{ _id?: string }> })?.stores?.[0]?._id || '';

  const fetchEarnings = useCallback(async () => {
    if (!storeId) return;

    try {
      const [summaryData, transactionsData, staffData] = await Promise.all([
        salonService.getEarningsSummary(storeId, period),
        salonService.getEarningTransactions(storeId, period),
        salonService.getStaffEarnings(storeId, period),
      ]);

      setSummary(summaryData);
      setTransactions(transactionsData);
      setStaffEarnings(staffData);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storeId, period]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEarnings();
  }, [fetchEarnings]);

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPeriodLabel = (p: Period) => {
    switch (p) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Earnings</ThemedText>
        <TouchableOpacity
          onPress={() => router.push('/salon/payout-history')}
          style={styles.backButton}
        >
          <Ionicons name="receipt-outline" size={24} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      {/* Period Tabs */}
      <View style={styles.periodTabs}>
        {(['today', 'week', 'month'] as Period[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.periodTab,
              period === p && styles.periodTabActive,
            ]}
            onPress={() => setPeriod(p)}
          >
            <ThemedText
              style={[
                styles.periodTabText,
                period === p && styles.periodTabTextActive,
              ]}
            >
              {getPeriodLabel(p)}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <ThemedText style={styles.summaryLabel}>Your Earnings ({getPeriodLabel(period)})</ThemedText>
            <ThemedText style={styles.summaryAmount}>
              {formatCurrency(summary?.totalEarnings || 0)}
            </ThemedText>
            <ThemedText style={styles.summarySubtext}>
              {summary?.transactionCount || 0} completed services
            </ThemedText>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <ThemedText style={styles.statLabel}>Revenue</ThemedText>
              <ThemedText style={styles.statValue}>
                {formatCurrency(summary?.totalRevenue || 0)}
              </ThemedText>
            </View>
            <View style={styles.statCard}>
              <ThemedText style={styles.statLabel}>Commission</ThemedText>
              <ThemedText style={styles.statValue}>
                {formatCurrency(summary?.totalCommission || 0)}
              </ThemedText>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <ThemedText style={styles.statLabel}>Services</ThemedText>
              <ThemedText style={styles.statValue}>
                {summary?.servicesCompleted || 0}
              </ThemedText>
            </View>
            <View style={styles.statCard}>
              <ThemedText style={styles.statLabel}>Pending</ThemedText>
              <ThemedText style={[styles.statValue, { color: Colors.light.warning }]}>
                {formatCurrency(summary?.pendingPayout || 0)}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Earnings Chart */}
        <View style={styles.chartSection}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Earnings Trend</ThemedText>
          </View>
          <View style={styles.chartCard}>
            <View style={styles.chartContainer}>
              {summary?.chartData && summary.chartData.length > 0 ? (
                <EarningsChart data={summary.chartData} />
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="trending-up-outline" size={48} color={Colors.light.textSecondary} />
                  <ThemedText style={styles.emptyText}>No data for this period</ThemedText>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Staff Earnings */}
        {staffEarnings.length > 0 && (
          <View style={styles.chartSection}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Staff Earnings</ThemedText>
              <TouchableOpacity onPress={() => router.push('/salon/staff-earnings')}>
                <ThemedText style={{ color: Colors.light.primary, fontSize: 14 }}>View All</ThemedText>
              </TouchableOpacity>
            </View>
            <View style={styles.breakdownList}>
              {staffEarnings.slice(0, 5).map((staff, index) => (
                <View
                  key={staff.staffId}
                  style={[
                    styles.breakdownItem,
                    index === staffEarnings.length - 1 && styles.breakdownItemLast,
                  ]}
                >
                  <View style={styles.breakdownIcon}>
                    <Ionicons name="person" size={20} color={Colors.light.primary} />
                  </View>
                  <View style={styles.breakdownInfo}>
                    <ThemedText style={styles.breakdownName}>{staff.staffName}</ThemedText>
                    <ThemedText style={styles.breakdownMeta}>
                      {staff.servicesCount} services
                    </ThemedText>
                  </View>
                  <View style={styles.breakdownAmount}>
                    <ThemedText style={styles.breakdownAmountValue}>
                      {formatCurrency(staff.earnings)}
                    </ThemedText>
                    <ThemedText style={styles.breakdownAmountCommission}>
                      {formatCurrency(staff.commission)} commission
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Transactions */}
        <View style={[styles.chartSection, { paddingBottom: 100 }]}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Recent Transactions</ThemedText>
          </View>
          {transactions.length > 0 ? (
            transactions.slice(0, 10).map((transaction, index) => (
              <View
                key={transaction._id}
                style={[
                  styles.transactionItem,
                  index === transactions.length - 1 && { borderBottomWidth: 0, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
                  index === 0 && { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
                ]}
              >
                <View
                  style={[
                    styles.transactionIcon,
                    transaction.status === 'completed' ? styles.transactionIconSuccess : styles.transactionIconPending,
                  ]}
                >
                  <Ionicons
                    name={transaction.status === 'completed' ? 'checkmark-circle' : 'time'}
                    size={20}
                    color={transaction.status === 'completed' ? Colors.light.success : Colors.light.warning}
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <ThemedText style={styles.transactionName}>{transaction.serviceName}</ThemedText>
                  <ThemedText style={styles.transactionDate}>
                    {transaction.customerName} • {formatDate(transaction.date)}
                  </ThemedText>
                </View>
                <View style={styles.transactionAmount}>
                  <ThemedText
                    style={[
                      styles.transactionAmountValue,
                      transaction.status === 'pending' && styles.transactionAmountPending,
                    ]}
                  >
                    +{formatCurrency(transaction.earnings)}
                  </ThemedText>
                  <ThemedText style={styles.breakdownMeta}>
                    {formatCurrency(transaction.commission)} comm.
                  </ThemedText>
                </View>
              </View>
            ))
          ) : (
            <View style={[styles.breakdownList, styles.emptyState]}>
              <Ionicons name="receipt-outline" size={48} color={Colors.light.textSecondary} />
              <ThemedText style={styles.emptyTitle}>No Transactions</ThemedText>
              <ThemedText style={styles.emptyText}>
                Completed services will appear here.
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
