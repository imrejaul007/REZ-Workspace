/**
 * Team Activity Log Screen
 * Displays recent team-related activities like invitations, role changes, status updates
 * Production-ready with ReZ Design System
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useTeamPermissions } from '@/hooks/usePermissions';
import { TeamActivity } from '@/types/team';
import { getRelativeTime, formatDateTime } from '@/utils/teamHelpers';
import { teamService } from '@/services/api/team';

// ReZ Design System Colors
const REZ_COLORS = {
  primary: '#00C06A',
  navy: '#0B2240',
  gold: '#FFC857',
  white: '#FFFFFF',
  background: '#F8FAFC',
  cardBg: '#FFFFFF',
  textPrimary: '#0B2240',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  border: '#E2E8F0',
};

type ActivityFilter = 'all' | 'invite' | 'role_change' | 'status_change' | 'remove';

// Activity data will be fetched from API once the team activity endpoint is available

export default function TeamActivityScreen() {
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { isDesktop, isTablet } = useResponsiveLayout();
  const { canViewTeam } = useTeamPermissions();

  // Team activity log from backend audit trail
  const {
    data: activities,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['team-activity'],
    queryFn: async (): Promise<TeamActivity[]> => {
      const result = await teamService.getTeamActivity({ limit: 100 });
      return result.activities;
    },
    enabled: canViewTeam,
    staleTime: 1 * 60 * 1000,
  });

  const filteredActivities = useMemo(() => {
    if (!activities) return [];
    if (filter === 'all') return activities;
    return activities.filter((activity) => activity.action === filter);
  }, [activities, filter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Responsive widths
  const contentMaxWidth = isDesktop ? 900 : isTablet ? 700 : undefined;

  const getActivityIcon = (action: TeamActivity['action']): { name: string; color: string } => {
    switch (action) {
      case 'invite':
        return { name: 'person-add', color: REZ_COLORS.primary };
      case 'accept':
        return { name: 'checkmark-circle', color: REZ_COLORS.success };
      case 'role_change':
        return { name: 'key', color: REZ_COLORS.warning };
      case 'status_change':
        return { name: 'shield', color: REZ_COLORS.info };
      case 'remove':
        return { name: 'person-remove', color: REZ_COLORS.error };
      case 'resend_invite':
        return { name: 'mail', color: REZ_COLORS.info };
      default:
        return { name: 'ellipse', color: REZ_COLORS.textMuted };
    }
  };

  const getActivityDescription = (activity: TeamActivity): string => {
    const details = activity.details || {};
    switch (activity.action) {
      case 'invite':
        return `${activity.performedByName} invited ${details.name || activity.targetUserEmail} as ${details.role}`;
      case 'accept':
        return `${details.name || activity.targetUserEmail} accepted the invitation and joined as ${details.role}`;
      case 'role_change':
        return `${activity.performedByName} changed ${details.name || activity.targetUserEmail}'s role from ${details.oldRole} to ${details.newRole}`;
      case 'status_change':
        return `${activity.performedByName} changed ${details.name || activity.targetUserEmail}'s status from ${details.oldStatus} to ${details.newStatus}`;
      case 'remove':
        return `${activity.performedByName} removed ${details.name || activity.targetUserEmail} from the team`;
      case 'resend_invite':
        return `${activity.performedByName} resent the invitation to ${activity.targetUserEmail}`;
      default:
        return 'Unknown activity';
    }
  };

  const FilterChip = ({
    filterKey,
    label,
    count,
  }: {
    filterKey: ActivityFilter;
    label: string;
    count: number;
  }) => {
    const isActive = filter === filterKey;
    return (
      <TouchableOpacity
        style={[styles.filterChip, isActive && styles.filterChipActive]}
        onPress={() => setFilter(filterKey)}
      >
        <ThemedText style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
          {label}
        </ThemedText>
        <View style={[styles.filterChipBadge, isActive && styles.filterChipBadgeActive]}>
          <ThemedText
            style={[styles.filterChipBadgeText, isActive && styles.filterChipBadgeTextActive]}
          >
            {count}
          </ThemedText>
        </View>
      </TouchableOpacity>
    );
  };

  const ActivityCard = ({ activity }: { activity: TeamActivity }) => {
    const { name: iconName, color: iconColor } = getActivityIcon(activity.action);
    const description = getActivityDescription(activity);

    return (
      <View style={styles.activityCard}>
        <View style={[styles.activityIconContainer, { backgroundColor: `${iconColor}15` }]}>
          <Ionicons name={iconName as unknown as keyof typeof Ionicons.glyphMap} size={20} color={iconColor} />
        </View>
        <View style={styles.activityContent}>
          <ThemedText style={styles.activityDescription}>{description}</ThemedText>
          <View style={styles.activityMeta}>
            <Ionicons name="time-outline" size={12} color={REZ_COLORS.textMuted} />
            <ThemedText style={styles.activityTime}>
              {getRelativeTime(activity.timestamp)}
            </ThemedText>
          </View>
        </View>
      </View>
    );
  };

  // Access Denied State
  if (!canViewTeam) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <View style={styles.errorIconContainer}>
          <Ionicons name="lock-closed" size={48} color={REZ_COLORS.error} />
        </View>
        <ThemedText style={styles.errorTitle}>Access Denied</ThemedText>
        <ThemedText style={styles.errorText}>
          You don't have permission to view team activity.
        </ThemedText>
      </ThemedView>
    );
  }

  // Loading State
  if (isLoading && !activities) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={REZ_COLORS.primary} />
        <ThemedText style={styles.loadingText}>Loading activity...</ThemedText>
      </ThemedView>
    );
  }

  // Error State
  if (error && !activities) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <View style={styles.errorIconContainer}>
          <Ionicons name="alert-circle" size={48} color={REZ_COLORS.error} />
        </View>
        <ThemedText style={styles.errorTitle}>Failed to Load</ThemedText>
        <ThemedText style={styles.errorText}>
          {error instanceof Error ? error.message : 'Unable to load activity log'}
        </ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Ionicons name="refresh" size={20} color={REZ_COLORS.white} />
          <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  // Calculate filter counts
  const counts = {
    all: activities?.length || 0,
    invite: activities?.filter((a) => a.action === 'invite').length || 0,
    role_change: activities?.filter((a) => a.action === 'role_change').length || 0,
    status_change: activities?.filter((a) => a.action === 'status_change').length || 0,
    remove: activities?.filter((a) => a.action === 'remove').length || 0,
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        Platform.OS === 'web' && { alignItems: 'center' },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[REZ_COLORS.primary]}
          tintColor={REZ_COLORS.primary}
        />
      }
    >
      <ThemedView style={[styles.content, Platform.OS === 'web' && { maxWidth: contentMaxWidth }]}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Activity Log</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            {filteredActivities.length} activit{filteredActivities.length !== 1 ? 'ies' : 'y'}
          </ThemedText>
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsRow}
        >
          <FilterChip filterKey="all" label="All" count={counts.all} />
          <FilterChip filterKey="invite" label="Invites" count={counts.invite} />
          <FilterChip filterKey="role_change" label="Role Changes" count={counts.role_change} />
          <FilterChip
            filterKey="status_change"
            label="Status Changes"
            count={counts.status_change}
          />
          <FilterChip filterKey="remove" label="Removals" count={counts.remove} />
        </ScrollView>

        {/* Activity List */}
        <View style={styles.section}>
          {filteredActivities.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="time-outline" size={48} color={REZ_COLORS.textMuted} />
              </View>
              <ThemedText style={styles.emptyTitle}>No Activity</ThemedText>
              <ThemedText style={styles.emptyText}>
                {filter === 'all'
                  ? 'No team activity recorded yet'
                  : `No ${filter.replace('_', ' ')} activities found`}
              </ThemedText>
              {filter !== 'all' && (
                <TouchableOpacity style={styles.emptyButton} onPress={() => setFilter('all')}>
                  <ThemedText style={styles.emptyButtonText}>View All Activity</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.activityList}>
              {filteredActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </View>
          )}
        </View>

        {/* Legend */}
        <View style={styles.legendSection}>
          <ThemedText style={styles.legendTitle}>Activity Types</ThemedText>
          <View style={styles.legendGrid}>
            <LegendItem icon="person-add" color={REZ_COLORS.primary} label="Invitation Sent" />
            <LegendItem
              icon="checkmark-circle"
              color={REZ_COLORS.success}
              label="Invitation Accepted"
            />
            <LegendItem icon="key" color={REZ_COLORS.warning} label="Role Changed" />
            <LegendItem icon="shield" color={REZ_COLORS.info} label="Status Changed" />
            <LegendItem icon="person-remove" color={REZ_COLORS.error} label="Member Removed" />
            <LegendItem icon="mail" color={REZ_COLORS.info} label="Invitation Resent" />
          </View>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const LegendItem = ({ icon, color, label }: { icon: string; color: string; label: string }) => (
  <View style={styles.legendItem}>
    <Ionicons name={icon as unknown as keyof typeof Ionicons.glyphMap} size={16} color={color} />
    <ThemedText style={styles.legendLabel}>{label}</ThemedText>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: REZ_COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 16,
    width: '100%',
  },

  // Header
  header: {
    backgroundColor: REZ_COLORS.white,
    borderRadius: 12,
    padding: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: REZ_COLORS.navy,
  },
  headerSubtitle: {
    fontSize: 14,
    color: REZ_COLORS.textSecondary,
    marginTop: 4,
  },

  // Filters
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: REZ_COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: REZ_COLORS.border,
    ...Platform.select({ web: { cursor: 'pointer' }, default: {} }),
  },
  filterChipActive: {
    backgroundColor: REZ_COLORS.primary,
    borderColor: REZ_COLORS.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: REZ_COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: REZ_COLORS.white,
  },
  filterChipBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: REZ_COLORS.background,
  },
  filterChipBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  filterChipBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: REZ_COLORS.textSecondary,
  },
  filterChipBadgeTextActive: {
    color: REZ_COLORS.white,
  },

  // Section
  section: {
    backgroundColor: REZ_COLORS.white,
    borderRadius: 16,
    padding: 20,
  },

  // Activity List
  activityList: {
    gap: 12,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: REZ_COLORS.background,
    borderRadius: 12,
    padding: 14,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: REZ_COLORS.textPrimary,
    lineHeight: 20,
    marginBottom: 6,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityTime: {
    fontSize: 12,
    color: REZ_COLORS.textMuted,
  },

  // Legend
  legendSection: {
    backgroundColor: REZ_COLORS.white,
    borderRadius: 16,
    padding: 20,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: REZ_COLORS.textSecondary,
    marginBottom: 12,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: REZ_COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  legendLabel: {
    fontSize: 12,
    color: REZ_COLORS.textSecondary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: REZ_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: REZ_COLORS.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: REZ_COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: REZ_COLORS.primary,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: REZ_COLORS.white,
  },

  // Loading & Error States
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: REZ_COLORS.textPrimary,
    marginTop: 12,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${REZ_COLORS.error}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: REZ_COLORS.textPrimary,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: REZ_COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 300,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: REZ_COLORS.primary,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: REZ_COLORS.white,
  },
});
