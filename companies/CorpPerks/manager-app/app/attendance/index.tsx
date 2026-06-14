// ==========================================
// CorpPerks Manager App - Attendance Overview Screen
// ==========================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, Avatar, Badge, StatCard } from '../src/components';
import { api } from '../src/services/api';
import {
  Colors,
  Spacing,
  FontSize,
  BorderRadius,
  getStatusColor,
  formatDate,
  formatTime,
} from '../src/utils/theme';
import { AttendanceRecord, AttendanceSummary } from '../src/types';

export default function AttendanceOverviewScreen() {
  const navigation = useNavigation<any>();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    try {
      const [recordsRes, summaryRes] = await Promise.all([
        api.getAttendanceRecords(selectedDate),
        api.getAttendanceSummary(
          new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
          selectedDate
        ),
      ]);

      if (recordsRes.success && recordsRes.data) {
        setRecords(recordsRes.data);
      }

      // Calculate today's summary
      if (summaryRes.success && summaryRes.data) {
        const todaySummary = summaryRes.data.find(
          (s) => s.date === selectedDate
        );
        if (todaySummary) {
          setSummary(todaySummary);
        }
      }
    } catch (error) {
      logger.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'present':
        return 'success';
      case 'absent':
        return 'error';
      case 'late':
      case 'half-day':
        return 'warning';
      case 'wfh':
        return 'info';
      case 'week-off':
      case 'holiday':
        return 'default';
      default:
        return 'info';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'present':
        return 'check';
      case 'absent':
        return 'close';
      case 'late':
        return 'schedule';
      case 'wfh':
        return 'home';
      case 'week-off':
      case 'holiday':
        return 'event';
      default:
        return 'help';
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
        {/* Today's Summary */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Today's Attendance</Text>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>
        </View>

        <View style={styles.summaryCards}>
          <StatCard
            title="Present"
            value={summary?.present || 0}
            icon="check_circle"
            color={Colors.success}
            style={styles.summaryCard}
          />
          <StatCard
            title="Absent"
            value={summary?.absent || 0}
            icon="cancel"
            color={Colors.error}
            style={styles.summaryCard}
          />
        </View>
        <View style={styles.summaryCards}>
          <StatCard
            title="Late"
            value={summary?.late || 0}
            icon="schedule"
            color={Colors.warning}
            style={styles.summaryCard}
          />
          <StatCard
            title="WFH"
            value={summary?.wfh || 0}
            icon="home"
            color={Colors.info}
            style={styles.summaryCard}
          />
        </View>

        {/* Pending Reviews */}
        <TouchableOpacity
          style={styles.pendingBanner}
          onPress={() => navigation.navigate('AttendanceReview')}
        >
          <View style={styles.pendingContent}>
            <Text style={styles.pendingIcon}>notifications</Text>
            <View>
              <Text style={styles.pendingTitle}>Attendance Corrections</Text>
              <Text style={styles.pendingSubtitle}>Review pending requests</Text>
            </View>
          </View>
          <Text style={styles.pendingArrow}>{'>'}</Text>
        </TouchableOpacity>

        {/* Attendance List */}
        <Card title="Team Attendance" style={styles.section}>
          {records.length > 0 ? (
            records.map((record) => (
              <View key={record.id} style={styles.recordItem}>
                <Avatar
                  uri={record.employeeId ? `https://i.pravatar.cc/150?u=${record.employeeId}` : undefined}
                  name={record.employeeName}
                  size="md"
                />
                <View style={styles.recordInfo}>
                  <Text style={styles.recordName}>{record.employeeName}</Text>
                  <View style={styles.recordDetails}>
                    <Text style={styles.recordTime}>
                      {record.checkIn ? `In: ${record.checkIn}` : 'No check-in'}
                      {record.checkOut ? ` | Out: ${record.checkOut}` : ''}
                    </Text>
                    <Text style={styles.recordType}>{record.type}</Text>
                  </View>
                </View>
                <Badge
                  label={record.status}
                  variant={getStatusBadgeVariant(record.status)}
                  size="sm"
                />
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No attendance records for today</Text>
            </View>
          )}
        </Card>

        {/* Weekly Overview */}
        <Card title="This Week" style={styles.section}>
          <View style={styles.weekOverview}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
              const isToday = index === new Date().getDay() - 1;
              return (
                <View key={day} style={styles.dayColumn}>
                  <View
                    style={[
                      styles.dayCircle,
                      isToday && styles.dayCircleToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isToday && styles.dayTextToday,
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
          <View style={styles.weekStats}>
            <View style={styles.weekStatItem}>
              <Text style={styles.weekStatValue}>
                {summary ? Math.round((summary.present / summary.total) * 100) : 0}%
              </Text>
              <Text style={styles.weekStatLabel}>Avg Attendance</Text>
            </View>
            <View style={styles.weekStatItem}>
              <Text style={styles.weekStatValue}>{summary?.late || 0}</Text>
              <Text style={styles.weekStatLabel}>Late Days</Text>
            </View>
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
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerDate: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  summaryCards: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  summaryCard: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.warning + '15',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  pendingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  pendingTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  pendingSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pendingArrow: {
    fontSize: FontSize.xl,
    color: Colors.textMuted,
  },
  section: {
    marginBottom: Spacing.md,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  recordInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  recordName: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  recordDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  recordTime: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  recordType: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginLeft: Spacing.sm,
    paddingLeft: Spacing.sm,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  weekOverview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  dayColumn: {
    alignItems: 'center',
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    backgroundColor: Colors.primary,
  },
  dayText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  dayTextToday: {
    color: Colors.textInverse,
  },
  weekStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  weekStatItem: {
    alignItems: 'center',
  },
  weekStatValue: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.primary,
  },
  weekStatLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
