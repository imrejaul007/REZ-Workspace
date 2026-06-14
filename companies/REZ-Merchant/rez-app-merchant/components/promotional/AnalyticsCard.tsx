import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/DesignTokens';
import { StoreVideoAnalytics, BestPerformingVideo, SingleVideoAnalytics } from '@/types/promotionalVideo';

interface AnalyticsCardProps {
  analytics: StoreVideoAnalytics;
  onBestVideoPress?: () => void;
  isLoading?: boolean;
}

export default function AnalyticsCard({
  analytics,
  onBestVideoPress,
  isLoading = false,
}: AnalyticsCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const formatNumber = (num: number | undefined | null): string => {
    // Handle undefined, null, or NaN values
    if (num === undefined || num === null || isNaN(num)) {
      return '0';
    }
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const renderStatItem = (
    icon: keyof typeof Ionicons.glyphMap,
    value: number | undefined | null,
    label: string,
    color: string
  ) => (
    <View style={styles.statItem}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <ThemedText style={styles.statValue}>{formatNumber(value)}</ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.skeletonHeader} />
        <View style={styles.statsGrid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.skeletonStat} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="analytics" size={24} color={Colors.primary[600]} />
          <ThemedText style={styles.headerTitle}>Video Analytics</ThemedText>
        </View>
        <View style={styles.videosCountBadge}>
          <ThemedText style={styles.videosCountText}>
            {analytics.totalVideos ?? 0} videos
          </ThemedText>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {renderStatItem('eye', analytics.totalViews, 'Views', Colors.primary[500])}
        {renderStatItem('heart', analytics.totalLikes, 'Likes', Colors.error[500])}
        {renderStatItem('share-social', analytics.totalShares, 'Shares', Colors.success[500])}
        {renderStatItem('chatbubble', analytics.totalComments, 'Comments', Colors.warning[500])}
      </View>

      {/* Engagement Rate */}
      {analytics.avgEngagementRate != null && analytics.avgEngagementRate > 0 && (
        <View style={styles.engagementRow}>
          <View style={styles.engagementLabel}>
            <Ionicons name="trending-up" size={18} color={Colors.success[600]} />
            <ThemedText style={styles.engagementText}>Avg. Engagement Rate</ThemedText>
          </View>
          <ThemedText style={styles.engagementValue}>
            {analytics.avgEngagementRate.toFixed(1)}%
          </ThemedText>
        </View>
      )}

      {/* Best Performing Video */}
      {analytics.bestPerforming && (
        <TouchableOpacity
          style={styles.bestVideoSection}
          onPress={onBestVideoPress}
          activeOpacity={0.7}
        >
          <View style={styles.bestVideoHeader}>
            <View style={styles.trophyContainer}>
              <Ionicons name="trophy" size={16} color={Colors.warning[600]} />
            </View>
            <ThemedText style={styles.bestVideoTitle}>Best Performing</ThemedText>
          </View>

          <View style={styles.bestVideoContent}>
            {analytics.bestPerforming.thumbnail ? (
              <Image
                source={{ uri: analytics.bestPerforming.thumbnail }}
                style={styles.bestVideoThumbnail}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.bestVideoThumbnail, styles.placeholderThumbnail]}>
                <Ionicons name="videocam" size={20} color={Colors.gray[400]} />
              </View>
            )}

            <View style={styles.bestVideoInfo}>
              <ThemedText style={styles.bestVideoName} numberOfLines={2}>
                {analytics.bestPerforming.title}
              </ThemedText>
              <View style={styles.bestVideoStats}>
                <View style={styles.miniStat}>
                  <Ionicons name="eye-outline" size={14} color={Colors.gray[500]} />
                  <ThemedText style={styles.miniStatText}>
                    {formatNumber(analytics.bestPerforming.views)}
                  </ThemedText>
                </View>
                <View style={styles.miniStat}>
                  <Ionicons name="heart-outline" size={14} color={Colors.gray[500]} />
                  <ThemedText style={styles.miniStatText}>
                    {formatNumber(analytics.bestPerforming.likes)}
                  </ThemedText>
                </View>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
          </View>
        </TouchableOpacity>
      )}

      {/* Per-Video Detail Toggle */}
      {analytics.videoPerformance && analytics.videoPerformance.length > 0 && (
        <View style={styles.detailSection}>
          <TouchableOpacity
            style={styles.detailToggle}
            onPress={() => setShowDetails(!showDetails)}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.detailToggleText}>
              {showDetails ? 'Hide Details' : 'View Details'}
            </ThemedText>
            <Ionicons
              name={showDetails ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={Colors.primary[600]}
            />
          </TouchableOpacity>

          {showDetails && (
            <View style={styles.detailList}>
              {[...analytics.videoPerformance]
                .sort((a, b) => (b.views || 0) - (a.views || 0))
                .map((video, index) => (
                  <View key={video.videoId || index} style={styles.detailRow}>
                    {video.thumbnail ? (
                      <Image
                        source={{ uri: video.thumbnail }}
                        style={styles.detailThumb}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.detailThumb, styles.placeholderThumbnail]}>
                        <Ionicons name="videocam" size={14} color={Colors.gray[400]} />
                      </View>
                    )}
                    <View style={styles.detailInfo}>
                      <ThemedText style={styles.detailTitle} numberOfLines={1}>
                        {video.title}
                      </ThemedText>
                      <View style={styles.detailStats}>
                        <View style={styles.miniStat}>
                          <Ionicons name="eye-outline" size={12} color={Colors.gray[500]} />
                          <ThemedText style={styles.miniStatText}>
                            {formatNumber(video.views)}
                          </ThemedText>
                        </View>
                        <View style={styles.miniStat}>
                          <Ionicons name="heart-outline" size={12} color={Colors.gray[500]} />
                          <ThemedText style={styles.miniStatText}>
                            {formatNumber(video.likes)}
                          </ThemedText>
                        </View>
                        {video.engagementRate > 0 && (
                          <View style={styles.engagementMini}>
                            <Ionicons name="trending-up" size={12} color={Colors.success[500]} />
                            <ThemedText style={styles.engagementMiniText}>
                              {video.engagementRate.toFixed(1)}%
                            </ThemedText>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
            </View>
          )}
        </View>
      )}

      {/* Empty State */}
      {(!analytics.totalVideos || analytics.totalVideos === 0) && (
        <View style={styles.emptyState}>
          <Ionicons name="bar-chart-outline" size={40} color={Colors.gray[300]} />
          <ThemedText style={styles.emptyText}>
            Upload videos to see analytics
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.md,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
  },
  videosCountBadge: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  videosCountText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary[700],
    fontWeight: Typography.fontWeight.medium,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.base,
  },
  statItem: {
    flex: 1,
    minWidth: 70,
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.lg,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  engagementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.success[50],
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.base,
  },
  engagementLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  engagementText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.success[700],
    fontWeight: Typography.fontWeight.medium,
  },
  engagementValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.success[600],
  },
  bestVideoSection: {
    backgroundColor: Colors.warning[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.warning[200],
  },
  bestVideoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  trophyContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.warning[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  bestVideoTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.warning[800],
  },
  bestVideoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  bestVideoThumbnail: {
    width: 64,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray[200],
  },
  placeholderThumbnail: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bestVideoInfo: {
    flex: 1,
  },
  bestVideoName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.sm,
  },
  bestVideoStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniStatText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
  detailSection: {
    marginTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: Spacing.md,
  },
  detailToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  detailToggleText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.primary[600],
  },
  detailList: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  detailThumb: {
    width: 48,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.gray[200],
  },
  detailInfo: {
    flex: 1,
  },
  detailTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  detailStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  engagementMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  engagementMiniText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.success[600],
    fontWeight: Typography.fontWeight.medium,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    marginTop: Spacing.sm,
  },
  // Skeleton styles
  skeletonHeader: {
    height: 24,
    backgroundColor: Colors.gray[200],
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.base,
    width: '50%',
  },
  skeletonStat: {
    flex: 1,
    minWidth: 70,
    height: 80,
    backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.lg,
  },
});
