// ==========================================
// CorpPerks Client App - Dashboard Screen
// ==========================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, StatCard, Badge, Avatar } from '../../src/components';
import { api } from '../../src/services/api';
import { useStore } from '../../src/store';
import {
  Colors,
  Spacing,
  FontSize,
  formatCurrency,
  formatDate,
} from '../../src/utils/theme';
import { DashboardStats, UpcomingDeadline, Activity } from '../../src/types';

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { setDashboardStats, setClient } = useStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [client, setClientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [statsRes, clientRes] = await Promise.all([
        api.getDashboardStats(),
        api.getClient(),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
        setDashboardStats(statsRes.data);
      }

      if (clientRes.success && clientRes.data) {
        setClientData(clientRes.data);
        setClient(clientRes.data);
      }
    } catch (error) {
      logger.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project_update': return 'folder';
      case 'invoice_sent': return 'send';
      case 'invoice_paid': return 'check_circle';
      case 'message_received': return 'chat';
      case 'task_completed': return 'task_alt';
      case 'milestone_reached': return 'flag';
      default: return 'info';
    }
  };

  const getDeadlineIcon = (type: string) => {
    switch (type) {
      case 'milestone': return 'flag';
      case 'invoice': return 'receipt';
      case 'project_end': return 'folder';
      default: return 'event';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.clientName}>{client?.name || 'Client'}</Text>
            <Text style={styles.companyName}>{client?.companyName}</Text>
          </View>
          <Avatar
            uri={client?.avatar}
            name={client?.name || 'Client'}
            size="lg"
          />
        </View>

        {/* Today's Date */}
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <StatCard
            title="Active Projects"
            value={stats?.activeProjects || 0}
            icon="folder_open"
            color={Colors.primary}
            style={styles.statCard}
          />
          <StatCard
            title="Pending Invoices"
            value={stats?.pendingInvoices || 0}
            icon="receipt_long"
            color={Colors.warning}
            style={styles.statCard}
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="Outstanding"
            value={formatCurrency(stats?.outstandingAmount || 0)}
            icon="account_balance_wallet"
            color={Colors.info}
            style={styles.statCard}
          />
          <StatCard
            title="Overdue"
            value={formatCurrency(stats?.overdueAmount || 0)}
            icon="warning"
            color={stats?.overdueAmount ? Colors.error : Colors.textMuted}
            style={styles.statCard}
          />
        </View>

        {/* Upcoming Deadlines */}
        <Card
          title="Upcoming Deadlines"
          headerRight={
            <TouchableOpacity onPress={() => navigation.navigate('Projects')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          }
          style={styles.section}
        >
          {stats?.upcomingDeadlines && stats.upcomingDeadlines.length > 0 ? (
            stats.upcomingDeadlines.map((deadline: UpcomingDeadline) => (
              <View key={deadline.id} style={styles.deadlineItem}>
                <View style={styles.deadlineIcon}>
                  <Text style={styles.deadlineIconText}>{getDeadlineIcon(deadline.type)}</Text>
                </View>
                <View style={styles.deadlineContent}>
                  <Text style={styles.deadlineTitle}>{deadline.title}</Text>
                  <Text style={styles.deadlineDate}>
                    {formatDate(deadline.date, 'short')}
                    {deadline.projectName && ` • ${deadline.projectName}`}
                  </Text>
                </View>
                <Badge
                  label={deadline.type}
                  variant="info"
                  size="sm"
                />
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No upcoming deadlines</Text>
          )}
        </Card>

        {/* Revenue Overview */}
        <Card
          title="Revenue Overview"
          style={styles.section}
        >
          <View style={styles.revenueRow}>
            <View style={styles.revenueItem}>
              <Text style={styles.revenueLabel}>Total Revenue</Text>
              <Text style={styles.revenueValue}>
                {formatCurrency(stats?.totalRevenue || 0)}
              </Text>
            </View>
            <View style={styles.revenueItem}>
              <Text style={styles.revenueLabel}>This Month</Text>
              <Text style={[styles.revenueValue, { color: Colors.success }]}>
                {formatCurrency(stats?.monthlyRevenue?.[4]?.amount || 0)}
              </Text>
            </View>
          </View>
          <View style={styles.projectsSummary}>
            <View style={styles.projectStat}>
              <Text style={styles.projectStatValue}>
                {stats?.completedProjects || 0}
              </Text>
              <Text style={styles.projectStatLabel}>Completed</Text>
            </View>
            <View style={styles.projectStat}>
              <Text style={styles.projectStatValue}>
                {stats?.totalProjects || 0}
              </Text>
              <Text style={styles.projectStatLabel}>Total</Text>
            </View>
          </View>
        </Card>

        {/* Recent Activity */}
        <Card title="Recent Activity" style={styles.section}>
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            stats.recentActivity.map((activity: Activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Text style={styles.activityIconText}>
                    {getActivityIcon(activity.type)}
                  </Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityDesc}>{activity.description}</Text>
                  <Text style={styles.activityTime}>
                    {formatDate(activity.timestamp, 'relative')}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No recent activity</Text>
          )}
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions" style={styles.section}>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Projects')}
            >
              <Text style={styles.quickActionIcon}>folder_open</Text>
              <Text style={styles.quickActionLabel}>View Projects</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Invoices')}
            >
              <Text style={styles.quickActionIcon}>receipt</Text>
              <Text style={styles.quickActionLabel}>Invoices</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Messages')}
            >
              <Text style={styles.quickActionIcon}>chat</Text>
              <Text style={styles.quickActionLabel}>Messages</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Projects')}
            >
              <Text style={styles.quickActionIcon}>support_agent</Text>
              <Text style={styles.quickActionLabel}>Support</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  greeting: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  clientName: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  companyName: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  dateText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.md,
  },
  viewAll: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  deadlineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  deadlineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deadlineIconText: {
    fontSize: 18,
    color: Colors.primary,
  },
  deadlineContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  deadlineTitle: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  deadlineDate: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  revenueItem: {
    flex: 1,
  },
  revenueLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  revenueValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  projectsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  projectStat: {
    alignItems: 'center',
  },
  projectStatValue: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.primary,
  },
  projectStatLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIconText: {
    fontSize: 16,
    color: Colors.primary,
  },
  activityContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  activityTitle: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  activityDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  activityTime: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: '48%',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  quickActionLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
