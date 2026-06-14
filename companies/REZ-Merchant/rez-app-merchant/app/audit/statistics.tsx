/**
 * Audit Statistics Dashboard Screen
 * Premium-designed statistics dashboard for audit logs
 * Permissions required: logs:view
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { Colors, Spacing, Shadows, BorderRadius } from '@/constants/DesignTokens';
import {
  Card,
  Heading2,
  Heading3,
  BodyText,
  Caption,
} from '@/components/ui/DesignSystemComponents';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/utils/permissions';
import type { MerchantRole } from '@/types/team';
import {
  useAuditStatistics,
  useActivityHeatmap,
  useActivitySummary,
  useCriticalActivities,
} from '@/hooks/queries/useAudit';
import { AuditSeverity } from '@/types/audit';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AuditStatisticsScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Permission check
  const canView = user?.role ? hasPermission(user.role as MerchantRole, 'logs:view') : false;

  // Queries
  const {
    data: statisticsData,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useAuditStatistics(undefined, undefined, {
    enabled: canView,
  });

  const {
    data: heatmapData,
    isLoading: heatmapLoading,
    refetch: refetchHeatmap,
  } = useActivityHeatmap(undefined, undefined, {
    enabled: canView,
  });

  const {
    data: summaryData,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useActivitySummary(undefined, undefined, {
    enabled: canView,
  });

  const {
    data: criticalData,
    isLoading: criticalLoading,
    refetch: refetchCritical,
  } = useCriticalActivities(10, {
    enabled: canView,
  });

  const isLoading = statsLoading || heatmapLoading || summaryLoading || criticalLoading;

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchHeatmap(), refetchSummary(), refetchCritical()]);
    setRefreshing(false);
  }, [refetchStats, refetchHeatmap, refetchSummary, refetchCritical]);

  // Computed statistics
  const stats = useMemo(() => {
    if (!statisticsData) return null;

    const severityData = statisticsData.logsBySeverity || {};
    const total = statisticsData.totalLogs || 0;

    return {
      total,
      info: severityData.info || 0,
      warning: severityData.warning || 0,
      error: severityData.error || 0,
      critical: severityData.critical || 0,
      topUsers: statisticsData.logsByUser?.slice(0, 5) || [],
      topResources: statisticsData.topChangedResources?.slice(0, 5) || [],
      activityTrend: statisticsData.activityTrend || [],
    };
  }, [statisticsData]);

  // Get severity color
  const getSeverityColor = (severity: AuditSeverity): string => {
    const colors: Record<AuditSeverity, string> = {
      info: '#3b82f6',
      warning: '#f59e0b',
      error: '#ef4444',
      critical: '#991b1b',
    };
    return colors[severity] || '#3b82f6';
  };

  // Get severity percentage
  const getSeverityPercentage = (count: number): number => {
    if (!stats || stats.total === 0) return 0;
    return Math.round((count / stats.total) * 100);
  };

  // Permission denied screen
  if (!canView) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionDenied}>
          <Ionicons name="lock-closed-outline" size={64} color="#ccc" />
          <BodyText style={styles.permissionDeniedText}>
            You don't have permission to view audit statistics
          </BodyText>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (statsError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Heading3 style={styles.errorText}>Failed to load statistics</Heading3>
          <BodyText style={styles.errorSubtext}>Please try again later</BodyText>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <BodyText style={styles.retryButtonText}>Retry</BodyText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <LinearGradient
        colors={[Colors.primary[100], Colors.primary[50], Colors.gray[50]]}
        style={styles.backgroundGradient}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary[500]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Glassmorphic Header */}
        <Animated.View entering={FadeInDown.springify()} style={styles.glassHeader}>
          <LinearGradient
            colors={['rgba(124, 58, 237, 0.95)', 'rgba(99, 102, 241, 0.9)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.glassHeaderGradient}
          >
            <View style={styles.glassHeaderOverlay}>
              <View style={styles.headerContent}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                  <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                  <Heading2 style={styles.headerTitle}>Audit Statistics</Heading2>
                  <Caption style={styles.headerSubtitle}>Activity insights and analytics</Caption>
                </View>
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={() => router.push('/audit/filters')}
                >
                  <Ionicons name="options-outline" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
            <BodyText style={styles.loadingText}>Loading statistics...</BodyText>
          </View>
        ) : (
          <>
            {/* Overview Stats Cards */}
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconBg}>
                  <Ionicons name="stats-chart" size={18} color="#fff" />
                </View>
                <Heading3 style={styles.sectionTitle}>Overview</Heading3>
              </View>

              <View style={styles.statsGrid}>
                {/* Total Logs */}
                <Animated.View
                  entering={FadeInRight.delay(150).springify()}
                  style={styles.statsCardWrapper}
                >
                  <LinearGradient
                    colors={['#6366F1', '#4F46E5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.statsCardGradient}
                  >
                    <View style={styles.statsCardIcon}>
                      <Ionicons name="document-text" size={24} color="#fff" />
                    </View>
                    <Caption style={styles.statsCardLabel}>Total Logs</Caption>
                    <Heading2 style={styles.statsCardValue}>
                      {(stats?.total || 0).toLocaleString()}
                    </Heading2>
                  </LinearGradient>
                </Animated.View>

                {/* Info Logs */}
                <Animated.View
                  entering={FadeInRight.delay(200).springify()}
                  style={styles.statsCardWrapper}
                >
                  <View style={styles.statsCardLight}>
                    <View style={[styles.statsCardIconLight, { backgroundColor: '#DBEAFE' }]}>
                      <Ionicons name="information-circle" size={24} color="#3b82f6" />
                    </View>
                    <Caption style={styles.statsCardLabelDark}>Info Events</Caption>
                    <Heading2 style={styles.statsCardValueDark}>
                      {(stats?.info || 0).toLocaleString()}
                    </Heading2>
                  </View>
                </Animated.View>

                {/* Warning Logs */}
                <Animated.View
                  entering={FadeInRight.delay(250).springify()}
                  style={styles.statsCardWrapper}
                >
                  <View style={styles.statsCardLight}>
                    <View style={[styles.statsCardIconLight, { backgroundColor: '#FEF3C7' }]}>
                      <Ionicons name="warning" size={24} color="#f59e0b" />
                    </View>
                    <Caption style={styles.statsCardLabelDark}>Warnings</Caption>
                    <Heading2 style={styles.statsCardValueDark}>
                      {(stats?.warning || 0).toLocaleString()}
                    </Heading2>
                  </View>
                </Animated.View>

                {/* Critical Logs */}
                <Animated.View
                  entering={FadeInRight.delay(300).springify()}
                  style={styles.statsCardWrapper}
                >
                  <LinearGradient
                    colors={['#EF4444', '#DC2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.statsCardGradient}
                  >
                    <View style={styles.statsCardIcon}>
                      <Ionicons name="alert-circle" size={24} color="#fff" />
                    </View>
                    <Caption style={styles.statsCardLabel}>Critical</Caption>
                    <Heading2 style={styles.statsCardValue}>
                      {(stats?.critical || 0).toLocaleString()}
                    </Heading2>
                  </LinearGradient>
                </Animated.View>
              </View>
            </Animated.View>

            {/* Severity Distribution */}
            <Animated.View entering={FadeInDown.delay(350).springify()}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBg, { backgroundColor: '#F59E0B' }]}>
                  <Ionicons name="pie-chart" size={18} color="#fff" />
                </View>
                <Heading3 style={styles.sectionTitle}>Severity Distribution</Heading3>
              </View>

              <Card variant="elevated" style={styles.distributionCard}>
                {(['info', 'warning', 'error', 'critical'] as AuditSeverity[]).map(
                  (severity, index) => {
                    const count = stats?.[severity] || 0;
                    const percentage = getSeverityPercentage(count);
                    const color = getSeverityColor(severity);

                    return (
                      <View key={severity} style={styles.distributionRow}>
                        <View style={styles.distributionLabel}>
                          <View style={[styles.distributionDot, { backgroundColor: color }]} />
                          <BodyText style={styles.distributionText}>
                            {severity.charAt(0).toUpperCase() + severity.slice(1)}
                          </BodyText>
                        </View>
                        <View style={styles.distributionBarContainer}>
                          <View style={styles.distributionBarBg}>
                            <View
                              style={[
                                styles.distributionBarFill,
                                { width: `${percentage}%`, backgroundColor: color },
                              ]}
                            />
                          </View>
                          <BodyText style={styles.distributionPercentage}>{percentage}%</BodyText>
                        </View>
                        <BodyText style={styles.distributionCount}>
                          {count.toLocaleString()}
                        </BodyText>
                      </View>
                    );
                  }
                )}
              </Card>
            </Animated.View>

            {/* Activity Trend */}
            {stats?.activityTrend && stats.activityTrend.length > 0 && (
              <Animated.View entering={FadeInDown.delay(400).springify()}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconBg, { backgroundColor: '#10B981' }]}>
                    <Ionicons name="trending-up" size={18} color="#fff" />
                  </View>
                  <Heading3 style={styles.sectionTitle}>Activity Trend</Heading3>
                </View>

                <Card variant="elevated" style={styles.trendCard}>
                  <View style={styles.trendChartContainer}>
                    {stats.activityTrend.slice(-7).map((item, index) => {
                      const maxCount = Math.max(...stats.activityTrend.map((t) => t.count));
                      const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                      const date = new Date(item.date);
                      const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });

                      return (
                        <View key={index} style={styles.trendBarWrapper}>
                          <View style={styles.trendBarContainer}>
                            <LinearGradient
                              colors={['#6366F1', '#4F46E5']}
                              style={[styles.trendBar, { height: `${Math.max(height, 5)}%` }]}
                            />
                          </View>
                          <Caption style={styles.trendLabel}>{dayLabel}</Caption>
                          <Caption style={styles.trendCount}>{item.count}</Caption>
                        </View>
                      );
                    })}
                  </View>
                </Card>
              </Animated.View>
            )}

            {/* Top Users by Activity */}
            {stats?.topUsers && stats.topUsers.length > 0 && (
              <Animated.View entering={FadeInDown.delay(450).springify()}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconBg, { backgroundColor: '#EC4899' }]}>
                    <Ionicons name="people" size={18} color="#fff" />
                  </View>
                  <Heading3 style={styles.sectionTitle}>Top Users by Activity</Heading3>
                </View>

                <Card variant="elevated" style={styles.listCard}>
                  {stats.topUsers.map((user, index) => {
                    const maxCount = stats.topUsers[0]?.count || 1;
                    const percentage = Math.round((user.count / maxCount) * 100);

                    return (
                      <View
                        key={user.userId}
                        style={[
                          styles.listItem,
                          index === stats.topUsers.length - 1 && styles.listItemLast,
                        ]}
                      >
                        <View style={styles.listItemRank}>
                          <BodyText style={styles.rankNumber}>#{index + 1}</BodyText>
                        </View>
                        <View style={styles.listItemContent}>
                          <BodyText style={styles.listItemName} numberOfLines={1}>
                            {user.userName || user.email || 'Unknown User'}
                          </BodyText>
                          <View style={styles.listItemBarBg}>
                            <LinearGradient
                              colors={['#EC4899', '#DB2777']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={[styles.listItemBarFill, { width: `${percentage}%` }]}
                            />
                          </View>
                        </View>
                        <View style={styles.listItemCountBadge}>
                          <BodyText style={styles.listItemCount}>
                            {user.count.toLocaleString()}
                          </BodyText>
                        </View>
                      </View>
                    );
                  })}
                </Card>
              </Animated.View>
            )}

            {/* Most Changed Resources */}
            {stats?.topResources && stats.topResources.length > 0 && (
              <Animated.View entering={FadeInDown.delay(500).springify()}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconBg, { backgroundColor: '#8B5CF6' }]}>
                    <Ionicons name="cube" size={18} color="#fff" />
                  </View>
                  <Heading3 style={styles.sectionTitle}>Most Changed Resources</Heading3>
                </View>

                <Card variant="elevated" style={styles.listCard}>
                  {stats.topResources.map((resource, index) => {
                    const maxCount = stats.topResources[0]?.changeCount || 1;
                    const percentage = Math.round((resource.changeCount / maxCount) * 100);

                    return (
                      <View
                        key={`${resource.resourceType}-${resource.resourceId}`}
                        style={[
                          styles.listItem,
                          index === stats.topResources.length - 1 && styles.listItemLast,
                        ]}
                      >
                        <View style={[styles.resourceTypeIcon, { backgroundColor: '#F3E8FF' }]}>
                          <Ionicons
                            name={getResourceIcon(resource.resourceType)}
                            size={18}
                            color="#8B5CF6"
                          />
                        </View>
                        <View style={styles.listItemContent}>
                          <BodyText style={styles.listItemName} numberOfLines={1}>
                            {resource.name || resource.resourceType}
                          </BodyText>
                          <Caption style={styles.resourceType}>{resource.resourceType}</Caption>
                          <View style={styles.listItemBarBg}>
                            <LinearGradient
                              colors={['#8B5CF6', '#7C3AED']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={[styles.listItemBarFill, { width: `${percentage}%` }]}
                            />
                          </View>
                        </View>
                        <View style={[styles.listItemCountBadge, { backgroundColor: '#F3E8FF' }]}>
                          <BodyText style={[styles.listItemCount, { color: '#8B5CF6' }]}>
                            {resource.changeCount.toLocaleString()}
                          </BodyText>
                        </View>
                      </View>
                    );
                  })}
                </Card>
              </Animated.View>
            )}

            {/* Critical Activities */}
            {criticalData && criticalData.activities && criticalData.activities.length > 0 && (
              <Animated.View entering={FadeInDown.delay(550).springify()}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconBg, { backgroundColor: '#EF4444' }]}>
                    <Ionicons name="shield" size={18} color="#fff" />
                  </View>
                  <Heading3 style={styles.sectionTitle}>Recent Critical Activities</Heading3>
                  <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={() => router.push('/audit?severity=critical')}
                  >
                    <BodyText style={styles.viewAllText}>View All</BodyText>
                    <Ionicons name="chevron-forward" size={16} color={Colors.primary[500]} />
                  </TouchableOpacity>
                </View>

                <Card variant="elevated" style={styles.criticalCard}>
                  {criticalData.activities.slice(0, 5).map((activity, index) => (
                    <TouchableOpacity
                      key={activity.id}
                      style={[
                        styles.criticalItem,
                        index === Math.min(criticalData.activities.length, 5) - 1 &&
                          styles.criticalItemLast,
                      ]}
                      onPress={() => router.push(`/audit/${activity.id}`)}
                    >
                      <View style={styles.criticalIndicator} />
                      <View style={styles.criticalContent}>
                        <BodyText style={styles.criticalAction} numberOfLines={1}>
                          {formatAction(activity.action)}
                        </BodyText>
                        <Caption style={styles.criticalTime}>
                          {new Date(activity.timestamp).toLocaleString()}
                        </Caption>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                  ))}
                </Card>
              </Animated.View>
            )}

            {/* Heatmap Summary */}
            {heatmapData?.heatmap?.peakActivity && (
              <Animated.View entering={FadeInDown.delay(600).springify()}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconBg, { backgroundColor: '#0EA5E9' }]}>
                    <Ionicons name="time" size={18} color="#fff" />
                  </View>
                  <Heading3 style={styles.sectionTitle}>Peak Activity</Heading3>
                </View>

                <Card variant="elevated" style={styles.peakCard}>
                  <View style={styles.peakContent}>
                    <View style={styles.peakIconContainer}>
                      <LinearGradient
                        colors={['#0EA5E9', '#0284C7']}
                        style={styles.peakIconGradient}
                      >
                        <Ionicons name="flash" size={28} color="#fff" />
                      </LinearGradient>
                    </View>
                    <View style={styles.peakInfo}>
                      <Heading3 style={styles.peakTitle}>
                        {heatmapData.heatmap.peakActivity.count.toLocaleString()} events
                      </Heading3>
                      <BodyText style={styles.peakTime}>
                        {formatPeakTime(heatmapData.heatmap.peakActivity.hour)} on{' '}
                        {new Date(heatmapData.heatmap.peakActivity.date).toLocaleDateString(
                          'en-US',
                          {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                          }
                        )}
                      </BodyText>
                    </View>
                  </View>
                </Card>
              </Animated.View>
            )}

            {/* Activity Summary */}
            {summaryData?.summary && (
              <Animated.View entering={FadeInDown.delay(650).springify()}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconBg, { backgroundColor: '#14B8A6' }]}>
                    <Ionicons name="analytics" size={18} color="#fff" />
                  </View>
                  <Heading3 style={styles.sectionTitle}>Activity Summary</Heading3>
                </View>

                <View style={styles.summaryGrid}>
                  <Card variant="outlined" style={styles.summaryCard}>
                    <Ionicons name="people-outline" size={24} color={Colors.primary[500]} />
                    <Heading3 style={styles.summaryValue}>
                      {summaryData.summary.uniqueUsers?.toLocaleString() || 0}
                    </Heading3>
                    <Caption style={styles.summaryLabel}>Unique Users</Caption>
                  </Card>

                  <Card variant="outlined" style={styles.summaryCard}>
                    <Ionicons name="cube-outline" size={24} color="#10B981" />
                    <Heading3 style={styles.summaryValue}>
                      {summaryData.summary.uniqueResources?.toLocaleString() || 0}
                    </Heading3>
                    <Caption style={styles.summaryLabel}>Resources Changed</Caption>
                  </Card>

                  <Card variant="outlined" style={styles.summaryCard}>
                    <Ionicons name="flash-outline" size={24} color="#F59E0B" />
                    <Heading3 style={styles.summaryValue}>
                      {summaryData.summary.totalActivities?.toLocaleString() || 0}
                    </Heading3>
                    <Caption style={styles.summaryLabel}>Total Activities</Caption>
                  </Card>
                </View>
              </Animated.View>
            )}

            {/* Bottom Spacer */}
            <View style={styles.bottomSpacer} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper Functions
