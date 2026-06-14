// ==========================================
// CorpPerks Manager App - 1:1 Meetings Overview Screen
// ==========================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, Badge, Avatar, Button, EmptyState } from '../../src/components';
import { api } from '../../src/services/api';
import { useStore } from '../../src/store';
import {
  Colors,
  Spacing,
  FontSize,
  BorderRadius,
  formatDate,
  formatTime,
  getTimeOfDay,
} from '../../src/utils/theme';
import { Meeting, OneOnOne, ActionItem } from '../../src/types';

export default function OneOnOneOverviewScreen() {
  const navigation = useNavigation<any>();
  const { setUpcomingMeetings } = useStore();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [oneOnOnes, setOneOnOnes] = useState<OneOnOne[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [meetingsRes] = await Promise.all([
        api.getUpcomingMeetings(),
      ]);

      if (meetingsRes.success && meetingsRes.data) {
        setMeetings(meetingsRes.data);
        setUpcomingMeetings(meetingsRes.data);
      }
    } catch (error) {
      logger.error('Error loading 1:1 data:', error);
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

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return 'videocam';
      case 'audio': return 'call';
      case 'in_person': return 'person';
      case 'phone': return 'phone';
      default: return 'videocam';
    }
  };

  const getMeetingStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return Colors.info;
      case 'in_progress': return Colors.warning;
      case 'completed': return Colors.success;
      case 'cancelled': return Colors.error;
      default: return Colors.textMuted;
    }
  };

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const renderUpcomingMeeting = (meeting: Meeting) => {
    const daysUntil = getDaysUntil(meeting.scheduledStart);

    return (
      <TouchableOpacity
        key={meeting.id}
        style={styles.meetingCard}
        onPress={() => navigation.navigate('OneOnOne', { screen: 'MeetingDetail', params: { meetingId: meeting.id } })}
      >
        <View style={styles.meetingDate}>
          <Text style={styles.meetingDateDay}>
            {new Date(meeting.scheduledStart).getDate()}
          </Text>
          <Text style={styles.meetingDateMonth}>
            {new Date(meeting.scheduledStart).toLocaleString('en-US', { month: 'short' })}
          </Text>
        </View>

        <View style={styles.meetingContent}>
          <View style={styles.meetingHeader}>
            <Text style={styles.meetingTitle}>{meeting.title}</Text>
            <Badge
              label={meeting.status}
              variant={meeting.status === 'scheduled' ? 'info' : 'default'}
              size="sm"
            />
          </View>

          <View style={styles.meetingDetails}>
            <View style={styles.meetingDetail}>
              <Text style={styles.detailIcon}>{getMeetingTypeIcon(meeting.meetingType)}</Text>
              <Text style={styles.detailText}>{meeting.meetingType.replace('_', ' ')}</Text>
            </View>
            <View style={styles.meetingDetail}>
              <Text style={styles.detailIcon}>schedule</Text>
              <Text style={styles.detailText}>
                {formatTime(meeting.scheduledStart)} - {formatTime(meeting.scheduledEnd)}
              </Text>
            </View>
          </View>

          <View style={styles.meetingAttendee}>
            <Avatar
              uri={meeting.attendeeAvatar}
              name={meeting.attendeeName}
              size="sm"
            />
            <Text style={styles.attendeeName}>{meeting.attendeeName}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Actions */}
        <Card title="Quick Actions" style={styles.section}>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('OneOnOne', { screen: 'ScheduleMeeting' })}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: Colors.primary + '20' }]}>
                <Text style={styles.quickActionIconText}>add</Text>
              </View>
              <Text style={styles.quickActionLabel}>Schedule{'\n'}Meeting</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('OneOnOne', { screen: 'ActionItems' })}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: Colors.warning + '20' }]}>
                <Text style={styles.quickActionIconText}>task_alt</Text>
              </View>
              <Text style={styles.quickActionLabel}>Action{'\n'}Items</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Team')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: Colors.success + '20' }]}>
                <Text style={styles.quickActionIconText}>people</Text>
              </View>
              <Text style={styles.quickActionLabel}>View{'\n'}Team</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Upcoming Meetings */}
        <Card
          title="Upcoming 1:1 Meetings"
          headerRight={
            <TouchableOpacity onPress={() => navigation.navigate('Team')}>
              <Text style={styles.viewAll}>View Team</Text>
            </TouchableOpacity>
          }
          style={styles.section}
        >
          {meetings.length > 0 ? (
            meetings.map(renderUpcomingMeeting)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>event_available</Text>
              <Text style={styles.emptyTitle}>No Upcoming Meetings</Text>
              <Text style={styles.emptyText}>
                Schedule a 1:1 meeting with your team member
              </Text>
              <Button
                title="Schedule Meeting"
                onPress={() => navigation.navigate('OneOnOne', { screen: 'ScheduleMeeting' })}
                variant="primary"
                size="sm"
                style={styles.emptyButton}
              />
            </View>
          )}
        </Card>

        {/* Meeting Stats */}
        {meetings.length > 0 && (
          <Card title="Meeting Stats" style={styles.section}>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{meetings.length}</Text>
                <Text style={styles.statLabel}>Upcoming</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>This Week</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Action Items</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Tips */}
        <Card title="1:1 Best Practices" style={styles.section}>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>lightbulb</Text>
              <Text style={styles.tipText}>
                Prepare an agenda before each meeting
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>emoji_events</Text>
              <Text style={styles.tipText}>
                Celebrate wins and acknowledge achievements
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>track_changes</Text>
              <Text style={styles.tipText}>
                Follow up on action items from previous meetings
              </Text>
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
  section: {
    marginBottom: Spacing.md,
  },
  viewAll: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAction: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionIconText: {
    fontSize: 20,
    color: Colors.primary,
  },
  quickActionLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  meetingCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  meetingDate: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  meetingDateDay: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.primary,
  },
  meetingDateMonth: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  meetingContent: {
    flex: 1,
  },
  meetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  meetingTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  meetingDetails: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  meetingDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  detailIcon: {
    fontSize: 14,
    color: Colors.textMuted,
    marginRight: 4,
  },
  detailText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  meetingAttendee: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeeName: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    minWidth: 150,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  tipsList: {},
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  tipIcon: {
    fontSize: 18,
    color: Colors.warning,
    marginRight: Spacing.md,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
