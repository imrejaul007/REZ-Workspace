import React from 'react';
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
import { PromotionalVideo } from '@/types/promotionalVideo';
import { promotionalVideosService } from '@/services/api/promotionalVideos';

interface VideoCardProps {
  video: PromotionalVideo;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isCompact?: boolean;
}

export default function VideoCard({
  video,
  onPress,
  onEdit,
  onDelete,
  isCompact = false,
}: VideoCardProps) {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViewCount = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const duration = video.metadata?.duration || 0;
  const views = video.engagement?.views || 0;
  const likes = video.engagement?.likes || 0;
  const productsCount = video.products?.length || 0;

  if (isCompact) {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {/* Thumbnail */}
        <View style={styles.compactThumbnailContainer}>
          {video.thumbnail ? (
            <Image
              source={{ uri: video.thumbnail }}
              style={styles.compactThumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.compactThumbnail, styles.placeholderThumbnail]}>
              <Ionicons name="videocam" size={24} color={Colors.gray[400]} />
            </View>
          )}

          {/* Duration badge */}
          <View style={styles.durationBadge}>
            <ThemedText style={styles.durationText}>
              {formatDuration(duration)}
            </ThemedText>
          </View>

          {/* Play icon overlay */}
          <View style={styles.playOverlay}>
            <Ionicons name="play" size={20} color={Colors.text.inverse} />
          </View>
        </View>

        {/* Info */}
        <View style={styles.compactInfo}>
          <ThemedText style={styles.compactTitle} numberOfLines={2}>
            {video.title}
          </ThemedText>
          <View style={styles.compactStats}>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={14} color={Colors.gray[500]} />
              <ThemedText style={styles.statText}>{formatViewCount(views)}</ThemedText>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="heart-outline" size={14} color={Colors.gray[500]} />
              <ThemedText style={styles.statText}>{formatViewCount(likes)}</ThemedText>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Thumbnail Section */}
      <View style={styles.thumbnailContainer}>
        {video.thumbnail ? (
          <Image
            source={{ uri: video.thumbnail }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
            <Ionicons name="videocam" size={48} color={Colors.gray[400]} />
          </View>
        )}

        {/* Overlay elements */}
        <View style={styles.thumbnailOverlay}>
          {/* Duration */}
          <View style={styles.durationBadge}>
            <ThemedText style={styles.durationText}>
              {formatDuration(duration)}
            </ThemedText>
          </View>

          {/* Play button */}
          <View style={styles.playButton}>
            <Ionicons name="play" size={32} color={Colors.text.inverse} />
          </View>

          {/* Products count badge */}
          {productsCount > 0 && (
            <View style={styles.productsBadge}>
              <Ionicons name="pricetag" size={12} color={Colors.text.inverse} />
              <ThemedText style={styles.productsText}>
                {productsCount}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Publish status */}
        {!video.isPublished && (
          <View style={styles.draftBadge}>
            <ThemedText style={styles.draftText}>Draft</ThemedText>
          </View>
        )}

        {/* Moderation status badge */}
        {video.moderationStatus === 'pending' && (
          <View style={[styles.moderationBadge, { backgroundColor: '#F59E0B' }]}>
            <Ionicons name="time" size={10} color="#FFFFFF" />
            <ThemedText style={styles.moderationText}>Under Review</ThemedText>
          </View>
        )}
        {video.moderationStatus === 'rejected' && (
          <View style={[styles.moderationBadge, { backgroundColor: '#EF4444' }]}>
            <Ionicons name="close-circle" size={10} color="#FFFFFF" />
            <ThemedText style={styles.moderationText}>Rejected</ThemedText>
          </View>
        )}
        {video.moderationStatus === 'flagged' && (
          <View style={[styles.moderationBadge, { backgroundColor: '#8B5CF6' }]}>
            <Ionicons name="flag" size={10} color="#FFFFFF" />
            <ThemedText style={styles.moderationText}>Flagged</ThemedText>
          </View>
        )}
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        {/* Title */}
        <ThemedText style={styles.title} numberOfLines={2}>
          {video.title}
        </ThemedText>

        {/* Description */}
        {video.description && (
          <ThemedText style={styles.description} numberOfLines={2}>
            {video.description}
          </ThemedText>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="eye-outline" size={16} color={Colors.gray[500]} />
            <ThemedText style={styles.statValue}>{formatViewCount(views)}</ThemedText>
          </View>
          <View style={styles.stat}>
            <Ionicons name="heart-outline" size={16} color={Colors.gray[500]} />
            <ThemedText style={styles.statValue}>{formatViewCount(likes)}</ThemedText>
          </View>
          <View style={styles.stat}>
            <Ionicons name="share-social-outline" size={16} color={Colors.gray[500]} />
            <ThemedText style={styles.statValue}>
              {formatViewCount(video.engagement?.shares || 0)}
            </ThemedText>
          </View>
          <View style={styles.stat}>
            <Ionicons name="chatbubble-outline" size={16} color={Colors.gray[500]} />
            <ThemedText style={styles.statValue}>
              {formatViewCount(video.engagement?.comments || 0)}
            </ThemedText>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil" size={18} color={Colors.primary[600]} />
              <ThemedText style={styles.actionText}>Edit</ThemedText>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color={Colors.error[600]} />
              <ThemedText style={[styles.actionText, styles.deleteText]}>
                Delete
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.md,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      },
    }),
    marginBottom: Spacing.md,
  },
  thumbnailContainer: {
    position: 'relative',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.gray[100],
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray[200],
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  durationText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -16 }, { translateY: -16 }],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productsBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  productsText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semiBold,
  },
  draftBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.warning[500],
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  draftText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semiBold,
  },
  moderationBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  moderationText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semiBold,
  },
  content: {
    padding: Spacing.base,
  },
  title: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.base,
  },
  description: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    lineHeight: Typography.lineHeight.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  actionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.medium,
  },
  deleteButton: {
    backgroundColor: Colors.error[50],
  },
  deleteText: {
    color: Colors.error[600],
  },
  // Compact variant styles
  compactContainer: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.sm,
    width: 160,
    marginRight: Spacing.md,
  },
  compactThumbnailContainer: {
    position: 'relative',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.gray[100],
  },
  compactThumbnail: {
    width: '100%',
    height: '100%',
  },
  compactInfo: {
    padding: Spacing.sm,
  },
  compactTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.sm,
  },
  compactStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
  },
});
