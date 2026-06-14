/**
 * Karma Communities Screen
 * Browse and follow cause-based communities.
 */

import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, RefreshControl, ActivityIndicator, Platform } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { KarmaHeader } from './_layout';
import karmaService, { Community } from '@/services/karmaService';
import { useIsMounted } from '@/hooks/useIsMounted';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';

const KARMA_PURPLE = '#8B5CF6';

const CATEGORY_COLORS: Record<string, { gradient: readonly [string, string]; icon: string; label: string }> = {
  environment: { gradient: ['#064E3B', '#059669'], icon: '🌍', label: 'Environment' },
  food: { gradient: ['#92400E', '#D97706'], icon: '🍽️', label: 'Food' },
  health: { gradient: ['#7C3AED', '#A78BFA'], icon: '🏥', label: 'Health' },
  education: { gradient: ['#1D4ED8', '#60A5FA'], icon: '📚', label: 'Education' },
  community: { gradient: ['#BE185D', '#F472B6'], icon: '🤝', label: 'Community' },
};

const CATEGORY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'environment', label: 'Environment' },
  { id: 'food', label: 'Food' },
  { id: 'health', label: 'Health' },
  { id: 'education', label: 'Education' },
  { id: 'community', label: 'Community' },
];

// =============================================================================
// COMMUNITY CARD
// =============================================================================

interface CommunityCardProps {
  community: Community;
  onPress: () => void;
  onFollowToggle: () => void;
  isFollowing: boolean;
  followingLoading: boolean;
}

