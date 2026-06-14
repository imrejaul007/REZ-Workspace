/**
 * Audit Log List Screen - Premium Redesign
 * Displays paginated list of audit logs with filtering, search, and stats
 * Uses premium components matching dashboard design
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
  TextInput,
  Dimensions,
  ScrollView,
} from 'react-native';
import { showAlert, showConfirm } from '@/utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { Colors, Spacing, Shadows, BorderRadius, Typography } from '@/constants/DesignTokens';
import { Heading2, Heading3, BodyText, Caption } from '@/components/ui/DesignSystemComponents';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/utils/permissions';
import type { MerchantRole } from '@/types/team';
import {
  useInfiniteAuditLogs,
  useAuditStatistics,
  useExportAuditLogs,
  useFormatAuditLog,
} from '@/hooks/queries/useAudit';
import { AuditLog, AuditLogFilters, AuditSeverity } from '@/types/audit';
import { AuditLogCard } from '@/components/audit/AuditLogCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type QuickFilter = 'all' | 'today' | 'week' | 'critical';

export default function AuditLogListScreen() {
  const { user } = useAuth();
  const formatLog = useFormatAuditLog();
  const searchParams = useLocalSearchParams<{ severity?: string }>();

  // Permission check
  const canView = user?.role ? hasPermission(user.role as MerchantRole, 'logs:view') : false;
  const canExport = user?.role ? hasPermission(user.role as MerchantRole, 'logs:export') : false;

  // State
  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');

  // Handle query params (e.g., from statistics page linking with ?severity=critical)
  useEffect(() => {
    if (searchParams.severity === 'critical') {
      setQuickFilter('critical');
    }
  }, [searchParams.severity]);
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    limit: 20,
    sortBy: 'timestamp',
    sortOrder: 'desc',
  });

  // Build filters based on quick filter selection
  const activeFilters = useMemo(() => {
    const base: AuditLogFilters = { ...filters };

    if (search.trim()) {
      base.search = search.trim();
    }

    switch (quickFilter) {
      case 'today':
        base.dateRange = 'today';
        break;
      case 'week':
        base.dateRange = 'last_7_days';
        break;
      case 'critical':
        base.severity = ['critical', 'error'];
        break;
    }

    return base;
  }, [filters, search, quickFilter]);

  // Queries
  const {
    data: logsData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteAuditLogs(activeFilters, {
    enabled: canView,
  });

  const { data: statsData, isLoading: statsLoading } = useAuditStatistics(undefined, undefined, {
    enabled: canView,
  });

  const { refetch: exportLogs, isFetching: isExporting } = useExportAuditLogs(
    { format: 'csv', ...activeFilters },
    { enabled: false }
  );

  // Flatten paginated data
  const allLogs = useMemo(() => {
    if (!(logsData as unknown as { pages?: unknown[] })?.pages) return [];
    return (logsData as unknown as { pages?: Array<{ logs?: AuditLog[] }> }).pages?.flatMap((page) => page.logs || []) as AuditLog[] || [];
  }, [logsData]);

  // Stats calculation
  const stats = useMemo(() => {
    if (!statsData) return null;

    const totalToday =
      statsData.activityTrend?.find(
        (t) => new Date(t.date).toDateString() === new Date().toDateString()
      )?.count || 0;

    const criticalCount =
      (statsData.logsBySeverity?.critical || 0) + (statsData.logsBySeverity?.error || 0);
    const uniqueUsers = statsData.logsByUser?.length || 0;
    const mostActiveResource = statsData.topChangedResources?.[0];

    return {
      totalToday,
      criticalCount,
      uniqueUsers,
      mostActiveResource: mostActiveResource?.resourceType || 'N/A',
    };
  }, [statsData]);

  // Handlers
  const handleSearch = useCallback((text: string) => {
    setSearch(text);
  }, []);

  const handleQuickFilter = useCallback((filter: QuickFilter) => {
    setQuickFilter(filter);
  }, []);

  const handleFilterPress = useCallback(() => {
    router.push('/audit/filters');
  }, []);

  const handleLogPress = useCallback((log: AuditLog) => {
    router.push(`/audit/${log.id}`);
  }, []);

  const handleExport = useCallback(async () => {
    if (!canExport) {
      showAlert('Permission Denied', 'You do not have permission to export audit logs.');
      return;
    }

    showConfirm(
      'Export Audit Logs',
      'This will export all filtered audit logs to a CSV file. Continue?',
      async () => {
        try {
          const result = await exportLogs();
          if (result.data?.downloadUrl) {
            showAlert('Success', 'Audit logs exported successfully.');
          }
        } catch (err) {
          showAlert('Export Failed', err.message || 'Failed to export audit logs');
        }
      }
    );
  }, [canExport, exportLogs]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleNavigate = useCallback((route: string) => {
    router.push(route);
  }, []);

  // Render header with stats
  const renderHeader = useCallback(
    () => (
      <View style={styles.headerContainer}>
        {/* Glassmorphic Header */}
        <Animated.View entering={FadeInDown.springify()} style={styles.glassHeader}>
          <LinearGradient
            colors={['rgba(124, 58, 237, 0.95)', 'rgba(99, 102, 241, 0.9)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.glassHeaderGradient}
          >
            <View style={styles.glassHeaderOverlay}>
              <View style={styles.headerMainContent}>
                <View style={styles.headerTitleSection}>
                  <Ionicons name="shield-checkmark" size={28} color="#fff" />
                  <View>
                    <Heading3 style={styles.headerTitle}>Audit Logs</Heading3>
                    <Caption style={styles.headerSubtitle}>Track all system activities</Caption>
                  </View>
                </View>

                <View style={styles.headerActions}>
                  {canExport && (
                    <TouchableOpacity
                      style={styles.headerButton}
                      onPress={handleExport}
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Ionicons name="download-outline" size={22} color="#fff" />
                      )}
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.headerButton} onPress={handleFilterPress}>
                    <Ionicons name="options-outline" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Stats Cards */}
        {!statsLoading && stats && (
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statsScroll}
            >
              <Animated.View entering={FadeInRight.delay(150).springify()}>
                <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.statCard}>
                  <View style={styles.statCardIcon}>
                    <Ionicons name="today" size={18} color="#fff" />
                  </View>
                  <Caption style={styles.statCardLabel}>Today</Caption>
                  <Heading2 style={styles.statCardValue}>{stats.totalToday}</Heading2>
                </LinearGradient>
              </Animated.View>

              <Animated.View entering={FadeInRight.delay(200).springify()}>
                <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.statCard}>
                  <View style={styles.statCardIcon}>
                    <Ionicons name="alert-circle" size={18} color="#fff" />
                  </View>
                  <Caption style={styles.statCardLabel}>Critical</Caption>
                  <Heading2 style={styles.statCardValue}>{stats.criticalCount}</Heading2>
                </LinearGradient>
              </Animated.View>

              <Animated.View entering={FadeInRight.delay(250).springify()}>
                <LinearGradient colors={['#10B981', '#059669']} style={styles.statCard}>
                  <View style={styles.statCardIcon}>
                    <Ionicons name="people" size={18} color="#fff" />
                  </View>
                  <Caption style={styles.statCardLabel}>Users</Caption>
                  <Heading2 style={styles.statCardValue}>{stats.uniqueUsers}</Heading2>
                </LinearGradient>
              </Animated.View>

              <Animated.View entering={FadeInRight.delay(300).springify()}>
                <View style={styles.statCardLight}>
                  <View style={[styles.statCardIconLight, { backgroundColor: '#F3E8FF' }]}>
                    <Ionicons name="cube" size={18} color="#9333EA" />
                  </View>
                  <Caption style={styles.statCardLabelDark}>Most Active</Caption>
                  <BodyText style={styles.statCardValueDark} numberOfLines={1}>
                    {stats.mostActiveResource}
                  </BodyText>
                </View>
              </Animated.View>
            </ScrollView>
          </Animated.View>
        )}

        {/* Quick Navigation */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.quickNavSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickNavScroll}
          >
            <TouchableOpacity
              style={styles.quickNavButton}
              onPress={() => handleNavigate('/audit/statistics')}
            >
              <LinearGradient colors={['#00C06A', '#00A85A']} style={styles.quickNavIconBg}>
                <Ionicons name="bar-chart" size={18} color="#fff" />
              </LinearGradient>
              <BodyText style={styles.quickNavText}>Statistics</BodyText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickNavButton}
              onPress={() => handleNavigate('/audit/timeline')}
            >
              <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.quickNavIconBg}>
                <Ionicons name="time" size={18} color="#fff" />
              </LinearGradient>
              <BodyText style={styles.quickNavText}>Timeline</BodyText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickNavButton}
              onPress={() => handleNavigate('/audit/compliance')}
            >
              <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.quickNavIconBg}>
                <Ionicons name="checkmark-done" size={18} color="#fff" />
              </LinearGradient>
              <BodyText style={styles.quickNavText}>Compliance</BodyText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickNavButton}
              onPress={() => handleNavigate('/audit/archives')}
            >
              <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.quickNavIconBg}>
                <Ionicons name="archive" size={18} color="#fff" />
              </LinearGradient>
              <BodyText style={styles.quickNavText}>Archives</BodyText>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by user, action, resource..."
              value={search}
              onChangeText={handleSearch}
              placeholderTextColor="#9CA3AF"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Quick Filter Chips */}
        <Animated.View
          entering={FadeInDown.delay(350).springify()}
          style={styles.filterChipsSection}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsScroll}
          >
            {(['all', 'today', 'week', 'critical'] as QuickFilter[]).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, quickFilter === filter && styles.filterChipActive]}
                onPress={() => handleQuickFilter(filter)}
              >
                <BodyText
                  style={[
                    styles.filterChipText,
                    quickFilter === filter && styles.filterChipTextActive,
                  ]}
                >
                  {filter === 'all'
                    ? 'All Logs'
                    : filter === 'today'
                      ? 'Today'
                      : filter === 'week'
                        ? 'This Week'
                        : 'Critical'}
                </BodyText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    ),
    [
      statsLoading,
      stats,
      canExport,
      handleExport,
      isExporting,
      handleFilterPress,
      handleNavigate,
      search,
      handleSearch,
      quickFilter,
      handleQuickFilter,
    ]
  );

  const renderLogItem = useCallback(
    ({ item, index }: { item: AuditLog; index: number }) => (
      <Animated.View
        entering={FadeInDown.delay(index * 50).springify()}
        style={styles.logItemWrapper}
      >
        <AuditLogCard log={item} onPress={() => handleLogPress(item)} compact={false} />
      </Animated.View>
    ),
    [handleLogPress]
  );

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
        </View>
        <Heading3 style={styles.emptyTitle}>No Audit Logs Found</Heading3>
        <BodyText style={styles.emptyText}>
          {search ? 'Try adjusting your search or filters' : 'No activity has been logged yet'}
        </BodyText>
      </View>
    ),
    [search]
  );

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.primary[500]} />
      </View>
    );
  }, [isFetchingNextPage]);

  // Permission denied screen
  if (!canView) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionDenied}>
          <View style={styles.permissionIconContainer}>
            <Ionicons name="lock-closed" size={48} color="#9CA3AF" />
          </View>
          <Heading3 style={styles.permissionTitle}>Access Restricted</Heading3>
          <BodyText style={styles.permissionText}>
            You don't have permission to view audit logs
          </BodyText>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (isError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
          </View>
          <Heading3 style={styles.errorTitle}>Failed to Load</Heading3>
          <BodyText style={styles.errorText}>
            {error?.message || 'An unexpected error occurred'}
          </BodyText>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <BodyText style={styles.retryButtonText}>Try Again</BodyText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary[100], Colors.primary[50], '#F8F9FE']}
        style={styles.backgroundGradient}
      />
      <FlatList
        data={allLogs}
        renderItem={renderLogItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary[500]} />
              <BodyText style={styles.loadingText}>Loading audit logs...</BodyText>
            </View>
          ) : (
            renderEmpty()
          )
        }
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading && !isFetchingNextPage}
            onRefresh={refetch}
            tintColor={Colors.primary[500]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 300,
  },
  listContent: {
    paddingBottom: 100,
  },
  headerContainer: {
    marginBottom: Spacing.md,
  },

  // Glassmorphic Header
  glassHeader: {
    margin: Spacing.base,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    ...Shadows.lg,
  },
  glassHeaderGradient: {
    padding: 0,
  },
  glassHeaderOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: Spacing.lg,
  },
  headerMainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerTitle: {
    color: Colors.text.inverse,
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  // Stats Cards
  statsScroll: {
    paddingHorizontal: Spacing.base,
    gap: 12,
  },
  statCard: {
    width: 130,
    borderRadius: 16,
    padding: 14,
    minHeight: 100,
    justifyContent: 'space-between',
    ...Shadows.md,
  },
  statCardLight: {
    width: 130,
    borderRadius: 16,
    padding: 14,
    minHeight: 100,
    justifyContent: 'space-between',
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.default,
    ...Shadows.sm,
  },
  statCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statCardIconLight: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statCardLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  statCardLabelDark: {
    color: Colors.text.secondary,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  statCardValue: {
    color: Colors.text.inverse,
    fontSize: 24,
    fontWeight: '800',
  },
  statCardValueDark: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },

  // Quick Navigation
  quickNavSection: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  quickNavScroll: {
    paddingHorizontal: Spacing.base,
    gap: 12,
  },
  quickNavButton: {
    alignItems: 'center',
    gap: 8,
  },
  quickNavIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  quickNavText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  // Search
  searchSection: {
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border.default,
    ...Shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text.primary,
  },

  // Filter Chips
  filterChipsSection: {
    marginTop: Spacing.md,
  },
  filterChipsScroll: {
    paddingHorizontal: Spacing.base,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.background.primary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border.default,
    ...Shadows.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  filterChipTextActive: {
    color: Colors.text.inverse,
  },

  // Log Items
  logItemWrapper: {
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.sm,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: Spacing.xl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  // Error State
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.error[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.error[500],
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary[500],
    borderRadius: 12,
  },
  retryButtonText: {
    color: Colors.text.inverse,
    fontWeight: '600',
    fontSize: 15,
  },

  // Permission Denied
  permissionDenied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  permissionIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});
