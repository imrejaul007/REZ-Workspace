// @ts-nocheck
/**
 * StoreCreatorSection — Creator/UGC content on the store detail page.
 *
 * Gap 3 fix: creator content was generated but never surfaced at the point
 * of purchase decision. This section shows real creator reviews + shorts
 * directly on the store page, providing social proof that converts.
 *
 * Data: GET /creator/store/:storeId/content
 * Position: after StoreOffersSection, before PeopleEarningSection
 */

import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import CachedImage from '@/components/ui/CachedImage';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Colors } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CreatorPost {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  creatorVerified?: boolean;
  thumbnailUrl?: string;
  caption: string;
  likesCount: number;
  viewsCount?: number;
  contentType: 'video' | 'image' | 'reel';
  deepLink?: string; // /ugc/:id
}

export interface StoreCreatorSectionProps {
  storeId: string;
  posts?: CreatorPost[];
  onViewAll?: () => void;
}

// ── API helper ────────────────────────────────────────────────────────────────

async function fetchCreatorPosts(storeId: string): Promise<CreatorPost[]> {
  // Dynamic import to avoid circular deps at module level
  const mod = await import('@/services/apiClient');
  const client = mod.default;
  const res = await client.get(`/creator/store/${storeId}/content?limit=6`);
  return (res.data as unknown)?.posts ?? [];
}

// ── Component ─────────────────────────────────────────────────────────────────

function StoreCreatorSection({ storeId, posts: propPosts, onViewAll }: StoreCreatorSectionProps) {
  const router = useRouter();
  const isMounted = useIsMounted();
  const [posts, setPosts] = useState<CreatorPost[]>(propPosts ?? []);
  const [loading, setLoading] = useState(!propPosts);

  useEffect(() => {
    if (propPosts) return;
    fetchCreatorPosts(storeId)
      .then((data) => {
        if (!isMounted()) return;
        setPosts(data);
      })
      .catch(() => {
        // fail silently — section stays hidden
      })
      .finally(() => {
        if (isMounted()) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.lightMustard} />
      </View>
    );
  }

  if (!posts.length) return null;

  const handlePostPress = (post: CreatorPost) => {
    router.push((post.deepLink ?? `/ugc/${post.id}`) as unknown);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="videocam-outline" size={18} color={colors.lightMustard} />
          <Text style={styles.title}>Creator Reviews</Text>
        </View>
        {onViewAll && (
          <Pressable onPress={onViewAll} accessibilityRole="button">
            <Text style={styles.viewAll}>See all</Text>
          </Pressable>
        )}
      </View>

      {/* Horizontal scroll of post cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {posts.map((post) => (
          <Pressable
            key={post.id}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => handlePostPress(post)}
            accessibilityRole="button"
            accessibilityLabel={`Creator post by ${post.creatorName}`}
          >
            {/* Thumbnail */}
            <View style={styles.thumbnailWrapper}>
              {post.thumbnailUrl ? (
                <CachedImage source={{ uri: post.thumbnailUrl }} style={styles.thumbnail} contentFit="cover" />
              ) : (
                <View style={styles.thumbnailPlaceholder}>
                  <Ionicons name="play-circle-outline" size={32} color={colors.lightMustard} />
                </View>
              )}

              {/* Content type badge */}
              <View style={styles.typeBadge}>
                <Ionicons
                  name={post.contentType === 'video' || post.contentType === 'reel' ? 'play' : 'image-outline'}
                  size={8}
                  color="#fff"
                />
              </View>

              {/* View count overlay */}
              {post.viewsCount != null && post.viewsCount > 0 && (
                <View style={styles.viewsOverlay}>
                  <Ionicons name="eye-outline" size={9} color="#fff" />
                  <Text style={styles.viewsText}>
                    {post.viewsCount >= 1000 ? `${(post.viewsCount / 1000).toFixed(1)}K` : post.viewsCount}
                  </Text>
                </View>
              )}
            </View>

            {/* Creator info */}
            <View style={styles.creatorRow}>
              {post.creatorAvatar ? (
                <CachedImage source={{ uri: post.creatorAvatar }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitial}>{post.creatorName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.creatorMeta}>
                <View style={styles.nameRow}>
                  <Text style={styles.creatorName} numberOfLines={1}>
                    {post.creatorName}
                  </Text>
                  {post.creatorVerified && <Ionicons name="checkmark-circle" size={11} color={colors.lightMustard} />}
                </View>
                <View style={styles.likeRow}>
                  <Ionicons name="heart-outline" size={10} color={colors.gray?.[500] ?? '#888'} />
                  <Text style={styles.likeCount}>{post.likesCount.toLocaleString()}</Text>
                </View>
              </View>
            </View>

            {/* Caption */}
            <Text style={styles.caption} numberOfLines={2}>
              {post.caption}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const CARD_WIDTH = 160;
const THUMB_HEIGHT = 120;

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.lightMustard,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    gap: 12,
    paddingBottom: 4,
  },
  loadingContainer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },

  // Card
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.gray[100],
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.88,
  },

  // Thumbnail
  thumbnailWrapper: {
    width: CARD_WIDTH,
    height: THUMB_HEIGHT,
    backgroundColor: Colors.gray[100],
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray[50],
  },
  typeBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 4,
    padding: 3,
  },
  viewsOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  viewsText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '600',
  },

  // Creator row
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarPlaceholder: {
    backgroundColor: colors.nileBlue ?? '#1a3a52',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  creatorMeta: {
    flex: 1,
    gap: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  creatorName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.primary,
    flexShrink: 1,
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  likeCount: {
    fontSize: 10,
    color: colors.text.tertiary,
  },

  // Caption
  caption: {
    fontSize: 11,
    color: colors.text.secondary,
    lineHeight: 15,
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 8,
  },
});

export default withErrorBoundary(StoreCreatorSection, 'MainStoreSectionStoreCreatorSection');
