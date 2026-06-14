// ==========================================
// MyTalent - One-on-One Meeting Screen
// ==========================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
  RefreshControl,
} from 'react-native';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  Shadow,
} from '../../src/components/Badge';
import { Card, Button, ProgressBar, EmptyState } from '../../src/components';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_MEETING_SERVICE_URL || 'http://localhost:4728';

// Types
interface ActionItem {
  itemId: string;
  task: string;
  description?: string;
  assigneeId: string;
  assigneeName: string;
  dueDate?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
}

interface Meeting {
  meetingId: string;
  title: string;
  scheduledStart: string;
  scheduledEnd: string;
  duration: number;
  hostName: string;
  attendeeName: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  meetingType: 'video' | 'audio' | 'in_person' | 'phone';
  meetingLink?: string;
}

interface OneOnOne {
  oneOnOneId: string;
  managerId: string;
  managerName: string;
  employeeId: string;
  employeeName: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  nextScheduled?: string;
  duration: number;
  status: 'active' | 'paused' | 'ended';
  stats: {
    totalMeetings: number;
    completedMeetings: number;
    totalActionItems: number;
    completedActionItems: number;
    averageRating?: number;
  };
}

// Mock current user (replace with actual auth context)
const currentUser = {
  userId: 'emp_001',
  name: 'John Employee',
  companyId: 'corp_001',
  managerId: 'mgr_001',
  managerName: 'Jane Manager',
};

// API Functions
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'API request failed');
  }
  return data.data;
}

