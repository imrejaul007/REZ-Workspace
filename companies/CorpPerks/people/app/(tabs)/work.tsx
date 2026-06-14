// ==========================================
// MyTalent - Work Tab Screen (Workspace Hub)
// ==========================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow, formatCurrency } from '../../src/components/Badge';
import { Card } from '../../src/components';
import { mockEmployee, mockLeaveBalance, mockTasks, mockAttendanceSummary } from '../../src/data/mockData';

export default function WorkScreen() {
  const navigation = useNavigation<any>();

  const pendingTasksCount = mockTasks.filter((t) => t.status === 'pending').length;
  const completedTasksCount = mockTasks.filter((t) => t.status === 'completed').length;
  const totalLeave = mockLeaveBalance.sick + mockLeaveBalance.casual + mockLeaveBalance.earned + mockLeaveBalance.wfh;
  const attendanceRate = Math.round((mockAttendanceSummary.present / 22) * 100);

  const workCards = [
    {
      id: 'attendance',
      title: 'Attendance',
      subtitle: `${attendanceRate}% this month`,
      icon: '📍',
      color: Colors.primary,
      onPress: () => navigation.navigate('Attendance'),
      stats: [
        { label: 'Present', value: mockAttendanceSummary.present },
        { label: 'Late', value: mockAttendanceSummary.late },
        { label: 'Absent', value: mockAttendanceSummary.absent },
      ],
    },
    {
      id: 'leave',
      title: 'Leave Management',
      subtitle: `${totalLeave} days available`,
      icon: '📅',
      color: Colors.secondary,
      onPress: () => navigation.navigate('Leave'),
      stats: [
        { label: 'Sick', value: mockLeaveBalance.sick },
        { label: 'Casual', value: mockLeaveBalance.casual },
        { label: 'Earned', value: mockLeaveBalance.earned },
      ],
    },
    {
      id: 'tasks',
      title: 'My Tasks',
      subtitle: `${pendingTasksCount} pending tasks`,
      icon: '✅',
      color: Colors.warning,
      onPress: () => navigation.navigate('Tasks'),
      stats: [
        { label: 'Pending', value: pendingTasksCount },
        { label: 'Completed', value: completedTasksCount },
        { label: 'Total', value: mockTasks.length },
      ],
    },
    {
      id: 'productivity',
      title: 'Productivity',
      subtitle: 'Track your performance',
      icon: '📊',
      color: Colors.success,
      onPress: () => navigation.navigate('Productivity'),
      stats: [
        { label: 'Score', value: '78' },
        { label: 'Ranking', value: '#5/25' },
        { label: 'Hours', value: '168h' },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workspace</Text>
        <Text style={styles.headerSubtitle}>Manage your work activities</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Summary */}
        <Card style={styles.userCard}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{mockEmployee.avatar}</Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{mockEmployee.name}</Text>
              <Text style={styles.userRole}>{mockEmployee.designation}</Text>
              <Text style={styles.userDept}>{mockEmployee.department}</Text>
            </View>
          </View>
          <View style={styles.userStats}>
            <View style={styles.userStat}>
              <Text style={styles.userStatValue}>2.5</Text>
              <Text style={styles.userStatLabel}>Years</Text>
            </View>
            <View style={styles.userStatDivider} />
            <View style={styles.userStat}>
              <Text style={styles.userStatValue}>{attendanceRate}%</Text>
              <Text style={styles.userStatLabel}>Attendance</Text>
            </View>
            <View style={styles.userStatDivider} />
            <View style={styles.userStat}>
              <Text style={styles.userStatValue}>4.2</Text>
              <Text style={styles.userStatLabel}>Rating</Text>
            </View>
          </View>
        </Card>

        {/* Work Cards */}
        {workCards.map((card) => (
          <TouchableOpacity
            key={card.id}
            onPress={card.onPress}
            activeOpacity={0.7}
          >
            <Card style={[styles.workCard, { borderLeftColor: card.color }]}>
              <View style={styles.workCardHeader}>
                <View style={[styles.workCardIcon, { backgroundColor: `${card.color}20` }]}>
                  <Text style={styles.workCardEmoji}>{card.icon}</Text>
                </View>
                <View style={styles.workCardInfo}>
                  <Text style={styles.workCardTitle}>{card.title}</Text>
                  <Text style={styles.workCardSubtitle}>{card.subtitle}</Text>
                </View>
                <Text style={styles.workCardArrow}>›</Text>
              </View>
              <View style={styles.workCardStats}>
                {card.stats.map((stat, index) => (
                  <View key={index} style={styles.workStat}>
                    <Text style={styles.workStatValue}>{stat.value}</Text>
                    <Text style={styles.workStatLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        {/* Quick Links */}
        <Text style={styles.sectionTitle}>Quick Links</Text>
        <View style={styles.quickLinks}>
          <TouchableOpacity style={styles.quickLink}>
            <Text style={styles.quickLinkIcon}>📄</Text>
            <Text style={styles.quickLinkLabel}>Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickLink}>
            <Text style={styles.quickLinkIcon}>🏆</Text>
            <Text style={styles.quickLinkLabel}>Awards</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickLink}>
            <Text style={styles.quickLinkIcon}>📚</Text>
            <Text style={styles.quickLinkLabel}>Learning</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickLink}>
            <Text style={styles.quickLinkIcon}>💬</Text>
            <Text style={styles.quickLinkLabel}>Feedback</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  userCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: Colors.textInverse,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  userDetails: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  userName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  userRole: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  userDept: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  userStat: {
    alignItems: 'center',
  },
  userStatValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  userStatLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 4,
  },
  userStatDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
  },
  workCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderLeftWidth: 4,
  },
  workCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workCardIcon: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workCardEmoji: {
    fontSize: 24,
  },
  workCardInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  workCardTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  workCardSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  workCardArrow: {
    fontSize: 24,
    color: Colors.textMuted,
  },
  workCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  workStat: {
    alignItems: 'center',
  },
  workStatValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  workStatLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  quickLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
  },
  quickLink: {
    width: '25%',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  quickLinkIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickLinkLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
