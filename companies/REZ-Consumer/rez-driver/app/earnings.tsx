import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDriverStore } from '../src/stores';
import { earningsApi } from '../src/services/api';
import { DailyEarnings, EarningTransaction } from '../src/types';
import { Card, Button, EmptyState } from '../src/components';
import {
  formatCurrency,
  formatDistance,
  formatRelativeTime,
  formatDate,
} from '../src/utils';

type TimeFilter = 'today' | 'week' | 'month';

export default function EarningsScreen() {
  const [filter, setFilter] = useState<TimeFilter>('today');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    todayEarnings,
    weeklyEarnings,
    recentTransactions,
    totalEarnings,
    pendingPayout,
    setTodayEarnings,
    setWeeklyEarnings,
    setRecentTransactions,
    setTotalEarnings,
    setPendingPayout,
  } = useDriverStore();

  // Load earnings data
  const loadEarnings = useCallback(async () => {
    try {
      // Load today's earnings
      const todayResponse = await earningsApi.getTodayEarnings();
      if (todayResponse.success && todayResponse.data) {
        setTodayEarnings(todayResponse.data);
      }

      // Load weekly earnings
      const weekResponse = await earningsApi.getWeeklyEarnings();
      if (weekResponse.success && weekResponse.data) {
        setWeeklyEarnings(weekResponse.data);
      }

      // Load recent transactions
      const txnResponse = await earningsApi.getRecentTransactions();
      if (txnResponse.success && txnResponse.data) {
        setRecentTransactions(txnResponse.data);
      }

      // Load totals
      const totalResponse = await earningsApi.getTotalEarnings();
      if (totalResponse.success && totalResponse.data) {
        setTotalEarnings(totalResponse.data.total);
        setPendingPayout(totalResponse.data.pending);
      }
    } catch (error) {
      logger.error('Error loading earnings:', error);
    }
  }, [setTodayEarnings, setWeeklyEarnings, setRecentTransactions, setTotalEarnings, setPendingPayout]);

  // Initial load
  useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);

  // Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEarnings();
    setRefreshing(false);
  }, [loadEarnings]);

  // Request payout
  const handleRequestPayout = async () => {
    if (pendingPayout <= 0) {
      Alert.alert('No Earnings', 'You don\'t have unknown pending earnings to withdraw.');
      return;
    }

    Alert.alert(
      'Request Payout',
      `Do you want to withdraw ${formatCurrency(pendingPayout)} to your linked bank account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await earningsApi.requestPayout(pendingPayout);
              if (response.success) {
                Alert.alert('Success', 'Your payout request has been submitted.');
                setPendingPayout(0);
              } else {
                Alert.alert('Error', 'Failed to process payout request.');
              }
            } catch (error) {
              Alert.alert('Error', 'Something went wrong. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Calculate stats based on filter
  const getStats = () => {
    switch (filter) {
      case 'today':
        return todayEarnings || {
          totalEarnings: 0,
          totalDeliveries: 0,
          totalDistance: 0,
          totalHours: 0,
          bonus: 0,
        };
      case 'week':
        const weekTotals = weeklyEarnings.reduce(
          (acc, day) => ({
            totalEarnings: acc.totalEarnings + day.totalEarnings,
            totalDeliveries: acc.totalDeliveries + day.totalDeliveries,
            totalDistance: acc.totalDistance + day.totalDistance,
            totalHours: acc.totalHours + day.totalHours,
            bonus: acc.bonus + day.bonus,
          }),
          { totalEarnings: 0, totalDeliveries: 0, totalDistance: 0, totalHours: 0, bonus: 0 }
        );
        return weekTotals;
      case 'month':
        // Simplified - would normally fetch monthly data
        return weeklyEarnings.reduce(
          (acc, day) => ({
            totalEarnings: acc.totalEarnings + day.totalEarnings,
            totalDeliveries: acc.totalDeliveries + day.totalDeliveries,
            totalDistance: acc.totalDistance + day.totalDistance,
            totalHours: acc.totalHours + day.totalHours,
            bonus: acc.bonus + day.bonus,
          }),
          { totalEarnings: 0, totalDeliveries: 0, totalDistance: 0, totalHours: 0, bonus: 0 }
        );
      default:
        return todayEarnings || { totalEarnings: 0, totalDeliveries: 0, totalDistance: 0, totalHours: 0, bonus: 0 };
    }
  };

  const stats = getStats();

  // Get transaction icon
  const getTransactionIcon = (type: EarningTransaction['type']) => {
    switch (type) {
      case 'delivery':
        return 'D';
      case 'bonus':
        return 'B';
      case 'adjustment':
        return 'A';
      case 'withdrawal':
        return 'W';
      default:
        return '?';
    }
  };

  // Get transaction color
  const getTransactionColor = (type: EarningTransaction['type']) => {
    switch (type) {
      case 'delivery':
        return '#007AFF';
      case 'bonus':
        return '#FF9500';
      case 'adjustment':
        return '#5856D6';
      case 'withdrawal':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
      >
        {/* Main Earnings Card */}
        <View style={styles.mainEarningsCard}>
          <Text style={styles.mainEarningsLabel}>
            {filter === 'today' ? "Today's Earnings" : filter === 'week' ? 'This Week' : 'This Month'}
          </Text>
          <Text style={styles.mainEarningsAmount}>
            {formatCurrency(stats.totalEarnings)}
          </Text>
          <View style={styles.earningsTrend}>
            <Text style={styles.trendValue}>+12.5%</Text>
            <Text style={styles.trendLabel}>vs last period</Text>
          </View>
        </View>

        {/* Pending Payout */}
        <Card style={styles.payoutCard}>
          <View style={styles.payoutRow}>
            <View>
              <Text style={styles.payoutLabel}>Pending Payout</Text>
              <Text style={styles.payoutAmount}>{formatCurrency(pendingPayout)}</Text>
            </View>
            <Button
              title="Withdraw"
              onPress={handleRequestPayout}
              variant="success"
              size="small"
              loading={loading}
              disabled={pendingPayout <= 0}
            />
          </View>
        </Card>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {(['today', 'week', 'month'] as TimeFilter[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.filterTab, filter === tab && styles.filterTabActive]}
              onPress={() => setFilter(tab)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filter === tab && styles.filterTabTextActive,
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.statIcon}>D</Text>
            <Text style={styles.statValue}>{stats.totalDeliveries}</Text>
            <Text style={styles.statLabel}>Deliveries</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statIcon}>K</Text>
            <Text style={styles.statValue}>{formatDistance(stats.totalDistance)}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statIcon}>H</Text>
            <Text style={styles.statValue}>{stats.totalHours.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Hours</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statIcon}>B</Text>
            <Text style={styles.statValue}>{formatCurrency(stats.bonus)}</Text>
            <Text style={styles.statLabel}>Bonus</Text>
          </Card>
        </View>

        {/* Weekly Chart */}
        {weeklyEarnings.length > 0 && (
          <Card style={styles.chartCard}>
            <Text style={styles.sectionTitle}>Daily Breakdown</Text>
            <View style={styles.chart}>
              {weeklyEarnings.slice(0, 7).map((day, index) => {
                const maxEarning = Math.max(...weeklyEarnings.map((d) => d.totalEarnings));
                const height = maxEarning > 0 ? (day.totalEarnings / maxEarning) * 100 : 0;
                const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });

                return (
                  <View key={day.date} style={styles.chartBar}>
                    <View style={styles.barContainer}>
                      <View
                        style={[
                          styles.bar,
                          { height: `${Math.max(height, 5)}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{dayName}</Text>
                    <Text style={styles.barValue}>{formatCurrency(day.totalEarnings, 'USD').replace('$', '')}</Text>
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.length > 0 ? (
            recentTransactions.slice(0, 5).map((transaction) => (
              <Card key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionRow}>
                  <View
                    style={[
                      styles.transactionIcon,
                      { backgroundColor: `${getTransactionColor(transaction.type)}15` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.transactionIconText,
                        { color: getTransactionColor(transaction.type) },
                      ]}
                    >
                      {getTransactionIcon(transaction.type)}
                    </Text>
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionDescription}>
                      {transaction.description}
                    </Text>
                    <Text style={styles.transactionTime}>
                      {formatRelativeTime(transaction.createdAt)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      transaction.amount >= 0
                        ? styles.transactionPositive
                        : styles.transactionNegative,
                    ]}
                  >
                    {transaction.amount >= 0 ? '+' : ''}
                    {formatCurrency(transaction.amount)}
                  </Text>
                </View>
              </Card>
            ))
          ) : (
            <EmptyState
              title="No Transactions"
              message="Your recent transactions will appear here."
            />
          )}
        </View>

        {/* Total Earnings Summary */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>All-Time Earnings</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalEarnings)}</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  mainEarningsCard: {
    backgroundColor: '#34C759',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  mainEarningsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  mainEarningsAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  earningsTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  trendValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  trendLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
  },
  payoutCard: {
    marginBottom: 16,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payoutLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  payoutAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: '#007AFF',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center',
  },
  chartCard: {
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    marginTop: 16,
    paddingTop: 20,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    height: 100,
    width: 24,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 8,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 2,
  },
  transactionsSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  transactionCard: {
    marginBottom: 8,
    padding: 12,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionIconText: {
    fontSize: 16,
    fontWeight: '700',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  transactionTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  transactionPositive: {
    color: '#34C759',
  },
  transactionNegative: {
    color: '#FF3B30',
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 15,
    color: '#8E8E93',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
});
