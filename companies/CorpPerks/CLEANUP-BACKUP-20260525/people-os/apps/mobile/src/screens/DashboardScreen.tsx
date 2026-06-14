import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../constants/config';
import { getEmployeeDashboard, getEmployee } from '../services/api';
import { Dashboard, Employee } from '../types';
import LeaveBalanceCard from '../components/LeaveBalanceCard';
import Button from '../components/Button';

export const DashboardScreen: React.FC = () => {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const employeeId = 'EMP001'; // In production, get from auth context

  const loadData = async () => {
    const [dashData, empData] = await Promise.all([
      getEmployeeDashboard(employeeId),
      getEmployee(employeeId),
    ]);
    setDashboard(dashData);
    setEmployee(empData);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {employee ? `${employee.firstName[0]}${employee.lastName[0]}` : '??'}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.employeeName}>
            {employee ? `${employee.firstName} ${employee.lastName}` : 'Employee'}
          </Text>
          <Text style={styles.designation}>
            {employee?.designation || 'Team Member'}
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Button
          title="+ Request Leave"
          onPress={() => router.push('/leave/new')}
          variant="primary"
          style={styles.actionButton}
        />
        <Button
          title="+ Submit Expense"
          onPress={() => router.push('/expense/new')}
          variant="outline"
          style={styles.actionButton}
        />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{dashboard?.pendingLeaveRequests || 0}</Text>
          <Text style={styles.statLabel}>Pending Leaves</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{dashboard?.pendingExpenseClaims || 0}</Text>
          <Text style={styles.statLabel}>Pending Expenses</Text>
        </View>
      </View>

      {/* Leave Balances */}
      {dashboard?.leaveBalances && (
        <LeaveBalanceCard balances={dashboard.leaveBalances} />
      )}

      {/* Recent Activity */}
      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>This Month</Text>
        </View>
        <View style={styles.recentCard}>
          <View style={styles.recentItem}>
            <Text style={styles.recentLabel}>Approved Leaves</Text>
            <Text style={styles.recentValue}>{dashboard?.approvedLeavesThisMonth || 0}</Text>
          </View>
          <View style={styles.recentDivider} />
          <View style={styles.recentItem}>
            <Text style={styles.recentLabel}>Total Expenses</Text>
            <Text style={styles.recentValue}>
              ₹{(dashboard?.totalExpensesThisMonth || 0).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Navigation Links */}
      <View style={styles.linksSection}>
        <Button
          title="View All Leave Requests"
          onPress={() => router.push('/leave')}
          variant="ghost"
          style={styles.linkButton}
        />
        <Button
          title="View All Expenses"
          onPress={() => router.push('/expense')}
          variant="ghost"
          style={styles.linkButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  employeeName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  designation: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  quickActions: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  recentSection: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  recentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  recentDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  recentLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  recentValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  linksSection: {
    marginTop: SPACING.md,
  },
  linkButton: {
    marginBottom: SPACING.sm,
  },
});

export default DashboardScreen;
