// ==========================================
// MyTalent - Team Meetings Screen
// Upcoming & Past Meetings View
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { Colors } from '../../components/Badge';
import { teamCollabService, Meeting } from '../../services/teamCollabService';

export default function MeetingsScreen() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [actionItems, setActionItems] = useState<Array<{
    id: string;
    task: string;
    assigneeName: string;
    dueDate?: string;
    completed: boolean;
    meetingTitle?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'action-items'>('upcoming');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [meetingsData, actionItemsData] = await Promise.all([
        teamCollabService.getUpcomingMeetings(20),
        teamCollabService.getMyActionItems(10),
      ]);
      setMeetings(meetingsData);
      setActionItems(actionItemsData);
    } catch (error) {
      logger.error('Failed to load meetings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function handleToggleActionItem(meetingId: string, itemId: string) {
    try {
      const completed = await teamCollabService.toggleActionItem(meetingId, itemId);
      setActionItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, completed } : item
        )
      );
    } catch (error) {
      logger.error('Failed to toggle action item:', error);
    }
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatFullDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const getDaysUntil = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff < 0) return 'Past';
    return `In ${diff} days`;
  };

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return '📹';
      case 'audio': return '🎧';
      case 'in_person': return '🏢';
      case 'phone': return '📞';
      default: return '📹';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return { bg: Colors.primaryLight, text: Colors.primary };
      case 'in_progress': return { bg: '#DCFCE7', text: Colors.success };
      case 'completed': return { bg: Colors.background, text: Colors.textMuted };
      case 'cancelled': return { bg: '#FEE2E2', text: Colors.danger };
      default: return { bg: Colors.background, text: Colors.textMuted };
    }
  };

  const joinMeeting = async (meeting: Meeting) => {
    if (!meeting.meetingLink) {
      Alert.alert('No Link', 'This meeting does not have a video link.');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(meeting.meetingLink);
      if (supported) {
        await Linking.openURL(meeting.meetingLink);
      } else {
        Alert.alert('Error', 'Cannot open meeting link.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open meeting link.');
    }
  };

  const todayMeetings = meetings.filter((m) => {
    const today = new Date();
    const start = new Date(m.startTime);
    return start.toDateString() === today.toDateString();
  });

  const upcomingMeetings = meetings.filter((m) => {
    const today = new Date();
    const start = new Date(m.startTime);
    return start > today;
  });

  const renderMeetingCard = (meeting: Meeting) => {
    const statusStyle = getStatusColor(meeting.status);
    const isToday = new Date(meeting.startTime).toDateString() === new Date().toDateString();

    return (
      <View key={meeting.meetingId} style={styles.meetingCard}>
        <View style={styles.meetingHeader}>
          <View style={[styles.meetingIcon, { backgroundColor: statusStyle.bg }]}>
            <Text style={styles.meetingIconText}>{getMeetingTypeIcon(meeting.meetingType)}</Text>
          </View>
          <View style={styles.meetingInfo}>
            <View style={styles.meetingTitleRow}>
              <Text style={styles.meetingTitle} numberOfLines={1}>{meeting.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                <Text style={[styles.statusText, { color: statusStyle.text }]}>
                  {meeting.status === 'in_progress' ? 'LIVE' :
                   meeting.status === 'scheduled' ? formatTime(meeting.startTime) :
                   meeting.status}
                </Text>
              </View>
            </View>
            <Text style={styles.meetingHost}>Hosted by {meeting.hostName}</Text>
          </View>
        </View>

        <View style={styles.meetingMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>🗓</Text>
            <Text style={styles.metaText}>{formatFullDate(meeting.startTime)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>🕐</Text>
            <Text style={styles.metaText}>{formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>👥</Text>
            <Text style={styles.metaText}>{meeting.attendees.length} attendees</Text>
          </View>
        </View>

        {meeting.actionItems.length > 0 && (
          <View style={styles.actionItemsPreview}>
            <Text style={styles.actionItemsLabel}>
              Action Items ({meeting.actionItems.filter((a) => a.completed).length}/{meeting.actionItems.length})
            </Text>
            {meeting.actionItems.slice(0, 2).map((item) => (
              <View key={item.id} style={styles.actionItemPreview}>
                <View style={[styles.actionItemDot, item.completed && styles.actionItemDotCompleted]} />
                <Text style={[styles.actionItemText, item.completed && styles.actionItemTextCompleted]}>
                  {item.task}
                </Text>
              </View>
            ))}
          </View>
        )}

        {meeting.status === 'scheduled' && meeting.meetingLink && (
          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => joinMeeting(meeting)}
          >
            <Text style={styles.joinButtonText}>Join Meeting</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderActionItem = (item: {
    id: string;
    task: string;
    assigneeName: string;
    dueDate?: string;
    completed: boolean;
    meetingTitle?: string;
  }) => {
    const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() && !item.completed;

    return (
      <View key={item.id} style={styles.actionItemCard}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => handleToggleActionItem('', item.id)}
        >
          <View style={[styles.checkboxInner, item.completed && styles.checkboxChecked]}>
            {item.completed && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>
        <View style={styles.actionItemContent}>
          <Text style={[styles.actionItemTitle, item.completed && styles.actionItemTitleCompleted]}>
            {item.task}
          </Text>
          <View style={styles.actionItemMeta}>
            {item.meetingTitle && (
              <Text style={styles.actionItemMeeting}>📋 {item.meetingTitle}</Text>
            )}
            {item.dueDate && (
              <Text style={[styles.actionItemDue, isOverdue && styles.actionItemDueOverdue]}>
                {isOverdue ? '⚠️ ' : '📅 '}
                {new Date(item.dueDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                })}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meetings</Text>
        <Text style={styles.headerSubtitle}>Your scheduled meetings</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{todayMeetings.length}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{upcomingMeetings.length}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: Colors.danger }]}>
            {actionItems.filter((a) => !a.completed).length}
          </Text>
          <Text style={styles.statLabel}>Pending Tasks</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'action-items' && styles.tabActive]}
          onPress={() => setActiveTab('action-items')}
        >
          <Text style={[styles.tabText, activeTab === 'action-items' && styles.tabTextActive]}>
            Action Items
          </Text>
          {actionItems.filter((a) => !a.completed).length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {actionItems.filter((a) => !a.completed).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'upcoming' ? (
          meetings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>No upcoming meetings</Text>
              <Text style={styles.emptySubtitle}>You're all caught up!</Text>
            </View>
          ) : (
            <>
              {todayMeetings.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Today</Text>
                  {todayMeetings.map(renderMeetingCard)}
                </View>
              )}
              {upcomingMeetings.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Upcoming</Text>
                  {upcomingMeetings.map(renderMeetingCard)}
                </View>
              )}
            </>
          )
        ) : (
          actionItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyTitle}>No action items</Text>
              <Text style={styles.emptySubtitle}>Tasks from meetings will appear here</Text>
            </View>
          ) : (
            <>
              {/* Pending */}
              {actionItems.filter((a) => !a.completed).length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Pending</Text>
                  {actionItems.filter((a) => !a.completed).map(renderActionItem)}
                </View>
              )}
              {/* Completed */}
              {actionItems.filter((a) => a.completed).length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Completed</Text>
                  {actionItems.filter((a) => a.completed).map(renderActionItem)}
                </View>
              )}
            </>
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  header: {
    backgroundColor: Colors.primary,
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: Colors.danger,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  meetingCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  meetingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  meetingIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  meetingIconText: {
    fontSize: 20,
  },
  meetingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  meetingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meetingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  meetingHost: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  meetingMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaIcon: {
    fontSize: 12,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  actionItemsPreview: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  actionItemsLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textMuted,
    marginBottom: 8,
  },
  actionItemPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionItemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textMuted,
    marginRight: 8,
  },
  actionItemDotCompleted: {
    backgroundColor: Colors.success,
  },
  actionItemText: {
    fontSize: 13,
    color: Colors.text,
    flex: 1,
  },
  actionItemTextCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  joinButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionItemCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  checkbox: {
    marginRight: 12,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionItemContent: {
    flex: 1,
  },
  actionItemTitle: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 20,
  },
  actionItemTitleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  actionItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  actionItemMeeting: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  actionItemDue: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  actionItemDueOverdue: {
    color: Colors.danger,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
