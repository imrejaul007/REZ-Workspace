/**
 * Activity Timeline Screen
 * Premium-designed timeline view for audit logs with visual timeline
 * Permissions required: logs:view
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { Colors, Spacing, Shadows, BorderRadius, Typography } from '@/constants/DesignTokens';
import {
  Heading2,
  Heading3,
  BodyText,
  Caption,
  Card,
  Avatar,
  Badge,
  Spacer,
} from '@/components/ui/DesignSystemComponents';
import { useTheme, useThemedStyles } from '@/components/ui/ThemeProvider';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/utils/permissions';
import type { MerchantRole } from '@/types/team';
import {
  useActivityTimeline,
  useTodayActivities,
  useRecentActivities,
  useFormatAuditLog,
} from '@/hooks/queries/useAudit';
import { TimelineEntry, AuditSeverity } from '@/types/audit';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Filter types
type TimeFilter = 'today' | 'week' | 'all';

// Severity color mapping
const getSeverityColor = (severity: AuditSeverity): string => {
  const colors: Record<AuditSeverity, string> = {
    info: Colors.primary[500],
    warning: Colors.warning[500],
    error: Colors.error[500],
    critical: Colors.error[700],
  };
  return colors[severity] || Colors.primary[500];
};

const getSeverityGlow = (severity: AuditSeverity): string => {
  const colors: Record<AuditSeverity, string> = {
    info: Colors.primary[200],
    warning: Colors.warning[200],
    error: Colors.error[200],
    critical: Colors.error[300],
  };
  return colors[severity] || Colors.primary[200];
};

// Group entries by date
const groupEntriesByDate = (entries: TimelineEntry[]): Map<string, TimelineEntry[]> => {
  const groups = new Map<string, TimelineEntry[]>();

  entries.forEach((entry) => {
    const date = new Date(entry.timestamp).toDateString();
    const existing = groups.get(date) || [];
    groups.set(date, [...existing, entry]);
  });

  return groups;
};

// Format date for display
const formatDateHeader = (dateString: string): { day: string; full: string } => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return { day: 'Today', full: 'Today' };
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return { day: 'Yesterday', full: 'Yesterday' };
  }

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  };
  return {
    day: date.toLocaleDateString('en-US', { weekday: 'short' }),
    full: date.toLocaleDateString('en-US', options),
  };
};

// Format relative time
const formatRelativeTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Format absolute time
const formatAbsoluteTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// Auto-refresh indicator component
const AutoRefreshIndicator: React.FC<{ isRefreshing: boolean }> = ({ isRefreshing }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isRefreshing) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      rotation.value = 0;
    }
  }, [isRefreshing]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  if (!isRefreshing) return null;

  return (
    <Animated.View style={[styles.refreshIndicator, animatedStyle]}>
      <Ionicons name="sync" size={14} color={Colors.primary[500]} />
    </Animated.View>
  );
};

// Timeline dot component
const TimelineDot: React.FC<{
  severity: AuditSeverity;
  isFirst?: boolean;
  isLast?: boolean;
}> = ({ severity, isFirst, isLast }) => {
  const dotColor = getSeverityColor(severity);
  const glowColor = getSeverityGlow(severity);

  return (
    <View style={styles.timelineDotContainer}>
      {/* Vertical line - top */}
      {!isFirst && (
        <View style={[styles.timelineLineTop, { backgroundColor: Colors.border.default }]} />
      )}

      {/* Dot with glow */}
      <View style={[styles.timelineDotGlow, { backgroundColor: glowColor }]}>
        <View style={[styles.timelineDot, { backgroundColor: dotColor }]} />
      </View>

      {/* Vertical line - bottom */}
      {!isLast && (
        <View style={[styles.timelineLineBottom, { backgroundColor: Colors.border.default }]} />
      )}
    </View>
  );
};

