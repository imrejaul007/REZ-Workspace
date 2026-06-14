/**
 * Team Dashboard Screen
 * Production-ready team management with ReZ Design System
 * Features: Overview, Members list, Quick Actions with search/filter
 */

import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { teamService } from '@/services/api/team';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useTeamPermissions } from '@/hooks/usePermissions';
import { TeamMemberSummary, MerchantRole, TeamMemberStatus } from '@/types/team';
import {
  getTeamStats,
  formatRoleName,
  getRoleColor,
  getRoleIcon,
  formatStatusName,
  getStatusColor,
  getRelativeTime,
  getInitials,
  getAvatarColor,
} from '@/utils/teamHelpers';
import { logger } from '@/utils/logger';

const TEAM_PAGE_SIZE = 20;

type ViewTab = 'overview' | 'members' | 'actions';
type RoleFilter = 'all' | MerchantRole;
type StatusFilter = 'all' | TeamMemberStatus;

export default function TeamScreen() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme ?? 'light';
  const colors = Colors[scheme];
  const [activeTab, setActiveTab] = useState<ViewTab>('overview');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  // M4 FIX: pagination state
  const [teamPage, setTeamPage] = useState(1);
  const [accumulatedMembers, setAccumulatedMembers] = useState<TeamMemberSummary[]>([]);
  const [serverTotal, setServerTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const { isDesktop, isTablet } = useResponsiveLayout();
  const {
    canViewTeam,
    canInviteMembers,
    canRemoveMembers,
    canChangeRoles,
    canChangeStatus,
    currentRole,
  } = useTeamPermissions();

  // M4 FIX: Fetch team members with pagination
  const {
    data: teamData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['team-members', 1, TEAM_PAGE_SIZE],
    queryFn: () => teamService.getTeamMembers({ page: 1, limit: TEAM_PAGE_SIZE }),
    enabled: canViewTeam,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Safe extraction of team members — populate accumulated list on first page load
  const teamMembers: TeamMemberSummary[] = useMemo(() => {
    if (!teamData) return accumulatedMembers;
    const fresh: TeamMemberSummary[] =
      teamData.data?.teamMembers ?? (teamData as unknown as { teamMembers: TeamMemberSummary[] }).teamMembers ?? [];
    const total: number = teamData.data?.total ?? (teamData as unknown as { total: number }).total ?? fresh.length;
    setServerTotal(total);
    // First page replaces accumulated list; subsequent pages are appended via loadMoreTeamMembers
    if (accumulatedMembers.length === 0 || teamPage === 1) {
      setAccumulatedMembers(fresh);
      return fresh;
    }
    return accumulatedMembers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamData]);

  // Check if this is sample/demo data
  const isSampleData = (teamData as unknown as { isSampleData?: boolean })?.isSampleData || teamMembers.length === 0;

  // Calculate stats
  const stats = useMemo(() => getTeamStats(teamMembers), [teamMembers]);

  // Filtered members for Members tab
  const filteredMembers = useMemo(() => {
    return teamMembers.filter((member) => {
      const matchesSearch =
        !search ||
        member.name.toLowerCase().includes(search.toLowerCase()) ||
        member.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'all' || member.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [teamMembers, search, roleFilter, statusFilter]);

  // Recent members for Overview tab
  const recentMembers = useMemo(() => teamMembers.slice(0, 5), [teamMembers]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setTeamPage(1);
    setAccumulatedMembers([]);
    await refetch();
    setRefreshing(false);
  };

  // M4 FIX: load next page and append
  const loadMoreTeamMembers = useCallback(async () => {
    if (loadingMore || accumulatedMembers.length >= serverTotal) return;
    setLoadingMore(true);
    try {
      const nextPage = teamPage + 1;
      const result = await teamService.getTeamMembers({ page: nextPage, limit: TEAM_PAGE_SIZE });
      const newMembers: TeamMemberSummary[] =
        result.data?.teamMembers ?? (result as unknown as { teamMembers: TeamMemberSummary[] }).teamMembers ?? [];
      setAccumulatedMembers((prev) => [...prev, ...newMembers]);
      setTeamPage(nextPage);
    } catch (e) {
      if (__DEV__) console.error('Load more team members failed:', e);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, accumulatedMembers.length, serverTotal, teamPage]);

  const handleInviteMember = () => {
    router.push('/team/invite');
  };

  const handleViewAllMembers = () => {
    setActiveTab('members');
  };

  const handleViewMember = (memberId: string) => {
    router.push(`/team/${memberId}`);
  };

  // Responsive widths
  const contentMaxWidth = isDesktop ? 1200 : isTablet ? 900 : undefined;
  const kpiCardMaxWidth = isDesktop ? 280 : isTablet ? 220 : undefined;
  const memberCardMaxWidth = isDesktop ? 580 : isTablet ? 440 : undefined;

  const styles = getTeamStyles(colors);

  // ActionCard moved inside TeamScreen to access styles from closure
  const ActionCard = React.memo(
    ({
      title,
      description,
      icon,
      color,
      onPress,
      disabled,
    }: {
      title: string;
      description: string;
      icon: string;
      color: string;
      onPress?: () => void;
      disabled?: boolean;
    }) => {
      const cardColor = color;
      return (
        <TouchableOpacity
          style={[STATIC_STYLES.actionCard, disabled && STATIC_STYLES.actionCardDisabled]}
          onPress={onPress}
          disabled={disabled || !onPress}
        >
          <View style={[STATIC_STYLES.actionIconContainer, { backgroundColor: `${cardColor}15` }]}>
            <Ionicons
              name={icon as keyof typeof Ionicons.glyphMap}
              size={24}
              color={disabled ? colors.textMuted : cardColor}
            />
          </View>
          <View style={STATIC_STYLES.actionContent}>
            <ThemedText
              style={[STATIC_STYLES.actionTitle, disabled && STATIC_STYLES.actionTitleDisabled]}
            >
              {title}
            </ThemedText>
            <ThemedText style={STATIC_STYLES.actionDescription}>{description}</ThemedText>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={disabled ? colors.textMuted : colors.textSecondary}
          />
        </TouchableOpacity>
      );
    }
  );

  // Tab Button Component
  const TabButton = ({ tab, label, icon }: { tab: ViewTab; label: string; icon: string }) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons
        name={icon as keyof typeof Ionicons.glyphMap}
        size={18}
        color={activeTab === tab ? '#FFFFFF' : colors.textSecondary}
      />
      <ThemedText style={[styles.tabButtonText, activeTab === tab && styles.tabButtonTextActive]}>
        {label}
      </ThemedText>
    </TouchableOpacity>
  );

  // KPI Card Component
  const KPICard = ({
    label,
    value,
    subtext,
    icon,
    color,
  }: {
    label: string;
    value: string | number;
    subtext: string;
    icon: string;
    color: string;
  }) => (
    <View style={[styles.kpiCard, Platform.OS === 'web' && { maxWidth: kpiCardMaxWidth }]}>
      <View style={[styles.kpiIconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={color} />
      </View>
      <View style={styles.kpiContent}>
        <ThemedText style={styles.kpiLabel} numberOfLines={1}>
          {label}
        </ThemedText>
        <ThemedText style={[styles.kpiValue, { color }]} numberOfLines={1}>
          {value}
        </ThemedText>
        <ThemedText style={styles.kpiSubtext} numberOfLines={1}>
          {subtext}
        </ThemedText>
      </View>
    </View>
  );

  // Filter Chip Component
  const FilterChip = ({
    filterKey,
    label,
    count,
    color,
    type,
  }: {
    filterKey: string;
    label: string;
    count?: number;
    color: string;
    type: 'role' | 'status';
  }) => {
    const isActive = type === 'role' ? roleFilter === filterKey : statusFilter === filterKey;
    const onPress = () => {
      if (type === 'role') {
        setRoleFilter(filterKey as RoleFilter);
      } else {
        setStatusFilter(filterKey as StatusFilter);
      }
    };

    return (
      <TouchableOpacity
        style={[
          styles.filterChip,
          isActive && styles.filterChipActive,
          isActive && { backgroundColor: color },
        ]}
        onPress={onPress}
      >
        <ThemedText style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
          {label}
        </ThemedText>
        {count !== undefined && (
          <View style={[styles.filterChipBadge, isActive && styles.filterChipBadgeActive]}>
            <ThemedText
              style={[styles.filterChipBadgeText, isActive && styles.filterChipBadgeTextActive]}
            >
              {count}
            </ThemedText>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Member Card Component
  const MemberCard = ({ member }: { member: TeamMemberSummary }) => {
    const roleColor = getRoleColor(member.role);
    const statusColor = getStatusColor(member.status);

    return (
      <TouchableOpacity
        style={[
          styles.memberCard,
          Platform.OS === 'web' && { maxWidth: memberCardMaxWidth, cursor: 'pointer' },
        ]}
        onPress={() => handleViewMember(member.id)}
        activeOpacity={0.7}
      >
        <View style={styles.memberCardLeft}>
          <View style={[styles.memberAvatar, { backgroundColor: getAvatarColor(member.name) }]}>
            <Text style={styles.avatarText}>{getInitials(member.name)}</Text>
          </View>
          <View style={styles.memberInfo}>
            <ThemedText style={styles.memberName} numberOfLines={1}>
              {member.name}
            </ThemedText>
            <ThemedText style={styles.memberEmail} numberOfLines={1}>
              {member.email}
            </ThemedText>
          </View>
        </View>

        <View style={styles.memberCardRight}>
          <View style={[styles.roleBadge, { backgroundColor: `${roleColor}15` }]}>
            <Ionicons name={getRoleIcon(member.role) as keyof typeof Ionicons.glyphMap} size={12} color={roleColor} />
            <ThemedText style={[styles.roleBadgeText, { color: roleColor }]}>
              {formatRoleName(member.role)}
            </ThemedText>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <ThemedText style={[styles.statusText, { color: statusColor }]}>
              {formatStatusName(member.status)}
            </ThemedText>
          </View>

          {member.lastLoginAt && (
            <ThemedText style={styles.lastLogin}>{getRelativeTime(member.lastLoginAt)}</ThemedText>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // RoleItem moved inside TeamScreen to access styles from closure
  const RoleItem = React.memo(({ role, count }: { role: MerchantRole; count: number }) => {
    const getRoleColorFn = getRoleColor;
    const getRoleIconFn = getRoleIcon;
    const formatRoleNameFn = formatRoleName;
    const color = getRoleColorFn(role);
    const icon = getRoleIconFn(role);

    return (
      <View style={styles.roleItem}>
        <View style={styles.roleItemLeft}>
          <View style={[styles.roleIcon, { backgroundColor: `${color}15` }]}>
            <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={color} />
          </View>
          <ThemedText style={styles.roleItemLabel}>{formatRoleNameFn(role)}</ThemedText>
        </View>
        <ThemedText style={styles.roleItemCount}>{count}</ThemedText>
      </View>
    );
  });

  // PermissionItem moved inside TeamScreen to access styles from closure
  const PermissionItem = ({ label, allowed }: { label: string; allowed: boolean }) => (
    <View style={styles.permissionItem}>
      <Ionicons
        name={allowed ? 'checkmark-circle' : 'close-circle'}
        size={16}
        color={allowed ? colors.success : colors.error}
      />
      <ThemedText style={[styles.permissionLabel, !allowed && styles.permissionLabelDisabled]}>
        {label}
      </ThemedText>
    </View>
  );

  // Access Denied State
  if (!canViewTeam) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <View style={styles.errorIconContainer}>
          <Ionicons name="lock-closed" size={48} color={colors.error} />
        </View>
        <ThemedText style={styles.errorTitle}>Access Denied</ThemedText>
        <ThemedText style={styles.errorText}>
          You don't have permission to view team members.
        </ThemedText>
      </ThemedView>
    );
  }

  // Loading State
  if (isLoading && !teamData) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Loading team...</ThemedText>
        <ThemedText style={styles.loadingSubtext}>Fetching team members</ThemedText>
      </ThemedView>
    );
  }

  // Error State
  if (error && !teamData) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <View style={styles.errorIconContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
        </View>
        <ThemedText style={styles.errorTitle}>Failed to Load</ThemedText>
        <ThemedText style={styles.errorText}>
          {error instanceof Error ? error.message : 'Unable to load team data'}
        </ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Ionicons name="refresh" size={20} color={'#FFFFFF'} />
          <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

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
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      <ThemedView style={[styles.content, Platform.OS === 'web' && { maxWidth: contentMaxWidth }]}>
        {/* Sample Data Banner */}
        {isSampleData && (
          <View style={styles.sampleDataBanner}>
            <Ionicons name="information-circle" size={20} color={colors.info} />
            <View style={styles.sampleDataContent}>
              <ThemedText style={styles.sampleDataTitle}>No Team Members Yet</ThemedText>
              <ThemedText style={styles.sampleDataText}>
                {canInviteMembers
                  ? 'Start building your team by inviting your first member.'
                  : 'Contact an admin to invite team members.'}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Header with Invite Button */}
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.headerTitle}>Team Management</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              {stats.total} member{stats.total !== 1 ? 's' : ''} in your team
            </ThemedText>
          </View>
          {canInviteMembers && (
            <TouchableOpacity style={styles.inviteButton} onPress={handleInviteMember}>
              <Ionicons name="person-add" size={18} color={'#FFFFFF'} />
              <ThemedText style={styles.inviteButtonText}>Invite</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TabButton tab="overview" label="Overview" icon="grid-outline" />
          <TabButton tab="members" label="Members" icon="people-outline" />
          <TabButton tab="actions" label="Actions" icon="flash-outline" />
        </View>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* KPI Cards */}
            <View style={styles.kpiGrid}>
              <KPICard
                label="Total Members"
                value={stats.total}
                subtext="In your team"
                icon="people"
                color={colors.info}
              />
              <KPICard
                label="Active"
                value={stats.active}
                subtext={
                  stats.total > 0
                    ? `${Math.round((stats.active / stats.total) * 100)}% of team`
                    : 'Ready to work'
                }
                icon="checkmark-circle"
                color={colors.success}
              />
              <KPICard
                label="Pending"
                value={stats.pending}
                subtext="Awaiting acceptance"
                icon="time"
                color={colors.warning}
              />
              <KPICard
                label="Roles"
                value={Object.values(stats.roleBreakdown).filter((v) => v > 0).length}
                subtext="Different roles"
                icon="key"
                color={colors.primary}
              />
            </View>

            {/* Role Distribution */}
            {stats.total > 0 && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Team by Role</ThemedText>
                <View style={styles.roleBreakdown}>
                  {stats.roleBreakdown.owner > 0 && (
                    <RoleItem role="owner" count={stats.roleBreakdown.owner} />
                  )}
                  {stats.roleBreakdown.admin > 0 && (
                    <RoleItem role="admin" count={stats.roleBreakdown.admin} />
                  )}
                  {stats.roleBreakdown.manager > 0 && (
                    <RoleItem role="manager" count={stats.roleBreakdown.manager} />
                  )}
                  {stats.roleBreakdown.staff > 0 && (
                    <RoleItem role="staff" count={stats.roleBreakdown.staff} />
                  )}
                </View>
              </View>
            )}

            {/* Recent Members */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Recent Members</ThemedText>
                {teamMembers.length > 5 && (
                  <TouchableOpacity onPress={handleViewAllMembers}>
                    <ThemedText style={styles.viewAllLink}>View All</ThemedText>
                  </TouchableOpacity>
                )}
              </View>

              {recentMembers.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="people-outline" size={48} color={colors.textMuted} />
                  </View>
                  <ThemedText style={styles.emptyTitle}>No Team Members</ThemedText>
                  <ThemedText style={styles.emptyText}>
                    Your team is empty. Start by inviting your first member.
                  </ThemedText>
                  {canInviteMembers && (
                    <TouchableOpacity style={styles.emptyButton} onPress={handleInviteMember}>
                      <ThemedText style={styles.emptyButtonText}>Invite First Member</ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.membersList}>
                  {recentMembers.map((member) => (
                    <MemberCard key={member.id} member={member} />
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or email..."
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Role Filters */}
            <View style={styles.filterSection}>
              <ThemedText style={styles.filterLabel}>Role</ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterChipsRow}
              >
                <FilterChip
                  filterKey="all"
                  label="All"
                  count={stats.total}
                  color={colors.primary}
                  type="role"
                />
                <FilterChip
                  filterKey="owner"
                  label="Owner"
                  count={stats.roleBreakdown.owner}
                  color={getRoleColor('owner')}
                  type="role"
                />
                <FilterChip
                  filterKey="admin"
                  label="Admin"
                  count={stats.roleBreakdown.admin}
                  color={getRoleColor('admin')}
                  type="role"
                />
                <FilterChip
                  filterKey="manager"
                  label="Manager"
                  count={stats.roleBreakdown.manager}
                  color={getRoleColor('manager')}
                  type="role"
                />
                <FilterChip
                  filterKey="staff"
                  label="Staff"
                  count={stats.roleBreakdown.staff}
                  color={getRoleColor('staff')}
                  type="role"
                />
              </ScrollView>
            </View>

            {/* Status Filters */}
            <View style={styles.filterSection}>
              <ThemedText style={styles.filterLabel}>Status</ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterChipsRow}
              >
                <FilterChip
                  filterKey="all"
                  label="All"
                  count={stats.total}
                  color={colors.primary}
                  type="status"
                />
                <FilterChip
                  filterKey="active"
                  label="Active"
                  count={stats.active}
                  color={colors.success}
                  type="status"
                />
                <FilterChip
                  filterKey="inactive"
                  label="Pending"
                  count={stats.pending}
                  color={colors.warning}
                  type="status"
                />
                <FilterChip
                  filterKey="suspended"
                  label="Suspended"
                  count={stats.suspended}
                  color={colors.error}
                  type="status"
                />
              </ScrollView>
            </View>

            {/* Members List */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Team Members</ThemedText>
                <ThemedText style={styles.sectionCount}>
                  {filteredMembers.length} members
                </ThemedText>
              </View>

              {filteredMembers.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="search" size={48} color={colors.textMuted} />
                  </View>
                  <ThemedText style={styles.emptyTitle}>No Results</ThemedText>
                  <ThemedText style={styles.emptyText}>
                    {search
                      ? `No members match "${search}"`
                      : 'No members match the selected filters'}
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() => {
                      setSearch('');
                      setRoleFilter('all');
                      setStatusFilter('all');
                    }}
                  >
                    <ThemedText style={styles.emptyButtonText}>Clear Filters</ThemedText>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.membersGrid}>
                  {filteredMembers.map((member) => (
                    <MemberCard key={member.id} member={member} />
                  ))}
                </View>
              )}

              {/* M4 FIX: Load more button when more pages exist */}
              {accumulatedMembers.length < serverTotal && (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={loadMoreTeamMembers}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <ThemedText style={styles.loadMoreText}>
                      Load More ({serverTotal - accumulatedMembers.length} remaining)
                    </ThemedText>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* Actions Tab */}
        {activeTab === 'actions' && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Team Actions</ThemedText>
            <View style={styles.actionsGrid}>
              <ActionCard
                title="Invite Member"
                description="Send an invitation to add a new team member"
                icon="person-add"
                color={colors.primary}
                onPress={canInviteMembers ? handleInviteMember : undefined}
                disabled={!canInviteMembers}
              />
              <ActionCard
                title="View All Members"
                description="See the full list of team members"
                icon="people"
                color={colors.info}
                onPress={() => setActiveTab('members')}
              />
              <ActionCard
                title="Manage Roles"
                description="Update team member roles and permissions"
                icon="key"
                color={colors.warning}
                onPress={canChangeRoles ? () => router.push('/team/roles') : undefined}
                disabled={!canChangeRoles}
              />
              <ActionCard
                title="Activity Log"
                description="View recent team activity and changes"
                icon="time"
                color={colors.textSecondary}
                onPress={() => router.push('/team/activity')}
              />
            </View>

            {/* Permissions Summary */}
            <View style={styles.permissionsSummary}>
              <ThemedText style={styles.permissionsTitle}>
                <Ionicons name="shield-checkmark" size={16} color={colors.primary} /> Your
                Permissions
              </ThemedText>
              <View style={styles.permissionsList}>
                <PermissionItem label="View Team" allowed={canViewTeam} />
                <PermissionItem label="Invite Members" allowed={canInviteMembers} />
                <PermissionItem label="Remove Members" allowed={canRemoveMembers} />
                <PermissionItem label="Change Roles" allowed={canChangeRoles} />
                <PermissionItem label="Change Status" allowed={canChangeStatus} />
              </View>
              <ThemedText style={styles.currentRoleText}>
                Your role:{' '}
                <ThemedText style={styles.currentRoleBadge}>
                  {formatRoleName(currentRole)}
                </ThemedText>
              </ThemedText>
            </View>
          </View>
        )}
      </ThemedView>
    </ScrollView>
  );
}

// Static styles — theme-independent (no color references)
const STATIC_STYLES = StyleSheet.create({
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    gap: 14,
  },
  actionCardDisabled: {
    opacity: 0.6,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0B2240',
    marginBottom: 4,
  },
  actionTitleDisabled: {
    color: '#94A3B8',
  },
  actionDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
});

type TeamColors = typeof Colors.light | typeof Colors.dark;

function getTeamStyles(colors: TeamColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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

    // Sample Data Banner
    sampleDataBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: `${colors.info}10`,
      borderRadius: 12,
      padding: 14,
      gap: 12,
      borderWidth: 1,
      borderColor: `${colors.info}30`,
    },
    sampleDataContent: {
      flex: 1,
    },
    sampleDataTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.info,
      marginBottom: 2,
    },
    sampleDataText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
    },

    // Header
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#0B2240',
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    inviteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
    },
    inviteButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },

    // Tabs
    tabsContainer: {
      flexDirection: 'row',
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 4,
      gap: 4,
    },
    tabButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 10,
    },
    tabButtonActive: {
      backgroundColor: colors.primary,
    },
    tabButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    tabButtonTextActive: {
      color: '#FFFFFF',
    },

    // KPI Grid
    kpiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    kpiCard: {
      flex: 1,
      minWidth: 150,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: '#FFFFFF',
      padding: 12,
      borderRadius: 12,
    },
    kpiIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    kpiContent: {
      flex: 1,
      minWidth: 0,
    },
    kpiLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    kpiValue: {
      fontSize: 18,
      fontWeight: '700',
      color: '#0B2240',
    },
    kpiSubtext: {
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 2,
    },

    // Section
    section: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      gap: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#0B2240',
    },
    sectionCount: {
      fontSize: 13,
      color: colors.textSecondary,
      backgroundColor: colors.background,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    viewAllLink: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },

    // Role Breakdown
    roleBreakdown: {
      gap: 12,
    },
    roleItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    roleItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    roleIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    roleItemLabel: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.text,
    },
    roleItemCount: {
      fontSize: 16,
      fontWeight: '700',
      color: '#0B2240',
    },

    // Search
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      padding: 0,
    },

    // Filters
    filterSection: {
      gap: 8,
    },
    filterLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginLeft: 4,
    },
    filterChipsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 14,
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterChipActive: {
      borderColor: 'transparent',
    },
    filterChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    filterChipTextActive: {
      color: '#FFFFFF',
    },
    filterChipBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: colors.background,
    },
    filterChipBadgeActive: {
      backgroundColor: 'rgba(255,255,255,0.25)',
    },
    filterChipBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    filterChipBadgeTextActive: {
      color: '#FFFFFF',
    },

    // Members List/Grid
    membersList: {
      gap: 12,
    },
    membersGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },

    // Member Card
    memberCard: {
      flex: 1,
      minWidth: 280,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 14,
      gap: 12,
    },
    memberCardLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
      minWidth: 0,
    },
    memberAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    avatarText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },
    memberInfo: {
      flex: 1,
      minWidth: 0,
    },
    memberName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    memberEmail: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    memberCardRight: {
      alignItems: 'flex-end',
      gap: 4,
    },
    roleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    roleBadgeText: {
      fontSize: 11,
      fontWeight: '600',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '600',
    },
    lastLogin: {
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 2,
    },

    // Actions Grid
    actionsGrid: {
      gap: 12,
    },

    // Permissions Summary
    permissionsSummary: {
      backgroundColor: `${colors.primary}08`,
      padding: 16,
      borderRadius: 12,
      marginTop: 8,
    },
    permissionsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    permissionsList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    permissionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    permissionLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.text,
    },
    permissionLabelDisabled: {
      color: colors.textMuted,
    },
    currentRoleText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 12,
    },
    currentRoleBadge: {
      fontWeight: '700',
      color: colors.primary,
    },

    // Empty State
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      minWidth: '100%',
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      maxWidth: 280,
    },
    emptyButton: {
      marginTop: 16,
      paddingVertical: 10,
      paddingHorizontal: 20,
      backgroundColor: colors.primary,
      borderRadius: 8,
    },
    emptyButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },

    // Loading & Error States
    loadingText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginTop: 12,
    },
    loadingSubtext: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 4,
    },
    errorIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: `${colors.error}10`,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    errorText: {
      fontSize: 14,
      color: colors.textMuted,
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
      backgroundColor: colors.primary,
      borderRadius: 12,
    },
    retryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    loadMoreButton: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      marginTop: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    loadMoreText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
  });
}
