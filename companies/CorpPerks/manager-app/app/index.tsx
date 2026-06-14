import { logger } from '../../shared/logger';
// ==========================================
// CorpPerks Manager App - Dashboard Screen
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
import { Card, StatCard, Badge, Avatar, Button } from '../src/components';
import { api } from '../src/services/api';
import { useStore } from '../src/store';
import {
  Colors,
  Spacing,
  FontSize,
  BorderRadius,
  getTimeOfDay,
  formatTime,
  formatDate,
} from '../src/utils/theme';
import { DashboardStats, Meeting, Activity, TeamMember } from '../src/types';

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { setDashboardStats, setTeamMembers, setUpcomingMeetings, setLeaveRequests } = useStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [manager, setManager] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [dashboardRes, managerRes, teamRes, meetingsRes, leaveRes] = await Promise.all([
        api.getDashboardStats(),
        api.getManager(),
        api.getTeamMembers(),
        api.getUpcomingMeetings(),
        api.getLeaveRequests('pending'),
      ]);

      if (dashboardRes.success && dashboardRes.data) {
        setStats(dashboardRes.data);
        setDashboardStats(dashboardRes.data);
      }

      if (managerRes.success && managerRes.data) {
        setManager(managerRes.data);
      }

      if (teamRes.success && teamRes.data) {
        setTeamMembers(teamRes.data);
      }

      if (meetingsRes.success && meetingsRes.data) {
        setUpcomingMeetings(meetingsRes.data);
      }

      if (leaveRes.success && leaveRes.data) {
        setLeaveRequests(leaveRes.data);
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
      case 'leave_request': return 'leisure';
      case 'attendance_correction': return 'schedule';
      case 'performance_review': return 'trending_up';
      case 'meeting_completed': return 'check_circle';
      case 'feedback_received': return 'chat';
      default: return 'info';
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
            <Text style={styles.managerName}>{manager?.name || 'Manager'}</Text>
          </View>
          <Avatar
            uri={manager?.avatar}
            name={manager?.name || 'Manager'}
            size="md"
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
            title="Team Size"
            value={stats?.teamSize || 0}
            icon="people"
            color={Colors.primary}
            style={styles.statCard}
          />
          <StatCard
            title="Present Today"
            value={`${stats?.todayAttendance.present || 0}/${stats?.teamSize || 0}`}
            icon="check_circle"
            color={Colors.success}
            style={styles.statCard}
          />
        </View>

        {/* Pending Approvals */}
        <Card title="Pending Approvals" style={styles.section}>
          <View style={styles.approvalsRow}>
            <TouchableOpacity
              style={styles.approvalCard}
              onPress={() => navigation.navigate('Leave')}
            >
              <Text style={styles.approvalCount}>
                {stats?.pendingApprovals.leave || 0}
              </Text>
              <Text style={styles.approvalLabel}>Leave</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.approvalCard}
              onPress={() => navigation.navigate('Attendance')}
            >
              <Text style={styles.approvalCount}>
                {stats?.pendingApprovals.attendance || 0}
              </Text>
              <Text style={styles.approvalLabel}>Attendance</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.approvalCard}
              onPress={() => navigation.navigate('Performance')}
            >
              <Text style={styles.approvalCount}>
                {stats?.pendingApprovals.overtime || 0}
              </Text>
              <Text style={styles.approvalLabel}>Overtime</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Today's Attendance */}
        <Card
          title="Today's Attendance"
          headerRight={
            <TouchableOpacity onPress={() => navigation.navigate('Attendance')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          }
          style={styles.section}
        >
          <View style={styles.attendanceSummary}>
            <View style={styles.attendanceItem}>
              <Text style={[styles.attendanceValue, { color: Colors.success }]}>
                {stats?.todayAttendance.present || 0}
              </Text>
              <Text style={styles.attendanceLabel}>Present</Text>
            </View>
            <View style={styles.attendanceItem}>
              <Text style={[styles.attendanceValue, { color: Colors.error }]}>
                {stats?.todayAttendance.absent || 0}
              </Text>
              <Text style={styles.attendanceLabel}>Absent</Text>
            </View>
            <View style={styles.attendanceItem}>
              <Text style={[styles.attendanceValue, { color: Colors.warning }]}>
                {stats?.todayAttendance.late || 0}
              </Text>
              <Text style={styles.attendanceLabel}>Late</Text>
            </View>
            <View style={styles.attendanceItem}>
              <Text style={[styles.attendanceValue, { color: Colors.info }]}>
                {stats?.todayAttendance.wfh || 0}
              </Text>
              <Text style={styles.attendanceLabel}>WFH</Text>
            </View>
          </View>
        </Card>

        {/* Upcoming 1:1 Meetings */}
        <Card
          title="Upcoming 1:1 Meetings"
          headerRight={
            <TouchableOpacity onPress={() => navigation.navigate('OneOnOne')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          }
          style={styles.section}
        >
          {stats?.upcomingMeetings && stats.upcomingMeetings.length > 0 ? (
            stats.upcomingMeetings.slice(0, 3).map((meeting) => (
              <TouchableOpacity
                key={meeting.id}
                style={styles.meetingItem}
                onPress={() => navigation.navigate('OneOnOne')}
              >
                <Avatar
                  uri={meeting.attendeeAvatar}
                  name={meeting.attendeeName}
                  size="sm"
                />
                <View style={styles.meetingInfo}>
                  <Text style={styles.meetingTitle}>{meeting.title}</Text>
                  <Text style={styles.meetingTime}>
                    {formatTime(meeting.scheduledStart)} - {formatTime(meeting.scheduledEnd)}
                  </Text>
                </View>
                <Badge label="Scheduled" variant="status" size="sm" />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyMeetings}>
              <Text style={styles.emptyText}>No upcoming meetings</Text>
              <Button
                title="Schedule 1:1"
                onPress={() => navigation.navigate('OneOnOne')}
                variant="outline"
                size="sm"
              />
            </View>
          )}
        </Card>

        {/* Recent Activity */}
        <Card title="Recent Activity" style={styles.section}>
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            stats.recentActivity.slice(0, 5).map((activity) => (
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
                {activity.status && (
                  <Badge
                    label={activity.status}
                    variant={activity.status === 'pending' ? 'warning' : 'success'}
                    size="sm"
                  />
                )}
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
              onPress={() => navigation.navigate('OneOnOne', { screen: 'ScheduleMeeting' })}
            >
              <Text style={styles.quickActionIcon}>calendar</Text>
              <Text style={styles.quickActionLabel}>Schedule 1:1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Team')}
            >
              <Text style={styles.quickActionIcon}>people</Text>
              <Text style={styles.quickActionLabel}>View Team</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Reports')}
            >
              <Text style={styles.quickActionIcon}>assessment</Text>
              <Text style={styles.quickActionLabel}>Reports</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Leave')}
            >
              <Text style={styles.quickActionIcon}>event_busy</Text>
              <Text style={styles.quickActionLabel}>Leave</Text>
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
  managerName: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
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
  approvalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  approvalCard: {
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    minWidth: 90,
  },
  approvalCount: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.primary,
  },
  approvalLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  attendanceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
  },
  attendanceItem: {
    alignItems: 'center',
  },
  attendanceValue: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
  },
  attendanceLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  meetingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  meetingInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  meetingTitle: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  meetingTime: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyMeetings: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
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
    backgroundColor: Colors.primaryLight + '20',
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
    borderRadius: BorderRadius.lg,
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