function CommunityCard({ community, onPress, onFollowToggle, isFollowing, followingLoading }: CommunityCardProps) {
  const catConfig = CATEGORY_COLORS[community.category] ?? CATEGORY_COLORS.community;

  return (
    <Pressable onPress={onPress} style={styles.card}>
      {/* Gradient Banner */}
      <LinearGradient colors={catConfig.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardBanner}>
        <Text style={styles.cardIcon}>{catConfig.icon}</Text>
        <View style={styles.cardBannerOverlay} />
      </LinearGradient>

      {/* Content */}
      <View style={styles.cardContent}>
        <Text style={styles.cardName} numberOfLines={1}>
          {community.name}
        </Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {community.description}
        </Text>

        {/* Stats row */}
        <View style={styles.cardStats}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={14} color={Colors.textSecondary} />
            <Text style={styles.statText}>{community.followerCount.toLocaleString()} followers</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="flag" size={14} color={Colors.textSecondary} />
            <Text style={styles.statText}>{community.stats.eventsHosted} events</Text>
          </View>
        </View>

        {/* Follow button */}
        <Pressable
          style={[styles.followBtn, isFollowing && styles.followingBtn]}
          onPress={(e) => {
            e.stopPropagation();
            onFollowToggle();
          }}
          disabled={followingLoading}
        >
          {followingLoading ? (
            <ActivityIndicator size="small" color={isFollowing ? KARMA_PURPLE : colors.text.inverse} />
          ) : (
            <>
              <Ionicons
                name={isFollowing ? 'checkmark' : 'add'}
                size={14}
                color={isFollowing ? KARMA_PURPLE : colors.text.inverse}
              />
              <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </Pressable>
  );
}

// =============================================================================
// MAIN SCREEN
// =============================================================================

function KarmaCommunitiesScreen() {
  const router = useRouter();
  const isMounted = useIsMounted();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followingLoading, setFollowingLoading] = useState<string | null>(null);

  const fetchCommunities = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setLoading(true);

      try {
        const res = await karmaService.getCommunities();
        if (!isMounted()) return;

        if (res.success && res.data) {
          setCommunities(res.data);
        }
      } catch {
        // non-fatal
      } finally {
        if (!isMounted()) return;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isMounted],
  );

  useFocusEffect(
    useCallback(() => {
      fetchCommunities();
    }, [fetchCommunities]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchCommunities(true);
  };

  const handleFollowToggle = useCallback(async (community: Community) => {
    const wasFollowing = community.isFollowing;
    const slug = community.slug;

    // Optimistic update
    setCommunities((prev) =>
      prev.map((c) =>
        c.slug === slug
          ? {
              ...c,
              isFollowing: !wasFollowing,
              followerCount: wasFollowing ? c.followerCount - 1 : c.followerCount + 1,
            }
          : c,
      ),
    );

    setFollowingLoading(slug);
    try {
      if (wasFollowing) {
        const res = await karmaService.unfollowCommunity(slug);
        if (!res.success) {
          // Revert on failure
          setCommunities((prev) =>
            prev.map((c) =>
              c.slug === slug
                ? {
                    ...c,
                    isFollowing: wasFollowing,
                    followerCount: wasFollowing ? c.followerCount + 1 : c.followerCount - 1,
                  }
                : c,
            ),
          );
        }
      } else {
        const res = await karmaService.followCommunity(slug);
        if (!res.success) {
          // Revert on failure
          setCommunities((prev) =>
            prev.map((c) =>
              c.slug === slug
                ? {
                    ...c,
                    isFollowing: wasFollowing,
                    followerCount: wasFollowing ? c.followerCount + 1 : c.followerCount - 1,
                  }
                : c,
            ),
          );
        }
      }
    } catch {
      // Revert on error
      setCommunities((prev) =>
        prev.map((c) =>
          c.slug === slug
            ? {
                ...c,
                isFollowing: wasFollowing,
                followerCount: wasFollowing ? c.followerCount + 1 : c.followerCount - 1,
              }
            : c,
        ),
      );
    } finally {
      setFollowingLoading(null);
    }
  }, []);

  const filteredCommunities =
    selectedCategory === 'all' ? communities : communities.filter((c) => c.category === selectedCategory);

  const renderItem = useCallback(
    ({ item }: { item: Community }) => (
      <CommunityCard
        community={item}
        onPress={() => router.push(`/karma/communities/${item.slug}`)}
        onFollowToggle={() => handleFollowToggle(item)}
        isFollowing={item.isFollowing}
        followingLoading={followingLoading === item.slug}
      />
    ),
    [router, handleFollowToggle, followingLoading],
  );

  return (
    <View style={styles.container}>
      <KarmaHeader
        title="Communities"
        subtitle="Join a cause"
        rightAction={
          <Pressable style={styles.myCommunitiesBtn} onPress={() => router.push('/karma/communities/my')} hitSlop={8}>
            <Text style={styles.myCommunitiesText}>My</Text>
          </Pressable>
        }
      />

      {/* Category filter chips */}
      <View style={styles.filterContainer}>
        <FlashList
          horizontal
          data={CATEGORY_FILTERS}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const isActive = selectedCategory === item.id;
            return (
              <Pressable
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSelectedCategory(item.id)}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{item.label}</Text>
              </Pressable>
            );
          }}
          estimatedItemSize={80}
        />
      </View>

      {/* Communities list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={KARMA_PURPLE} />
        </View>
      ) : filteredCommunities.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No communities found</Text>
          <Text style={styles.emptySubtitle}>
            {selectedCategory !== 'all'
              ? `No ${selectedCategory} communities right now`
              : 'Check back soon for new communities'}
          </Text>
        </View>
      ) : (
        <FlashList
          data={filteredCommunities}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[KARMA_PURPLE]}
              tintColor={KARMA_PURPLE}
            />
          }
          estimatedItemSize={200}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.secondary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['2xl'] },
  emptyTitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.deepNavy,
    marginTop: Spacing.base,
  },
  emptySubtitle: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },

  // Filter
  filterContainer: {
    backgroundColor: colors.text.inverse,
    paddingVertical: Spacing.sm,
  },
  filterList: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginRight: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: KARMA_PURPLE,
    borderColor: KARMA_PURPLE,
  },
  filterChipText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.text.inverse,
    fontWeight: '600',
  },

  // List
  listContent: {
    padding: Spacing.base,
    paddingBottom: 120,
  },

  // Card
  card: {
    backgroundColor: colors.text.inverse,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  cardBanner: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  cardIcon: {
    fontSize: 48,
    zIndex: 1,
  },
  cardContent: {
    padding: Spacing.md,
  },
  cardName: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.deepNavy,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  cardStats: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
  },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: KARMA_PURPLE,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  followingBtn: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: KARMA_PURPLE,
  },
  followBtnText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  followingBtnText: {
    color: KARMA_PURPLE,
  },

  // Header action
  myCommunitiesBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  myCommunitiesText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '700',
    color: colors.text.inverse,
  },
});

export default withErrorBoundary(KarmaCommunitiesScreen, 'KarmaCommunities');