// Timeline entry component
const TimelineEntryCard: React.FC<{
  entry: TimelineEntry;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onPress: (entry: TimelineEntry) => void;
  formatLog: (log: TimelineEntry) => unknown;
}> = ({ entry, index, isFirst, isLast, onPress, formatLog }) => {
  const { theme } = useTheme();
  const formatted = formatLog(entry);
  const severityColor = getSeverityColor(entry.severity);

  // Get initials from user
  const getInitials = (): string => {
    if (entry.user?.name) {
      const parts = entry.user.name.split(' ');
      return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0].substring(0, 2);
    }
    if (entry.user?.email) {
      return entry.user.email.substring(0, 2);
    }
    return 'SY'; // System
  };

  // Get avatar background color based on user
  const getAvatarColor = (): string => {
    const colors = [
      Colors.primary[500],
      Colors.success[500],
      Colors.warning[500],
      '#8b5cf6', // Purple
      '#ec4899', // Pink
      '#06b6d4', // Cyan
    ];
    const hash = (entry.user?.id || 'system').split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 50).duration(300)}
      style={styles.timelineRow}
    >
      {/* Timeline dot */}
      <TimelineDot severity={entry.severity} isFirst={isFirst} isLast={isLast} />

      {/* Entry card */}
      <TouchableOpacity
        style={[styles.entryCard, Shadows.sm]}
        onPress={() => onPress(entry)}
        activeOpacity={0.7}
      >
        {/* Severity accent */}
        <View style={[styles.severityAccent, { backgroundColor: severityColor }]} />

        <View style={styles.entryContent}>
          {/* Header with avatar and time */}
          <View style={styles.entryHeader}>
            <View style={styles.entryUserSection}>
              <Avatar
                size="small"
                initials={getInitials()}
                backgroundColor={getAvatarColor()}
                textColor={Colors.text.inverse}
              />
              <View style={styles.entryUserInfo}>
                <BodyText style={styles.entryUserName}>
                  {entry.user?.name || entry.user?.email || 'System'}
                </BodyText>
                <Caption style={styles.entryUserRole}>{entry.user?.role || 'Automated'}</Caption>
              </View>
            </View>

            <View style={styles.entryTimeSection}>
              <Caption style={styles.entryRelativeTime}>
                {formatRelativeTime(entry.timestamp)}
              </Caption>
              <Caption style={styles.entryAbsoluteTime}>
                {formatAbsoluteTime(entry.timestamp)}
              </Caption>
            </View>
          </View>

          {/* Action description */}
          <View style={styles.entryAction}>
            <Ionicons
              name={getActionIcon(entry.action)}
              size={16}
              color={severityColor}
              style={styles.actionIcon}
            />
            <BodyText style={styles.actionText} numberOfLines={2}>
              {formatted.displayAction || formatActionLabel(entry.action)}
            </BodyText>
          </View>

          {/* Resource affected */}
          <View style={styles.entryResource}>
            <View style={styles.resourceBadge}>
              <Ionicons name="cube-outline" size={12} color={Colors.text.tertiary} />
              <Caption style={styles.resourceText}>
                {formatted.displayResource || entry.resourceType}
                {entry.resourceId && ` #${entry.resourceId.substring(0, 8)}`}
              </Caption>
            </View>

            {entry.ipAddress && (
              <View style={styles.resourceBadge}>
                <Ionicons name="globe-outline" size={12} color={Colors.text.tertiary} />
                <Caption style={styles.resourceText}>{entry.ipAddress}</Caption>
              </View>
            )}
          </View>
        </View>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={18} color={Colors.gray[400]} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// Get action icon
const getActionIcon = (action: string): keyof typeof Ionicons.glyphMap => {
  if (action.includes('created') || action.includes('add')) return 'add-circle-outline';
  if (action.includes('updated') || action.includes('changed')) return 'create-outline';
  if (action.includes('deleted') || action.includes('removed')) return 'trash-outline';
  if (action.includes('login')) return 'log-in-outline';
  if (action.includes('logout')) return 'log-out-outline';
  if (action.includes('export')) return 'download-outline';
  if (action.includes('import')) return 'cloud-upload-outline';
  if (action.includes('payment')) return 'card-outline';
  if (action.includes('order')) return 'receipt-outline';
  if (action.includes('status')) return 'swap-horizontal-outline';
  if (action.includes('permission') || action.includes('role')) return 'shield-outline';
  return 'ellipse-outline';
};

