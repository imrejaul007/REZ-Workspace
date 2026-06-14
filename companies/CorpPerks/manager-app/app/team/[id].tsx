// ==========================================
// CorpPerks Manager App - Team Member Detail Screen
// ==========================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Card, Avatar, Badge, Button, ProgressBar } from '../src/components';
import { api } from '../src/services/api';
import { useStore } from '../src/store';
import {
  Colors,
  Spacing,
  FontSize,
  BorderRadius,
  getStatusColor,
  formatDate,
} from '../src/utils/theme';
import { TeamMember, OKR, AttendanceRecord, LeaveRequest } from '../src/types';

type RouteParams = {
  TeamMemberDetail: { memberId: string };
};

export default function TeamMemberDetailScreen() {
  const route = useRoute<RouteProp<RouteParams, 'TeamMemberDetail'>>();
  const navigation = useNavigation<any>();
  const { memberId } = route.params;
  const { teamMembers } = useStore();

  const [member, setMember] = useState<TeamMember | null>(null);
  const [okrs, setOkrs] = useState<OKR[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'okrs' | 'attendance' | 'leave'>('overview');

  const loadData = async () => {
    try {
      // Find member from store or fetch
      const foundMember = teamMembers.find((m) => m.id === memberId);
      if (foundMember) {
        setMember(foundMember);
      }

      // Fetch OKRs
      const okrRes = await api.getTeamOKRs();
      if (okrRes.success && okrRes.data) {
        const memberOKRs = okrRes.data.filter((o) => o.employeeId === memberId);
        setOkrs(memberOKRs);
      }

      // Fetch attendance
      const attRes = await api.getAttendanceRecords();
      if (attRes.success && attRes.data) {
        const memberAtt = attRes.data.filter((a) => a.employeeId === memberId);
        setAttendance(memberAtt);
      }

      // Fetch leave requests
      const leaveRes = await api.getLeaveRequests();
      if (leaveRes.success && leaveRes.data) {
        const memberLeave = leaveRes.data.filter((l) => l.employeeId === memberId);
        setLeaveRequests(memberLeave);
      }
    } catch (error) {
      logger.error('Error loading member data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [memberId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCall = () => {
    if (member?.phone) {
      Linking.openURL(`tel:${member.phone}`);
    }
  };

  const handleEmail = () => {
    if (member?.email) {
      Linking.openURL(`mailto:${member.email}`);
    }
  };

  const handleSchedule1on1 = () => {
    navigation.navigate('OneOnOne', {
      screen: 'ScheduleMeeting',
      params: { employeeId: memberId },
    });
  };

  if (!member) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'on-leave':
        return 'warning';
      case 'inactive':
        return 'error';
      case 'probation':
        return 'info';
      default:
        return 'info';
    }
  };

  const TabButton = ({ label, value }: { label: string; value: typeof activeTab }) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === value && styles.tabButtonActive]}
      onPress={() => setActiveTab(value)}
    >
      <Text style={[styles.tabButtonText, activeTab === value && styles.tabButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Avatar uri={member.avatar} name={member.name} size="xl" />
          <Text style={styles.memberName}>{member.name}</Text>
          <Text style={styles.memberDesignation}>{member.designation}</Text>
          <Text style={styles.memberDepartment}>{member.department}</Text>
          <Badge
            label={member.status}
            variant={getStatusBadgeVariant(member.status)}
            size="md"
            style={{ marginTop: Spacing.sm }}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <Text style={styles.actionIcon}>call</Text>
            <Text style={styles.actionLabel}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
            <Text style={styles.actionIcon}>email</Text>
            <Text style={styles.actionLabel}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleSchedule1on1}>
            <Text style={styles.actionIcon}>event</Text>
            <Text style={styles.actionLabel}>Schedule 1:1</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Info */}
        <Card title="Contact Information" style={styles.section}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{member.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{member.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Joined</Text>
            <Text style={styles.infoValue}>{formatDate(member.joinDate)}</Text>
          </View>
        </Card>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TabButton label="Overview" value="overview" />
          <TabButton label="OKRs" value="okrs" />
          <TabButton label="Attendance" value="attendance" />
          <TabButton label="Leave" value="leave" />
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <View>
            {/* Leave Balance */}
            <Card title="Leave Balance" style={styles.section}>
              <View style={styles.leaveBalanceGrid}>
                <View style={styles.leaveBalanceItem}>
                  <Text style={[styles.leaveBalanceValue, { color: Colors.error }]}>
                    {member.leaveBalance.sick}
                  </Text>
                  <Text style={styles.leaveBalanceLabel}>Sick</Text>
                </View>
                <View style={styles.leaveBalanceItem}>
                  <Text style={[styles.leaveBalanceValue, { color: Colors.success }]}>
                    {member.leaveBalance.casual}
                  </Text>
                  <Text style={styles.leaveBalanceLabel}>Casual</Text>
                </View>
                <View style={styles.leaveBalanceItem}>
                  <Text style={[styles.leaveBalanceValue, { color: Colors.primary }]}>
                    {member.leaveBalance.earned}
                  </Text>
                  <Text style={styles.leaveBalanceLabel}>Earned</Text>
                </View>
                <View style={styles.leaveBalanceItem}>
                  <Text style={[styles.leaveBalanceValue, { color: Colors.info }]}>
                    {member.leaveBalance.wfh}
                  </Text>
                  <Text style={styles.leaveBalanceLabel}>WFH</Text>
                </View>
              </View>
            </Card>

            {/* Performance Summary */}
            {member.performanceScore && (
              <Card title="Performance" style={styles.section}>
                <View style={styles.performanceCard}>
                  <Text style={styles.performanceLabel}>Current Rating</Text>
                  <View style={styles.performanceRow}>
                    <Text style={styles.performanceValue}>
                      {member.performanceScore.toFixed(1)}
                    </Text>
                    <Text style={styles.performanceMax}>/5.0</Text>
                  </View>
                  <ProgressBar
                    progress={(member.performanceScore / 5) * 100}
                    showPercentage={false}
                    color={Colors.success}
                    height={8}
                  />
                </View>
              </Card>
            )}
          </View>
        )}

        {activeTab === 'okrs' && (
          <View>
            {okrs.length > 0 ? (
              okrs.map((okr) => (
                <Card key={okr.id} title={`${okr.quarter} ${okr.year}`} style={styles.section}>
                  <View style={styles.okrHeader}>
                    <Text style={styles.okrProgress}>
                      {okr.overallProgress}% Complete
                    </Text>
                    <Badge
                      label={okr.status}
                      variant={okr.status === 'active' ? 'success' : 'default'}
                      size="sm"
                    />
                  </View>
                  <ProgressBar
                    progress={okr.overallProgress}
                    showPercentage={false}
                    color={Colors.primary}
                    style={{ marginBottom: Spacing.md }}
                  />
                  {okr.objectives.map((obj) => (
                    <View key={obj.id} style={styles.objectiveCard}>
                      <Text style={styles.objectiveTitle}>{obj.title}</Text>
                      <View style={styles.krList}>
                        {obj.keyResults.map((kr) => (
                          <View key={kr.id} style={styles.krItem}>
                            <Text style={styles.krTitle}>{kr.title}</Text>
                            <Text style={styles.krProgress}>
                              {kr.current}/{kr.target} {kr.unit}
                            </Text>
                            <ProgressBar
                              progress={kr.progress}
                              showPercentage={false}
                              height={4}
                              style={{ marginTop: Spacing.xs }}
                            />
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </Card>
              ))
            ) : (
              <Card style={styles.section}>
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No OKRs set for this employee</Text>
                </View>
              </Card>
            )}
          </View>
        )}

        {activeTab === 'attendance' && (
          <View>
            {attendance.length > 0 ? (
              attendance.map((record) => (
                <Card key={record.id} style={styles.section}>
                  <View style={styles.attendanceRow}>
                    <View>
                      <Text style={styles.attendanceDate}>
                        {formatDate(record.date)}
                      </Text>
                      <Text style={styles.attendanceHours}>
                        {record.hoursWorked > 0
                          ? `${record.hoursWorked}h worked`
                          : 'No check-out yet'}
                      </Text>
                    </View>
                    <View style={styles.attendanceRight}>
                      <Badge
                        label={record.status}
                        variant="status"
                        size="sm"
                      />
                      <Text style={styles.attendanceTime}>
                        {record.checkIn && `In: ${record.checkIn}`}
                        {record.checkOut && `\nOut: ${record.checkOut}`}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))
            ) : (
              <Card style={styles.section}>
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No attendance records</Text>
                </View>
              </Card>
            )}
          </View>
        )}

        {activeTab === 'leave' && (
          <View>
            {leaveRequests.length > 0 ? (
              leaveRequests.map((request) => (
                <Card key={request.id} style={styles.section}>
                  <View style={styles.leaveRequestHeader}>
                    <Badge label={request.type} variant="leaveType" size="sm" />
                    <Badge
                      label={request.status}
                      variant={request.status === 'approved' ? 'success' : request.status === 'rejected' ? 'error' : 'warning'}
                      size="sm"
                    />
                  </View>
                  <Text style={styles.leaveDateRange}>
                    {formatDate(request.startDate)} - {formatDate(request.endDate)}
                  </Text>
                  <Text style={styles.leaveReason}>{request.reason}</Text>
                  <Text style={styles.leaveApplied}>
                    Applied on {formatDate(request.appliedOn)}
                  </Text>
                </Card>
              ))
            ) : (
              <Card style={styles.section}>
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No leave requests</Text>
                </View>
              </Card>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.card,
  },
  memberName: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  memberDesignation: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  memberDepartment: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.card,
    marginTop: 1,
  },
  actionButton: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: Spacing.xs,
  },
  actionLabel: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  section: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
  },
  tabButtonText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: Colors.textInverse,
  },
  leaveBalanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  leaveBalanceItem: {
    alignItems: 'center',
  },
  leaveBalanceValue: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
  },
  leaveBalanceLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  performanceCard: {
    alignItems: 'center',
  },
  performanceLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  performanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: Spacing.sm,
  },
  performanceValue: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.success,
  },
  performanceMax: {
    fontSize: FontSize.lg,
    color: Colors.textMuted,
    marginLeft: Spacing.xs,
  },
  okrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  okrProgress: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  objectiveCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  objectiveTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  krList: {
    marginTop: Spacing.sm,
  },
  krItem: {
    marginTop: Spacing.sm,
  },
  krTitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  krProgress: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendanceDate: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  attendanceHours: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  attendanceRight: {
    alignItems: 'flex-end',
  },
  attendanceTime: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    textAlign: 'right',
  },
  leaveRequestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  leaveDateRange: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  leaveReason: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  leaveApplied: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
});
