/**
 * Audit Archives Management Screen
 * Premium-designed archives management page with glassmorphic styling
 * Permissions required: logs:view or logs:export
 */

import React, { useState, useCallback, useMemo } from 'react';
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
import { showAlert, showConfirm } from '@/utils/alert';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Colors, Spacing, Shadows, BorderRadius, Typography } from '@/constants/DesignTokens';
import {
  Card,
  Heading2,
  Heading3,
  BodyText,
  Caption,
  Button,
  Badge,
} from '@/components/ui/DesignSystemComponents';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/utils/permissions';
import type { MerchantRole } from '@/types/team';
import { useArchivedLogs, useRetentionStatistics } from '@/hooks/queries/useAudit';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Archive item type from the hook
interface ArchiveItem {
  id: string;
  filename: string;
  createdAt: string;
  recordCount: number;
  fileSize: string;
  retentionExpires: string;
}

export default function ArchivesScreen() {
  const { user } = useAuth();

  // Permission checks
  const canView = user?.role ? hasPermission(user.role as MerchantRole, 'logs:view') : false;
  const canExport = user?.role ? hasPermission(user.role as MerchantRole, 'logs:export') : false;
  const hasAccess = canView || canExport;

  // State
  const [refreshing, setRefreshing] = useState(false);

  // Queries
  const {
    data: archivesData,
    isLoading: archivesLoading,
    isError: archivesError,
    error: archivesErrorData,
    refetch: refetchArchives,
    isFetching: archivesFetching,
  } = useArchivedLogs({
    enabled: hasAccess,
  });

  const {
    data: retentionStats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useRetentionStatistics({
    enabled: hasAccess,
  });

  // Handlers
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchArchives(), refetchStats()]);
    setRefreshing(false);
  }, [refetchArchives, refetchStats]);

  const handleDownload = useCallback(
    (archive: ArchiveItem) => {
      if (!canExport) {
        showAlert('Permission Denied', 'You do not have permission to download archive files.');
        return;
      }

      showConfirm(
        'Download Archive',
        `Download ${archive.filename}?\n\nSize: ${archive.fileSize}\nRecords: ${archive.recordCount.toLocaleString()}`,
        () => {
          // In a real app, trigger the download here
          showAlert('Download Started', 'Your archive file is being prepared for download.');
        }
      );
    },
    [canExport]
  );

  // Calculate storage usage visualization
  const storageInfo = useMemo(() => {
    if (!retentionStats) {
      return {
        usedPercent: 0,
        usedGB: '0',
        totalGB: '0',
        statusColor: Colors.success[500],
        statusText: 'OK',
      };
    }

    const percent = retentionStats.utilizationPercent || 0;
    let statusColor = Colors.success[500];
    let statusText = 'OK';

    if (percent >= 90) {
      statusColor = Colors.error[500];
      statusText = 'Full';
    } else if (percent >= 75) {
      statusColor = Colors.warning[500];
      statusText = 'Warning';
    }

    return {
      usedPercent: percent,
      usedGB: retentionStats.storageUsed || '0 GB',
      totalGB: retentionStats.storageLimit || '0 GB',
      statusColor,
      statusText,
    };
  }, [retentionStats]);

  // Check if expiration is soon (within 30 days)
  const isExpiringSoon = useCallback((expirationDate: string) => {
    const expDate = new Date(expirationDate);
    const now = new Date();
    const daysUntilExpiration = Math.ceil(
      (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiration <= 30 && daysUntilExpiration > 0;
  }, []);

  // Format date for display
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  // Render Storage Usage Card
  const renderStorageCard = () => {
    if (statsLoading) {
      return (
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={styles.storageCardLoading}>
            <ActivityIndicator size="small" color={Colors.primary[500]} />
            <Caption style={styles.loadingText}>Loading storage info...</Caption>
          </View>
        </Animated.View>
      );
    }

    return (
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <LinearGradient
          colors={['#0B2240', '#1E3A5F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.storageCard}
        >
          <View style={styles.storageCardHeader}>
            <View style={styles.storageIconContainer}>
              <Ionicons name="server" size={24} color="#00C06A" />
            </View>
            <View style={styles.storageHeaderText}>
              <Heading3 style={styles.storageTitle}>Storage Usage</Heading3>
              <Caption style={styles.storageSubtitle}>
                {archivesData?.count || 0} archive{(archivesData?.count || 0) !== 1 ? 's' : ''}{' '}
                stored
              </Caption>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${storageInfo.statusColor}30` }]}>
              <View style={[styles.statusDot, { backgroundColor: storageInfo.statusColor }]} />
              <BodyText style={[styles.statusText, { color: storageInfo.statusColor }]}>
                {storageInfo.statusText}
              </BodyText>
            </View>
          </View>

          <View style={styles.storageProgressContainer}>
            <View style={styles.storageProgressBar}>
              <Animated.View
                style={[
                  styles.storageProgressFill,
                  {
                    width: `${Math.min(storageInfo.usedPercent, 100)}%`,
                    backgroundColor: storageInfo.statusColor,
                  },
                ]}
              />
            </View>
            <View style={styles.storageLabels}>
              <BodyText style={styles.storageUsed}>{storageInfo.usedGB} used</BodyText>
              <BodyText style={styles.storagePercent}>
                {storageInfo.usedPercent.toFixed(1)}%
              </BodyText>
              <BodyText style={styles.storageTotal}>{storageInfo.totalGB} total</BodyText>
            </View>
          </View>

          {retentionStats?.retentionPolicy && (
            <View style={styles.retentionInfo}>
              <View style={styles.retentionItem}>
                <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.7)" />
                <Caption style={styles.retentionText}>
                  Retention: {retentionStats.retentionPolicy.activeRetentionDays} days
                </Caption>
              </View>
              {retentionStats.estimatedPurgeDate && (
                <View style={styles.retentionItem}>
                  <Ionicons name="trash-outline" size={14} color="rgba(255,255,255,0.7)" />
                  <Caption style={styles.retentionText}>
                    Next purge: {formatDate(retentionStats.estimatedPurgeDate)}
                  </Caption>
                </View>
              )}
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    );
  };

  // Render Archive Card Item
  const renderArchiveItem = ({ item, index }: { item: ArchiveItem; index: number }) => {
    const expiringSoon = isExpiringSoon(item.retentionExpires);

    return (
      <Animated.View
        entering={FadeInRight.delay(index * 50).springify()}
        style={styles.archiveCardWrapper}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleDownload(item)}
          style={styles.archiveCardTouchable}
        >
          <View style={styles.archiveCard}>
            <View style={styles.archiveCardLeft}>
              <View style={styles.fileIconContainer}>
                <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.fileIconGradient}>
                  <Ionicons name="document-text" size={24} color="#fff" />
                </LinearGradient>
              </View>

              <View style={styles.archiveInfo}>
                <BodyText style={styles.archiveFilename} numberOfLines={1}>
                  {item.filename}
                </BodyText>
                <Caption style={styles.archiveDate}>Created {formatDate(item.createdAt)}</Caption>

                <View style={styles.archiveMetaRow}>
                  <View style={styles.archiveMetaItem}>
                    <Ionicons name="layers-outline" size={12} color={Colors.text.tertiary} />
                    <Caption style={styles.archiveMetaText}>
                      {item.recordCount.toLocaleString()} records
                    </Caption>
                  </View>
                  <View style={styles.archiveMetaItem}>
                    <Ionicons name="cloud-outline" size={12} color={Colors.text.tertiary} />
                    <Caption style={styles.archiveMetaText}>{item.fileSize}</Caption>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.archiveCardRight}>
              {expiringSoon && (
                <View style={styles.expirationWarning}>
                  <Ionicons name="warning" size={14} color={Colors.warning[500]} />
                  <Caption style={styles.expirationWarningText}>Expiring soon</Caption>
                </View>
              )}
              <Caption style={styles.expirationDate}>
                Expires {formatDate(item.retentionExpires)}
              </Caption>

              <TouchableOpacity style={styles.downloadButton} onPress={() => handleDownload(item)}>
                <LinearGradient
                  colors={['#00C06A', '#00A85A']}
                  style={styles.downloadButtonGradient}
                >
                  <Ionicons name="download-outline" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Render Empty State
  const renderEmptyState = () => (
    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <LinearGradient
          colors={['rgba(99, 102, 241, 0.2)', 'rgba(99, 102, 241, 0.1)']}
          style={styles.emptyIconGradient}
        >
          <Ionicons name="archive-outline" size={48} color={Colors.primary[400]} />
        </LinearGradient>
      </View>
      <Heading3 style={styles.emptyTitle}>No Archives Found</Heading3>
      <Caption style={styles.emptySubtitle}>
        Audit log archives will appear here when created.{'\n'}
        Archives are automatically generated based on your retention policy.
      </Caption>
    </Animated.View>
  );

  // Permission denied screen
  if (!hasAccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionDenied}>
          <View style={styles.permissionIconContainer}>
            <LinearGradient
              colors={['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.1)']}
              style={styles.permissionIconGradient}
            >
              <Ionicons name="lock-closed" size={48} color={Colors.error[400]} />
            </LinearGradient>
          </View>
          <Heading3 style={styles.permissionDeniedTitle}>Access Restricted</Heading3>
          <Caption style={styles.permissionDeniedText}>
            You don't have permission to view audit archives.{'\n'}
            Contact your administrator to request access.
          </Caption>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <BodyText style={styles.backButtonText}>Go Back</BodyText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (archivesError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <LinearGradient
              colors={['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.1)']}
              style={styles.errorIconGradient}
            >
              <Ionicons name="alert-circle" size={48} color={Colors.error[400]} />
            </LinearGradient>
          </View>
          <Heading3 style={styles.errorTitle}>Failed to Load Archives</Heading3>
          <Caption style={styles.errorSubtitle}>
            {archivesErrorData?.message || 'An unexpected error occurred. Please try again.'}
          </Caption>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetchArchives()}>
            <LinearGradient
              colors={[Colors.primary[500], Colors.primary[600]]}
              style={styles.retryButtonGradient}
            >
              <Ionicons name="refresh" size={18} color="#fff" />
              <BodyText style={styles.retryButtonText}>Retry</BodyText>
            </LinearGradient>
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

      {/* Glassmorphic Header */}
      <Animated.View entering={FadeInDown.springify()} style={styles.glassHeader}>
        <LinearGradient
          colors={['rgba(99, 102, 241, 0.95)', 'rgba(79, 70, 229, 0.9)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.glassHeaderGradient}
        >
          <View style={styles.glassHeaderOverlay}>
            <View style={styles.headerContent}>
              <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>

              <View style={styles.headerTitleContainer}>
                <Heading2 style={styles.headerTitle}>Archives</Heading2>
                <Caption style={styles.headerSubtitle}>Manage audit log archives</Caption>
              </View>

              <View style={styles.headerBadge}>
                <Ionicons name="archive" size={20} color="rgba(255,255,255,0.9)" />
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      <FlatList
        data={archivesData?.archives || []}
        renderItem={renderArchiveItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderStorageCard}
        ListEmptyComponent={
          archivesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary[500]} />
              <Caption style={styles.loadingText}>Loading archives...</Caption>
            </View>
          ) : (
            renderEmptyState()
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary[500]}
            colors={[Colors.primary[500]]}
          />
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
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

  // Glassmorphic Header
  glassHeader: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.sm,
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  headerBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Storage Card
  storageCard: {
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  storageCardLoading: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing['2xl'],
    marginBottom: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.sm,
  },
  storageCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  storageIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 192, 106, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  storageHeaderText: {
    flex: 1,
  },
  storageTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  storageSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  storageProgressContainer: {
    marginBottom: Spacing.md,
  },
  storageProgressBar: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  storageProgressFill: {
    height: '100%',
    borderRadius: 5,
  },
  storageLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storageUsed: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  storagePercent: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  storageTotal: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  retentionInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  retentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  retentionText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },

  // List
  listContent: {
    padding: Spacing.base,
    paddingTop: 0,
  },
  separator: {
    height: Spacing.md,
  },

  // Archive Card
  archiveCardWrapper: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  archiveCardTouchable: {
    borderRadius: BorderRadius.xl,
  },
  archiveCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  archiveCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileIconContainer: {
    marginRight: Spacing.md,
  },
  fileIconGradient: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  archiveInfo: {
    flex: 1,
  },
  archiveFilename: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  archiveDate: {
    color: Colors.text.secondary,
    fontSize: 12,
    marginBottom: 6,
  },
  archiveMetaRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  archiveMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  archiveMetaText: {
    color: Colors.text.tertiary,
    fontSize: 11,
  },
  archiveCardRight: {
    alignItems: 'flex-end',
    marginLeft: Spacing.md,
  },
  expirationWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    marginBottom: 4,
  },
  expirationWarningText: {
    color: Colors.warning[600],
    fontSize: 10,
    fontWeight: '600',
  },
  expirationDate: {
    color: Colors.text.tertiary,
    fontSize: 11,
    marginBottom: 8,
  },
  downloadButton: {
    borderRadius: 10,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  downloadButtonGradient: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.xl,
  },
  emptyIconContainer: {
    marginBottom: Spacing.lg,
  },
  emptyIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: Colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Loading State
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
    gap: Spacing.md,
  },
  loadingText: {
    color: Colors.text.secondary,
  },

  // Error State
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  errorIconContainer: {
    marginBottom: Spacing.lg,
  },
  errorIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  errorSubtitle: {
    color: Colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  retryButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  retryButtonText: {
    color: '#fff',
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
    marginBottom: Spacing.lg,
  },
  permissionIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionDeniedTitle: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  permissionDeniedText: {
    color: Colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  backButton: {
    backgroundColor: Colors.gray[100],
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  backButtonText: {
    color: Colors.text.primary,
    fontWeight: '600',
    fontSize: 15,
  },
});