// Format action label
const formatActionLabel = (action: string): string => {
  return action.replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

// Date separator component
const DateSeparator: React.FC<{ date: string; index: number }> = ({ date, index }) => {
  const { day, full } = formatDateHeader(date);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(300)}
      style={styles.dateSeparator}
    >
      <View style={styles.dateSeparatorLine} />
      <View style={styles.dateSeparatorContent}>
        <Caption style={styles.dateSeparatorDay}>{day}</Caption>
        <BodyText style={styles.dateSeparatorFull}>{full}</BodyText>
      </View>
      <View style={styles.dateSeparatorLine} />
    </Animated.View>
  );
};

// Filter chip component
const FilterChip: React.FC<{
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}> = ({ label, active, onPress, icon }) => {
  return (
    <TouchableOpacity
      style={[styles.filterChip, active && styles.filterChipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {active ? (
        <LinearGradient
          colors={[Colors.primary[500], Colors.primary[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.filterChipGradient}
        >
          {icon && <Ionicons name={icon} size={14} color={Colors.text.inverse} />}
          <Caption style={styles.filterChipTextActive}>{label}</Caption>
        </LinearGradient>
      ) : (
        <View style={styles.filterChipInner}>
          {icon && <Ionicons name={icon} size={14} color={Colors.text.tertiary} />}
          <Caption style={styles.filterChipText}>{label}</Caption>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Main component
export default function ActivityTimelineScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const formatLog = useFormatAuditLog();

  // Permission check
  const canView = user?.role ? hasPermission(user.role as MerchantRole, 'logs:view') : false;

  // State
  const [activeFilter, setActiveFilter] = useState<TimeFilter>('today');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Queries based on filter
  const {
    data: todayData,
    isLoading: todayLoading,
    isFetching: todayFetching,
    refetch: refetchToday,
  } = useTodayActivities({
    enabled: canView && activeFilter === 'today',
  });

  const {
    data: recentData,
    isLoading: recentLoading,
    isFetching: recentFetching,
    refetch: refetchRecent,
  } = useRecentActivities(50, {
    enabled: canView && activeFilter === 'week',
  });

  const {
    data: allData,
    isLoading: allLoading,
    isFetching: allFetching,
    refetch: refetchAll,
  } = useActivityTimeline({ limit: 100 }, {
    enabled: canView && activeFilter === 'all',
  });

  // Get current data based on filter
  const currentData = useMemo(() => {
    switch (activeFilter) {
      case 'today':
        return todayData;
      case 'week':
        return recentData;
      case 'all':
        return allData;
      default:
        return null;
    }
  }, [activeFilter, todayData, recentData, allData]);

  const isLoading =
    activeFilter === 'today' ? todayLoading : activeFilter === 'week' ? recentLoading : allLoading;

  const isFetching =
    activeFilter === 'today'
      ? todayFetching
      : activeFilter === 'week'
        ? recentFetching
        : allFetching;

  // Group entries by date
  const groupedEntries = useMemo(() => {
    if (!currentData?.entries) return new Map();
    return groupEntriesByDate(currentData.entries);
  }, [currentData]);

  // Flatten grouped entries for FlatList
  const flattenedData = useMemo(() => {
    const items: Array<{
      type: 'date' | 'entry';
      data: string | TimelineEntry;
      dateIndex: number;
    }> = [];
    let dateIndex = 0;

    groupedEntries.forEach((entries, date) => {
      items.push({ type: 'date', data: date, dateIndex });
      entries.forEach((entry) => {
        items.push({ type: 'entry', data: entry, dateIndex });
      });
      dateIndex++;
    });

    return items;
  }, [groupedEntries]);

  // Handlers
  const handleRefresh = useCallback(async () => {
    setLastRefresh(new Date());
    switch (activeFilter) {
      case 'today':
        await refetchToday();
        break;
      case 'week':
        await refetchRecent();
        break;
      case 'all':
        await refetchAll();
        break;
    }
  }, [activeFilter, refetchToday, refetchRecent, refetchAll]);

  const handleEntryPress = useCallback((entry: TimelineEntry) => {
    router.push(`/audit/${entry.id}`);
  }, []);

  const handleFilterChange = useCallback((filter: TimeFilter) => {
    setActiveFilter(filter);
  }, []);

  // Render item
  const renderItem = useCallback(
    ({ item, index }: { item: (typeof flattenedData)[0]; index: number }) => {
      if (item.type === 'date') {
        return <DateSeparator date={item.data as string} index={item.dateIndex} />;
      }

      const entry = item.data as TimelineEntry;
      const dateEntries = groupedEntries.get(new Date(entry.timestamp).toDateString()) || [];
      const entryIndex = dateEntries.findIndex((e) => e.id === entry.id);
      const isFirst = entryIndex === 0;
      const isLast = entryIndex === dateEntries.length - 1;

      return (
        <TimelineEntryCard
          entry={entry}
          index={index}
          isFirst={isFirst}
          isLast={isLast}
          onPress={handleEntryPress}
          formatLog={formatLog}
        />
      );
    },
    [groupedEntries, handleEntryPress, formatLog]
  );

  const keyExtractor = useCallback((item: (typeof flattenedData)[0], index: number) => {
    if (item.type === 'date') {
      return `date-${item.data}`;
    }
    return (item.data as TimelineEntry).id;
  }, []);

  // Empty state
  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Spacer size="base" />
          <BodyText style={styles.emptyText}>Loading activity timeline...</BodyText>
        </View>
      );
    }

    return (
      <Animated.View entering={FadeIn.duration(300)} style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <LinearGradient
            colors={[Colors.gray[100], Colors.gray[200]]}
            style={styles.emptyIconGradient}
          >
            <Ionicons name="time-outline" size={48} color={Colors.gray[400]} />
          </LinearGradient>
        </View>
        <Spacer size="lg" />
        <Heading3 style={styles.emptyTitle}>No Activity Yet</Heading3>
        <Spacer size="sm" />
        <BodyText style={styles.emptyText}>
          {activeFilter === 'today'
            ? 'No activities recorded today. Check back later!'
            : activeFilter === 'week'
              ? 'No activities recorded this week.'
              : 'No activities found in the timeline.'}
        </BodyText>
      </Animated.View>
    );
  };

  // Permission denied
  if (!canView) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionDenied}>
          <View style={styles.permissionIconContainer}>
            <LinearGradient
              colors={[Colors.error[100], Colors.error[200]]}
              style={styles.permissionIconGradient}
            >
              <Ionicons name="lock-closed-outline" size={48} color={Colors.error[500]} />
            </LinearGradient>
          </View>
          <Spacer size="lg" />
          <Heading3 style={styles.permissionTitle}>Access Restricted</Heading3>
          <Spacer size="sm" />
          <BodyText style={styles.permissionText}>
            You don't have permission to view the activity timeline.
          </BodyText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Glassmorphic Header */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <LinearGradient
          colors={[Colors.primary[500], Colors.primary[600], Colors.primary[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Header content */}
          <View style={styles.headerContent}>
            <View style={styles.headerTitleSection}>
              <Heading2 style={styles.headerTitle}>Activity Timeline</Heading2>
              <View style={styles.headerSubtitleRow}>
                <Caption style={styles.headerSubtitle}>
                  {currentData?.count || 0} activities
                </Caption>
                <AutoRefreshIndicator isRefreshing={isFetching} />
              </View>
            </View>

            <TouchableOpacity
              style={styles.headerRefreshButton}
              onPress={handleRefresh}
              disabled={isFetching}
            >
              <Ionicons name="refresh" size={20} color={Colors.text.inverse} />
            </TouchableOpacity>
          </View>

          {/* Filter chips */}
          <View style={styles.filterContainer}>
            <FilterChip
              label="Today"
              icon="today-outline"
              active={activeFilter === 'today'}
              onPress={() => handleFilterChange('today')}
            />
            <FilterChip
              label="This Week"
              icon="calendar-outline"
              active={activeFilter === 'week'}
              onPress={() => handleFilterChange('week')}
            />
            <FilterChip
              label="All"
              icon="infinite-outline"
              active={activeFilter === 'all'}
              onPress={() => handleFilterChange('all')}
            />
          </View>

          {/* Glassmorphic overlay */}
          <View style={styles.headerGlassOverlay} />
        </LinearGradient>
      </Animated.View>

      {/* Timeline list */}
      <FlatList
        data={flattenedData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={handleRefresh}
            tintColor={Colors.primary[500]}
            colors={[Colors.primary[500]]}
          />
        }
        ListEmptyComponent={renderEmpty}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },

  // Header styles
  header: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: BorderRadius['2xl'],
    borderBottomRightRadius: BorderRadius['2xl'],
    overflow: 'hidden',
  },
  headerGlassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomLeftRadius: BorderRadius['2xl'],
    borderBottomRightRadius: BorderRadius['2xl'],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
    zIndex: 1,
  },
  headerTitleSection: {
    flex: 1,
  },
  headerTitle: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: Typography.fontSize.sm,
  },
  headerRefreshButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Filter styles
  filterContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    zIndex: 1,
  },
  filterChip: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  filterChipActive: {
    ...Shadows.sm,
  },
  filterChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  filterChipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius.full,
  },
  filterChipText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: Colors.text.inverse,
    fontWeight: '600',
  },

  // Refresh indicator
  refreshIndicator: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // List styles
  listContent: {
    padding: Spacing.base,
    paddingTop: Spacing.lg,
    flexGrow: 1,
  },

  // Date separator
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
    gap: Spacing.md,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border.default,
  },
  dateSeparatorContent: {
    alignItems: 'center',
  },
  dateSeparatorDay: {
    color: Colors.text.tertiary,
    fontSize: Typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dateSeparatorFull: {
    color: Colors.text.secondary,
    fontWeight: '600',
  },

  // Timeline row
  timelineRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },

  // Timeline dot
  timelineDotContainer: {
    width: 40,
    alignItems: 'center',
    paddingTop: Spacing.base,
  },
  timelineLineTop: {
    width: 2,
    height: 20,
    position: 'absolute',
    top: 0,
  },
  timelineLineBottom: {
    width: 2,
    flex: 1,
    position: 'absolute',
    bottom: 0,
    top: 36,
  },
  timelineDotGlow: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Entry card
  entryCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    alignItems: 'center',
    overflow: 'hidden',
  },
  severityAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
  },
  entryContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },

  // Entry header
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  entryUserSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  entryUserInfo: {
    justifyContent: 'center',
  },
  entryUserName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  entryUserRole: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    marginTop: 1,
  },
  entryTimeSection: {
    alignItems: 'flex-end',
  },
  entryRelativeTime: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  entryAbsoluteTime: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    marginTop: 1,
  },

  // Entry action
  entryAction: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  actionIcon: {
    marginTop: 2,
  },
  actionText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    lineHeight: Typography.lineHeight.sm,
  },

  // Entry resource
  entryResource: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  resourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.tertiary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  resourceText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
  },
  emptyIconContainer: {
    marginBottom: Spacing.sm,
  },
  emptyIconGradient: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: Colors.text.primary,
    textAlign: 'center',
  },
  emptyText: {
    color: Colors.text.tertiary,
    textAlign: 'center',
    maxWidth: 280,
  },

  // Permission denied
  permissionDenied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
  },
  permissionIconContainer: {
    marginBottom: Spacing.sm,
  },
  permissionIconGradient: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: {
    color: Colors.text.primary,
    textAlign: 'center',
  },
  permissionText: {
    color: Colors.text.tertiary,
    textAlign: 'center',
    maxWidth: 280,
  },
});