function getResourceIcon(resourceType: string): unknown {
  const icons: Record<string, string> = {
    product: 'cube',
    order: 'receipt',
    store: 'storefront',
    user: 'person',
    merchant: 'business',
    cashback: 'card',
    payment: 'wallet',
    inventory: 'layers',
    category: 'folder',
    customer: 'people',
    report: 'document-text',
    settings: 'settings',
    permissions: 'shield',
    api_key: 'key',
    webhook: 'link',
    bulk_action: 'apps',
    export: 'download',
    import: 'cloud-upload',
  };
  return icons[resourceType] || 'ellipse';
}

function formatAction(action: string): string {
  return action.replace(/[._]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPeakTime(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:00 ${period}`;
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
    height: 400,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.base,
    paddingBottom: 100,
  },

  // Header Styles
  glassHeader: {
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius['3xl'],
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
    paddingVertical: Spacing.xl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: Colors.text.inverse,
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  // Section Styles
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  sectionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statsCardWrapper: {
    width: (SCREEN_WIDTH - Spacing.base * 2 - 12) / 2,
  },
  statsCardGradient: {
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    minHeight: 140,
    justifyContent: 'space-between',
    ...Shadows.md,
  },
  statsCardLight: {
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    minHeight: 140,
    justifyContent: 'space-between',
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.default,
    ...Shadows.sm,
  },
  statsCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCardIconLight: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCardLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    marginTop: Spacing.sm,
  },
  statsCardLabelDark: {
    color: Colors.text.secondary,
    fontSize: 13,
    marginTop: Spacing.sm,
  },
  statsCardValue: {
    color: Colors.text.inverse,
    fontSize: 28,
    fontWeight: '800',
  },
  statsCardValueDark: {
    color: Colors.text.primary,
    fontSize: 28,
    fontWeight: '800',
  },

  // Distribution Card
  distributionCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  distributionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
    gap: 8,
  },
  distributionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  distributionText: {
    fontSize: 13,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  distributionBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distributionBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.gray[100],
    borderRadius: 4,
    overflow: 'hidden',
  },
  distributionBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  distributionPercentage: {
    fontSize: 12,
    color: Colors.text.secondary,
    width: 36,
    textAlign: 'right',
  },
  distributionCount: {
    fontSize: 13,
    color: Colors.text.primary,
    fontWeight: '600',
    width: 50,
    textAlign: 'right',
  },

  // Trend Card
  trendCard: {
    padding: Spacing.lg,
  },
  trendChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    gap: 8,
  },
  trendBarWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  trendBarContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    borderRadius: 4,
    backgroundColor: Colors.gray[100],
  },
  trendBar: {
    width: '100%',
    borderRadius: 4,
  },
  trendLabel: {
    fontSize: 10,
    color: Colors.text.secondary,
  },
  trendCount: {
    fontSize: 10,
    color: Colors.text.primary,
    fontWeight: '600',
  },

  // List Card
  listCard: {
    padding: Spacing.base,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
    gap: Spacing.md,
  },
  listItemLast: {
    borderBottomWidth: 0,
  },
  listItemRank: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.secondary,
  },
  listItemContent: {
    flex: 1,
    gap: 4,
  },
  listItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  listItemBarBg: {
    height: 4,
    backgroundColor: Colors.gray[100],
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  listItemBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  listItemCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FCE7F3',
  },
  listItemCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EC4899',
  },
  resourceTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceType: {
    fontSize: 11,
    color: Colors.text.tertiary,
    textTransform: 'capitalize',
  },

  // Critical Card
  criticalCard: {
    padding: Spacing.base,
  },
  criticalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
    gap: Spacing.md,
  },
  criticalItemLast: {
    borderBottomWidth: 0,
  },
  criticalIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
    backgroundColor: '#EF4444',
  },
  criticalContent: {
    flex: 1,
  },
  criticalAction: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  criticalTime: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 2,
  },

  // Peak Card
  peakCard: {
    padding: Spacing.lg,
  },
  peakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  peakIconContainer: {
    ...Shadows.md,
    borderRadius: 16,
  },
  peakIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peakInfo: {
    flex: 1,
  },
  peakTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  peakTime: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },

  // Summary Grid
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: Spacing.base,
    alignItems: 'center',
    gap: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.text.secondary,
    textAlign: 'center',
  },

  // View All Button
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary[500],
  },

  // Loading & Error States
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
    gap: Spacing.base,
  },
  loadingText: {
    color: Colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  errorText: {
    color: Colors.error[500],
    textAlign: 'center',
  },
  errorSubtext: {
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.lg,
  },
  retryButtonText: {
    color: Colors.text.inverse,
    fontWeight: '600',
  },

  // Permission Denied
  permissionDenied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  permissionDeniedText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
  },

  // Bottom Spacer
  bottomSpacer: {
    height: Spacing['2xl'],
  },
});