const meetingApi = {
  getUpcomingMeetings: (userId: string) =>
    fetchApi<Meeting[]>(`/api/meetings/upcoming/${userId}?limit=10`),

  getMyActionItems: (userId: string, params?: { status?: string; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set('status', params.status);
    if (params?.limit) queryParams.set('limit', String(params.limit));
    const query = queryParams.toString();
    return fetchApi<ActionItem[]>(`/api/meetings/action-items/my/${userId}${query ? `?${query}` : ''}`);
  },

  updateActionItem: (itemId: string, data: { status: string }) =>
    fetchApi<ActionItem>(`/api/meetings/action-items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getActiveOneOnOnes: (userId: string) =>
    fetchApi<OneOnOne[]>(`/api/1on1/active/${userId}`),

  getOneOnOneHistory: (oneOnOneId: string) =>
    fetchApi<Meeting[]>(`/api/1on1/${oneOnOneId}/history?limit=10`),
};

// Helper Functions
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days === -1) return 'Tomorrow';
  if (days < 0 && days > -7) return `In ${Math.abs(days)} days`;
  if (days > 0 && days < 7) return `${days} days ago`;

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
};

const formatTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateTime = (dateStr: string): string => {
  return `${formatDate(dateStr)} at ${formatTime(dateStr)}`;
};

const getFrequencyLabel = (frequency: string): string => {
  const labels: Record<string, string> = {
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
  };
  return labels[frequency] || frequency;
};

const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    low: Colors.success,
    medium: Colors.warning,
    high: Colors.error,
    urgent: '#DC2626',
  };
  return colors[priority] || Colors.textMuted;
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: Colors.warning,
    in_progress: Colors.primary,
    completed: Colors.success,
    active: Colors.success,
    paused: Colors.warning,
    ended: Colors.textMuted,
  };
  return colors[status] || Colors.textMuted;
};

const getMeetingTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    video: '📹',
    audio: '🎧',
    in_person: '🏢',
    phone: '📞',
  };
  return icons[type] || '📅';
};

export default function OneOnOneScreen() {
  // State
  const [activeTab, setActiveTab] = useState<'upcoming' | 'action-items' | 'history'>('upcoming');
  const [oneOnOnes, setOneOnOnes] = useState<OneOnOne[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [meetingHistory, setMeetingHistory] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [o2os, meetings, actions] = await Promise.all([
        meetingApi.getActiveOneOnOnes(currentUser.userId).catch(() => []),
        meetingApi.getUpcomingMeetings(currentUser.userId).catch(() => []),
        meetingApi.getMyActionItems(currentUser.userId, { limit: 20 }).catch(() => []),
      ]);
      setOneOnOnes(o2os);
      setUpcomingMeetings(meetings);
      setActionItems(actions);

      // Load history for first active 1:1
      if (o2os.length > 0 && o2os[0].status === 'active') {
        const history = await meetingApi.getOneOnOneHistory(o2os[0].oneOnOneId).catch(() => []);
        setMeetingHistory(history);
      }
    } catch (error) {
      logger.error('Failed to load 1:1 data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Toggle action item completion
  const handleToggleActionItem = async (item: ActionItem) => {
    try {
      const newStatus = item.status === 'completed' ? 'pending' : 'completed';
      await meetingApi.updateActionItem(item.itemId, { status: newStatus });
      setActionItems((prev) =>
        prev.map((a) =>
          a.itemId === item.itemId ? { ...a, status: newStatus as ActionItem['status'] } : a
        )
      );
      Alert.alert('Success', `Action item marked as ${newStatus}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update action item');
    }
  };

  // Stats calculation
  const stats = {
    activeOneOnOnes: oneOnOnes.filter((o) => o.status === 'active').length,
    upcomingMeetings: upcomingMeetings.length,
    pendingActionItems: actionItems.filter((a) => a.status !== 'completed').length,
    completedActionItems: actionItems.filter((a) => a.status === 'completed').length,
    totalMeetings: oneOnOnes.reduce((sum, o) => sum + o.stats.completedMeetings, 0),
  };

  // Tab content
  const renderUpcomingTab = () => (
    <View>
      {upcomingMeetings.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No upcoming meetings"
          message="Your scheduled 1:1 meetings will appear here"
        />
      ) : (
        upcomingMeetings.map((meeting) => (
          <Card key={meeting.meetingId} style={styles.meetingCard}>
            <View style={styles.meetingHeader}>
              <View style={styles.meetingIcon}>
                <Text style={styles.iconText}>{getMeetingTypeIcon(meeting.meetingType)}</Text>
              </View>
              <View style={styles.meetingInfo}>
                <Text style={styles.meetingTitle}>{meeting.title}</Text>
                <Text style={styles.meetingSubtitle}>
                  with {meeting.hostName === currentUser.name ? meeting.attendeeName : meeting.hostName}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: Colors.primaryLight }]}>
                <Text style={[styles.statusText, { color: Colors.primary }]}>Upcoming</Text>
              </View>
            </View>
            <View style={styles.meetingDetails}>
              <Text style={styles.detailText}>📅 {formatDateTime(meeting.scheduledStart)}</Text>
              <Text style={styles.detailText}>⏱️ {meeting.duration} min</Text>
            </View>
            {meeting.meetingLink && (
              <TouchableOpacity
                style={styles.joinButton}
                onPress={() => Alert.alert('Join Meeting', 'Opening meeting link...')}
              >
                <Text style={styles.joinButtonText}>Join Meeting</Text>
              </TouchableOpacity>
            )}
          </Card>
        ))
      )}
    </View>
  );

  const renderActionItemsTab = () => (
    <View>
      {actionItems.length === 0 ? (
        <EmptyState
          icon="✅"
          title="No action items"
          message="Action items from your 1:1 meetings will appear here"
        />
      ) : (
        <>
          {/* Summary */}
          <Card style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{stats.pendingActionItems}</Text>
                <Text style={styles.summaryLabel}>Pending</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: Colors.success }]}>
                  {stats.completedActionItems}
                </Text>
                <Text style={styles.summaryLabel}>Completed</Text>
              </View>
            </View>
          </Card>

          {/* Action Items List */}
          {actionItems.map((item) => (
            <Card key={item.itemId} style={styles.actionItemCard}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => handleToggleActionItem(item)}
              >
                <View
                  style={[
                    styles.checkboxInner,
                    item.status === 'completed' && styles.checkboxChecked,
                  ]}
                >
                  {item.status === 'completed' && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
              <View style={styles.actionItemContent}>
                <View style={styles.actionItemHeader}>
                  <Text
                    style={[
                      styles.actionItemTitle,
                      item.status === 'completed' && styles.completedText,
                    ]}
                  >
                    {item.task}
                  </Text>
                  <View
                    style={[
                      styles.priorityBadge,
                      { backgroundColor: getPriorityColor(item.priority) + '20' },
                    ]}
                  >
                    <Text
                      style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}
                    >
                      {item.priority}
                    </Text>
                  </View>
                </View>
                {item.description && (
                  <Text style={styles.actionItemDesc}>{item.description}</Text>
                )}
                <View style={styles.actionItemMeta}>
                  <Text style={styles.metaText}>👤 {item.assigneeName}</Text>
                  {item.dueDate && (
                    <Text style={styles.metaText}>📅 Due: {formatDate(item.dueDate)}</Text>
                  )}
                </View>
              </View>
            </Card>
          ))}
        </>
      )}
    </View>
  );

  const renderHistoryTab = () => (
    <View>
      {meetingHistory.length === 0 ? (
        <EmptyState
          icon="📜"
          title="No meeting history"
          message="Past 1:1 meetings will appear here"
        />
      ) : (
        meetingHistory.map((meeting) => (
          <Card key={meeting.meetingId} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <View>
                <Text style={styles.historyTitle}>{meeting.title}</Text>
                <Text style={styles.historySubtitle}>
                  with {meeting.hostName === currentUser.name ? meeting.attendeeName : meeting.hostName}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: Colors.backgroundDark }]}>
                <Text style={[styles.statusText, { color: Colors.textSecondary }]}>Completed</Text>
              </View>
            </View>
            <Text style={styles.historyDate}>{formatDateTime(meeting.scheduledStart)}</Text>
          </Card>
        ))
      )}
    </View>
  );

  // Render
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading 1:1 meetings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>1:1 Meetings</Text>
        <Text style={styles.subtitle}>Your one-on-one meetings with {currentUser.managerName}</Text>
      </View>

      {/* Stats Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statsScroll}
        contentContainerStyle={styles.statsContainer}
      >
        <Card style={styles.statCard}>
          <Text style={styles.statIcon}>👥</Text>
          <Text style={styles.statValue}>{stats.activeOneOnOnes}</Text>
          <Text style={styles.statLabel}>Active 1:1s</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statIcon}>📅</Text>
          <Text style={styles.statValue}>{stats.upcomingMeetings}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statIcon}>✅</Text>
          <Text style={styles.statValue}>{stats.totalMeetings}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statIcon}>📋</Text>
          <Text style={styles.statValue}>{stats.pendingActionItems}</Text>
          <Text style={styles.statLabel}>Actions</Text>
        </Card>
      </ScrollView>

      {/* Manager Card */}
      {oneOnOnes.length > 0 && oneOnOnes[0].status === 'active' && (
        <Card style={styles.managerCard}>
          <View style={styles.managerAvatar}>
            <Text style={styles.avatarText}>
              {oneOnOnes[0].managerName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </Text>
          </View>
          <View style={styles.managerInfo}>
            <Text style={styles.managerName}>{oneOnOnes[0].managerName}</Text>
            <Text style={styles.managerDetails}>
              {getFrequencyLabel(oneOnOnes[0].frequency)} • {oneOnOnes[0].duration} min
            </Text>
            {oneOnOnes[0].nextScheduled && (
              <Text style={styles.nextMeeting}>
                📅 Next: {formatDateTime(oneOnOnes[0].nextScheduled)}
              </Text>
            )}
          </View>
          {oneOnOnes[0].stats.averageRating && (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingStar}>⭐</Text>
              <Text style={styles.ratingValue}>
                {oneOnOnes[0].stats.averageRating.toFixed(1)}
              </Text>
            </View>
          )}
        </Card>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { id: 'upcoming' as const, label: 'Upcoming', count: stats.upcomingMeetings },
          { id: 'action-items' as const, label: 'Actions', count: stats.pendingActionItems },
          { id: 'history' as const, label: 'History', count: 0 },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[styles.tabBadge, activeTab === tab.id && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === tab.id && styles.tabBadgeTextActive]}>
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'upcoming' && renderUpcomingTab()}
        {activeTab === 'action-items' && renderActionItemsTab()}
        {activeTab === 'history' && renderHistoryTab()}
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
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
  },
  header: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  statsScroll: {
    maxHeight: 120,
  },
  statsContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  statCard: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minWidth: 100,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  managerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.md,
  },
  managerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  managerInfo: {
    flex: 1,
  },
  managerName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  managerDetails: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  nextMeeting: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  ratingStar: {
    fontSize: 14,
    marginRight: 4,
  },
  ratingValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.warning,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  tabBadge: {
    backgroundColor: Colors.backgroundDark,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  tabBadgeActive: {
    backgroundColor: Colors.primary,
  },
  tabBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  tabBadgeTextActive: {
    color: Colors.textInverse,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  meetingCard: {
    marginBottom: Spacing.md,
  },
  meetingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meetingIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  iconText: {
    fontSize: 20,
  },
  meetingInfo: {
    flex: 1,
  },
  meetingTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  meetingSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  meetingDetails: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  detailText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  joinButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textInverse,
  },
  summaryCard: {
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  summaryValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  actionItemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  checkbox: {
    marginRight: Spacing.md,
    marginTop: 2,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  checkmark: {
    color: Colors.textInverse,
    fontSize: 14,
    fontWeight: FontWeight.bold,
  },
  actionItemContent: {
    flex: 1,
  },
  actionItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionItemTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
  },
  priorityText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    textTransform: 'capitalize',
  },
  actionItemDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  actionItemMeta: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  historyCard: {
    marginBottom: Spacing.md,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  historySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  historyDate: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
});
