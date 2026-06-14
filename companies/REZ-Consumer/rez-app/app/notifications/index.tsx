// @ts-nocheck
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '@/components/ui/EmptyState';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { useTheme } from '@/contexts/ThemeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationItem {
  _id: string;
  title: string;
  body: string;
  type: 'achievement' | 'cashback' | 'streak' | 'system' | string;
  isRead: boolean;
  createdAt: string;
  data?: {
    route?: string;
    [key: string];
  };
}

interface NotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}

interface GroupedSection {
  title: string;
  data: NotificationItem[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIMARY = '#1a3a52';
const GOLD = '#FFD700';
const UNREAD_DOT = '#E74C3C';
const BG = '#F7F9FC';
const CARD_BG = '#FFFFFF';
const TEXT_MUTED = '#94A3B8';
const TEXT_PRIMARY = '#1E293B';
const TEXT_SECONDARY = '#475569';
const BORDER = '#E2E8F0';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTypeIcon(type: string): { name: string; color: string; bg: string } {
  switch (type) {
    case 'achievement':
      return { name: 'trophy', color: '#F59E0B', bg: '#FEF3C7' };
    case 'cashback':
      return { name: 'cash', color: '#10B981', bg: '#D1FAE5' };
    case 'streak':
      return { name: 'flame', color: '#EF4444', bg: '#FEE2E2' };
    default:
      return { name: 'notifications', color: PRIMARY, bg: '#EFF6FF' };
  }
}

function groupByDate(items: NotificationItem[]): GroupedSection[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: Record<string, NotificationItem[]> = {
    Today: [],
    Yesterday: [],
    Earlier: [],
  };

  for (const item of items) {
    const d = new Date(item.createdAt);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) {
      groups['Today'].push(item);
    } else if (d.getTime() === yesterday.getTime()) {
      groups['Yesterday'].push(item);
    } else {
      groups['Earlier'].push(item);
    }
  }

  return (['Today', 'Yesterday', 'Earlier'] as const)
    .filter((key) => groups[key].length > 0)
    .map((key) => ({ title: key, data: groups[key] }));
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ─── API calls ────────────────────────────────────────────────────────────────

async function fetchNotifications(): Promise<NotificationsResponse> {
  const res = await apiClient.get<unknown>('/user/notifications?page=1&limit=30');
  // Support both direct and nested shapes
  const payload = (res as unknown)?.data ?? res;
  return {
    notifications: payload?.notifications ?? [],
    unreadCount: payload?.unreadCount ?? 0,
  };
}

async function markOneRead(id: string): Promise<void> {
  await apiClient.patch<unknown>(`/user/notifications/${id}/read`, {});
}

async function markAllRead(): Promise<void> {
  await apiClient.patch<unknown>('/user/notifications/read-all', {});
}

// ─── NotificationRow ──────────────────────────────────────────────────────────

interface RowProps {
  item: NotificationItem;
  onPress: (item: NotificationItem) => void;
  isDark?: boolean;
  darkCardColor?: string;
  darkTextColor?: string;
  darkSubtextColor?: string;
}

// eslint-disable-next-line react/display-name
const NotificationRow = React.memo(
  ({ item, onPress, isDark: rowIsDark, darkCardColor, darkTextColor, darkSubtextColor }: RowProps) => {
    const icon = getTypeIcon(item.type);
    return (
      <Pressable
        style={({ pressed }) => [
          styles.row,
          rowIsDark && { backgroundColor: darkCardColor },
          pressed && styles.rowPressed,
          !item.isRead && styles.rowUnread,
        ]}
        onPress={() => onPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}. ${item.isRead ? 'Read' : 'Unread'}`}
      >
        {/* Icon */}
        <View style={[styles.iconBox, { backgroundColor: icon.bg }]}>
          <Ionicons name={icon.name as unknown} size={20} color={icon.color} />
        </View>

        {/* Content */}
        <View style={styles.rowContent}>
          <View style={styles.rowHeader}>
            <Text
              style={[styles.rowTitle, !item.isRead && styles.rowTitleBold, rowIsDark && { color: darkTextColor }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text style={[styles.rowTime, rowIsDark && { color: darkSubtextColor }]}>{formatTime(item.createdAt)}</Text>
          </View>
          <Text style={[styles.rowBody, rowIsDark && { color: darkSubtextColor }]} numberOfLines={2}>
            {item.body}
          </Text>
        </View>

        {/* Unread dot */}
        {!item.isRead && <View style={styles.unreadDot} />}
      </Pressable>
    );
  },
);

// ─── SectionHeader ────────────────────────────────────────────────────────────

const SectionHeader = ({ title }: { title: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [allNotifications, setAllNotifications] = useState<NotificationItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  // Sprint 12: dark mode
  const { isDark, sprintColors: themeColors } = useTheme();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['user-notifications', page],
    queryFn: async () => {
      const res = await apiClient.get<unknown>(`/user/notifications?page=${page}&limit=30`);
      const payload = (res as unknown)?.data ?? res;
      return {
        notifications: payload?.notifications ?? [],
        unreadCount: payload?.unreadCount ?? 0,
      };
    },
    staleTime: 30_000,
  });

  const markOneMutation = useMutation({
    mutationFn: markOneRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
    },
  });

  const handleNotificationPress = useCallback(
    (item: NotificationItem) => {
      if (!item.isRead) {
        markOneMutation.mutate(item._id);
      }
      if (item.data?.route) {
        router.push(item.data.route as unknown as string);
      }
    },
    [markOneMutation, router],
  );

  const handleMarkAllRead = useCallback(() => {
    markAllMutation.mutate();
  }, [markAllMutation]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    setAllNotifications([]);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore || !data?.notifications?.length) return;
    setPage((prev) => prev + 1);
  }, [loadingMore, hasMore, data]);

  // Merge new notifications with existing
  React.useEffect(() => {
    if (data?.notifications) {
      if (page === 1) {
        setAllNotifications(data.notifications);
      } else {
        setAllNotifications((prev) => [...prev, ...data.notifications]);
      }
      setHasMore(data.notifications.length >= 30);
    }
  }, [data, page]);

  const grouped = useMemo(() => {
    if (!data?.notifications) return [];
    return groupByDate(data.notifications);
  }, [data]);

  const unreadCount = data?.unreadCount ?? 0;

  // Flatten grouped sections for FlatList
  type ListItem =
    | { kind: 'header'; title: string; key: string }
    | { kind: 'item'; item: NotificationItem; key: string };

  const listData: ListItem[] = useMemo(() => {
    const result: ListItem[] = [];
    for (const section of grouped) {
      result.push({ kind: 'header', title: section.title, key: `header-${section.title}` });
      for (const n of section.data) {
        result.push({ kind: 'item', item: n, key: n._id });
      }
    }
    return result;
  }, [grouped]);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.kind === 'header') {
        return <SectionHeader title={item.title} />;
      }
      return (
        <NotificationRow
          item={item.item}
          onPress={handleNotificationPress}
          isDark={isDark}
          darkCardColor={themeColors.card}
          darkTextColor={themeColors.text}
          darkSubtextColor={themeColors.subtext}
        />
      );
    },
    [handleNotificationPress, isDark, themeColors],
  );

  return (
    <SafeAreaView style={[styles.safeArea, isDark && { backgroundColor: themeColors.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? themeColors.card : CARD_BG}
      />

      {/* Header */}
      <View
        style={[styles.header, isDark && { backgroundColor: themeColors.card, borderBottomColor: themeColors.border }]}
      >
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={TEXT_PRIMARY} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 && (
          <Pressable
            style={styles.markAllBtn}
            onPress={handleMarkAllRead}
            disabled={markAllMutation.isPending}
            accessibilityRole="button"
            accessibilityLabel="Mark all notifications as read"
          >
            {markAllMutation.isPending ? (
              <ActivityIndicator size="small" color={PRIMARY} />
            ) : (
              <Text style={styles.markAllText}>Mark all read</Text>
            )}
          </Pressable>
        )}
      </View>

      {/* Content */}
      {isLoading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={TEXT_MUTED} />
          <Text style={styles.emptyText}>Failed to load notifications</Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : listData.length === 0 ? (
        <EmptyState
          iconName="notifications-off-outline"
          title="No notifications yet"
          subtitle="You'll see updates about your coins, streaks, and cashback here."
        />
      ) : (
        <FlatList
          data={listData}
          renderItem={renderItem}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={PRIMARY} colors={[PRIMARY]} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator size="small" color={PRIMARY} />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  unreadBadge: {
    backgroundColor: UNREAD_DOT,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  markAllBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markAllText: {
    fontSize: 13,
    color: PRIMARY,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: PRIMARY,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  list: {
    paddingBottom: 32,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: CARD_BG,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: BORDER,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: { elevation: 1 },
    }),
  },
  rowPressed: {
    opacity: 0.85,
  },
  rowUnread: {
    backgroundColor: '#F0F7FF',
    borderColor: '#BFDBFE',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowContent: {
    flex: 1,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: TEXT_PRIMARY,
    flex: 1,
    marginRight: 8,
  },
  rowTitleBold: {
    fontWeight: '700',
  },
  rowTime: {
    fontSize: 11,
    color: TEXT_MUTED,
    flexShrink: 0,
  },
  rowBody: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    lineHeight: 19,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: UNREAD_DOT,
    alignSelf: 'center',
    flexShrink: 0,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center' as const,
  },
});
