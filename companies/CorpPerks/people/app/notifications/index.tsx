// ==========================================
// MyTalent - Notifications Screen
// Real-time notifications with push support
// ==========================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuthStore } from '../../src/store/authStore';

// ==========================================
// Types
// ==========================================

interface Notification {
  notificationId: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

type NotificationType = 'all' | 'announcement' | 'task' | 'leave' | 'meeting';

// ==========================================
// Colors
// ==========================================

const COLORS = {
  background: '#0F172A',
  card: '#1E293B',
  cardAlt: '#283548',
  primary: '#6366F1',
  primaryLight: '#818CF8',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  border: '#334155',
};

// ==========================================
// API Config
// ==========================================

const API_BASE = Constants.expoConfig?.extra?.pushServiceUrl || 'http://localhost:4749';

// ==========================================
// Component
// ==========================================

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<NotificationType>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  // ==========================================
  // Fetch Notifications
  // ==========================================

  const fetchNotifications = useCallback(async (showLoader = false) => {
    if (!user) return;

    if (showLoader) setIsLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/notifications?userId=${user.id}&limit=50`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data?.notifications || []);
        setUnreadCount(data.data?.unreadCount || 0);
      }
    } catch (error) {
      logger.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  // ==========================================
  // Mark as Read
  // ==========================================

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user?.id }),
      });

      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      logger.error('Failed to mark as read:', error);
    }
  }, [user]);

  // ==========================================
  // Mark All as Read
  // ==========================================

  const markAllAsRead = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          companyId: user?.companyId,
        }),
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      logger.error('Failed to mark all as read:', error);
    }
  }, [user]);

  // ==========================================
  // Effects
  // ==========================================

  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  // ==========================================
  // Filter Notifications
  // ==========================================

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'announcement') return n.type === 'announcement';
    if (filter === 'task') return n.type === 'task_reminder' || n.type === 'task_updated';
    if (filter === 'leave') return n.type.includes('leave');
    if (filter === 'meeting') return n.type === 'meeting_reminder';
    return true;
  });

  // ==========================================
  // Get Icon for Type
  // ==========================================

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return 'megaphone';
      case 'task_reminder':
      case 'task_updated':
        return 'checkbox';
      case 'leave_approved':
        return 'checkmark-circle';
      case 'leave_rejected':
        return 'close-circle';
      case 'leave_request':
        return 'time';
      case 'meeting_reminder':
        return 'calendar';
      case 'payroll':
        return 'wallet';
      case 'document':
        return 'document-text';
      case 'general':
      default:
        return 'notifications';
    }
  };

  // ==========================================
  // Get Icon Color
  // ==========================================

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'announcement':
        return COLORS.primary;
      case 'task_reminder':
      case 'task_updated':
        return COLORS.success;
      case 'leave_approved':
        return COLORS.success;
      case 'leave_rejected':
        return COLORS.danger;
      case 'leave_request':
        return COLORS.warning;
      case 'meeting_reminder':
        return COLORS.primaryLight;
      case 'payroll':
        return COLORS.success;
      default:
        return COLORS.textMuted;
    }
  };

  // ==========================================
  // Format Date
  // ==========================================

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // ==========================================
  // Handle Notification Press
  // ==========================================

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.notificationId);
    }

    // Navigate based on type
    if (notification.data?.deepLink) {
      // Handle deep link
      logger.info('Navigate to:', notification.data.deepLink);
    }
  };

  // ==========================================
  // Render Filter Tab
  // ==========================================

  const renderFilterTab = (type: NotificationType, label: string) => (
    <TouchableOpacity
      style={[styles.filterTab, filter === type && styles.filterTabActive]}
      onPress={() => setFilter(type)}
    >
      <Text style={[styles.filterTabText, filter === type && styles.filterTabTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // ==========================================
  // Render Notification Item
  // ==========================================

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.read && styles.notificationCardUnread]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item.type) + '20' }]}>
        <Ionicons
          name={getNotificationIcon(item.type) as keyof typeof Ionicons.glyphMap}
          size={24}
          color={getNotificationColor(item.type)}
        />
      </View>

      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notificationBody} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.notificationTime}>{formatDate(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  // ==========================================
  // Render Empty State
  // ==========================================

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-outline" size={64} color={COLORS.textMuted} />
      <Text style={styles.emptyTitle}>No notifications</Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'all'
          ? "You're all caught up!"
          : `No ${filter} notifications`}
      </Text>
    </View>
  );

  // ==========================================
  // Render
  // ==========================================

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {renderFilterTab('all', 'All')}
        {renderFilterTab('announcement', 'Announcements')}
        {renderFilterTab('task', 'Tasks')}
        {renderFilterTab('leave', 'Leave')}
        {renderFilterTab('meeting', 'Meetings')}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.notificationId}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                fetchNotifications();
              }}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ==========================================
// Styles
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  markAllRead: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.card,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: COLORS.text,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  notificationCardUnread: {
    backgroundColor: COLORS.cardAlt,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
  notificationBody: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
  },
});
