// @ts-nocheck
/**
 * Karma Community Detail Screen
 * Community info with feed, events, and members tabs.
 */

import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { KarmaHeader } from '../_layout';
import karmaService, { Community, CommunityPost } from '@/services/karmaService';
import { showAlert } from '@/utils/alert';
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

type TabType = 'feed' | 'events' | 'members';

const TABS: { id: TabType; label: string }[] = [
  { id: 'feed', label: 'Feed' },
  { id: 'events', label: 'Events' },
  { id: 'members', label: 'Members' },
];

// =============================================================================
// POST CARD
// =============================================================================

interface PostCardProps {
  post: CommunityPost;
}

function PostCard({ post }: PostCardProps) {
  const isNGO = post.authorType === 'ngo';
  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View style={[styles.postCard, isNGO && styles.postCardNgo]}>
      {/* Author badge */}
      <View style={styles.postHeader}>
        <View style={[styles.authorBadge, isNGO ? styles.authorBadgeNgo : styles.authorBadgeVolunteer]}>
          <Ionicons name={isNGO ? 'business' : 'person'} size={12} color={isNGO ? '#92400E' : '#7C3AED'} />
          <Text style={[styles.authorBadgeText, isNGO ? styles.authorBadgeTextNgo : styles.authorBadgeTextVolunteer]}>
            {isNGO ? 'NGO' : 'Volunteer'}
          </Text>
        </View>
        {post.isPinned && (
          <View style={styles.pinnedBadge}>
            <Ionicons name="pin" size={10} color={KARMA_PURPLE} />
            <Text style={styles.pinnedText}>Pinned</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <Text style={styles.postContent}>{post.content}</Text>

      {/* Tags */}
      {post.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {post.tags.map((tag) => (
            <View key={tag} style={styles.tagChip}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Footer */}
      <View style={styles.postFooter}>
        <View style={styles.postStat}>
          <Ionicons name="star" size={14} color="#FCD34D" />
          <Text style={styles.postStatText}>+{post.karmaEarned} karma</Text>
        </View>
        <View style={styles.postStat}>
          <Ionicons name="heart-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.postStatText}>{post.likeCount}</Text>
        </View>
        <View style={styles.postStat}>
          <Ionicons name="chatbubble-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.postStatText}>{post.commentCount}</Text>
        </View>
        <Text style={styles.postDate}>{formattedDate}</Text>
      </View>
    </View>
  );
}

// =============================================================================
// MAIN SCREEN
// =============================================================================

function KarmaCommunityDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(false);

  // Create post modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [posting, setPosting] = useState(false);

  const fetchCommunity = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const res = await karmaService.getCommunity(slug);
      if (res.success && res.data) {
        setCommunity(res.data);
      }
    } catch {
      showAlert('Error', 'Failed to load community');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const fetchPosts = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      if (!slug) return;
      if (!isRefresh && pageNum === 1) setPostsLoading(true);

      try {
        const res = await karmaService.getCommunityFeed(slug, pageNum, 20);
        if (res.success && res.data) {
          setPosts((prev) => (pageNum === 1 ? res.data!.posts : [...prev, ...res.data!.posts]));
          setHasMorePosts(res.data.posts.length >= 20);
          setPage(pageNum);
        }
      } catch {
        // non-fatal
      } finally {
        setPostsLoading(false);
        setRefreshing(false);
      }
    },
    [slug],
  );

  useFocusEffect(
    useCallback(() => {
      fetchCommunity();
      fetchPosts(1);
    }, [fetchCommunity, fetchPosts]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchCommunity();
    fetchPosts(1, true);
  };

  const loadMorePosts = () => {
    if (!postsLoading && hasMorePosts) {
      fetchPosts(page + 1);
    }
  };

  const handleFollowToggle = useCallback(async () => {
    if (!community) return;

    const wasFollowing = community.isFollowing;

    // Optimistic update
    setCommunity((prev) =>
      prev
        ? {
            ...prev,
            isFollowing: !wasFollowing,
            followerCount: wasFollowing ? prev.followerCount - 1 : prev.followerCount + 1,
          }
        : null,
    );

    setFollowingLoading(true);
    try {
      if (wasFollowing) {
        const res = await karmaService.unfollowCommunity(community.slug);
        if (!res.success) {
          setCommunity((prev) =>
            prev
              ? {
                  ...prev,
                  isFollowing: wasFollowing,
                  followerCount: wasFollowing ? prev.followerCount + 1 : prev.followerCount - 1,
                }
              : null,
          );
        }
      } else {
        const res = await karmaService.followCommunity(community.slug);
        if (!res.success) {
          setCommunity((prev) =>
            prev
              ? {
                  ...prev,
                  isFollowing: wasFollowing,
                  followerCount: wasFollowing ? prev.followerCount + 1 : prev.followerCount - 1,
                }
              : null,
          );
        }
      }
    } catch {
      setCommunity((prev) =>
        prev
          ? {
              ...prev,
              isFollowing: wasFollowing,
              followerCount: wasFollowing ? prev.followerCount + 1 : prev.followerCount - 1,
            }
          : null,
      );
    } finally {
      setFollowingLoading(false);
    }
  }, [community]);

  const handleCreatePost = useCallback(async () => {
    if (!community || !postContent.trim()) return;

    setPosting(true);
    try {
      const res = await karmaService.createCommunityPost(community.slug, postContent.trim());
      if (res.success && res.data) {
        setPosts((prev) => [res.data!, ...prev]);
        setPostContent('');
        setShowCreateModal(false);
        showAlert('Posted!', 'Your post has been shared with the community.');
      } else {
        showAlert('Error', res.error ?? 'Failed to create post');
      }
    } catch (e) {
      showAlert('Error', e.message ?? 'Something went wrong');
    } finally {
      setPosting(false);
    }
  }, [community, postContent]);

  if (loading) {
    return (
      <View style={styles.container}>
        <KarmaHeader title="Community" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={KARMA_PURPLE} />
        </View>
      </View>
    );
  }

  if (!community) {
    return (
      <View style={styles.container}>
        <KarmaHeader title="Community" showBack />
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>Community not found</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const catConfig = CATEGORY_COLORS[community.category] ?? CATEGORY_COLORS.community;

  const renderPostItem = ({ item }: { item: CommunityPost }) => <PostCard post={item} />;

  const renderFooter = () => {
    if (!hasMorePosts || posts.length === 0) return null;
    return (
      <View style={styles.listFooter}>
        <ActivityIndicator size="small" color={KARMA_PURPLE} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <KarmaHeader title={community.name} showBack />

      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <>
            {/* Hero Banner */}
            <LinearGradient
              colors={catConfig.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.heroBanner}
            >
              <Text style={styles.heroIcon}>{catConfig.icon}</Text>
              <Text style={styles.heroIconLabel}>{catConfig.label}</Text>
            </LinearGradient>

            {/* Community Info */}
            <View style={styles.infoSection}>
              <Text style={styles.communityName}>{community.name}</Text>
              <Text style={styles.communityDescription}>{community.description}</Text>

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{community.followerCount.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{community.stats.eventsHosted}</Text>
                  <Text style={styles.statLabel}>Events</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{community.stats.totalVolunteers}</Text>
                  <Text style={styles.statLabel}>Volunteers</Text>
                </View>
              </View>

              {/* Follow Button */}
              <Pressable
                style={[styles.followBtn, community.isFollowing && styles.followingBtn]}
                onPress={handleFollowToggle}
                disabled={followingLoading}
              >
                {followingLoading ? (
                  <ActivityIndicator size="small" color={community.isFollowing ? KARMA_PURPLE : colors.text.inverse} />
                ) : (
                  <>
                    <Ionicons
                      name={community.isFollowing ? 'checkmark' : 'add'}
                      size={16}
                      color={community.isFollowing ? KARMA_PURPLE : colors.text.inverse}
                    />
                    <Text style={[styles.followBtnText, community.isFollowing && styles.followingBtnText]}>
                      {community.isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* Tab Bar */}
            <View style={styles.tabBar}>
              {TABS.map((tab) => (
                <Pressable
                  key={tab.id}
                  style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Create Post Button (Feed tab, if following) */}
            {activeTab === 'feed' && community.isFollowing && (
              <Pressable style={styles.createPostBtn} onPress={() => setShowCreateModal(true)}>
                <Ionicons name="create-outline" size={18} color={KARMA_PURPLE} />
                <Text style={styles.createPostBtnText}>Share something with the community</Text>
              </Pressable>
            )}
          </>
        }
        ListEmptyComponent={
          activeTab === 'feed' && !postsLoading ? (
            <View style={styles.emptyTabState}>
              <Ionicons name="newspaper-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyTabTitle}>No posts yet</Text>
              <Text style={styles.emptyTabSubtitle}>
                {community.isFollowing ? 'Be the first to share something!' : 'Follow this community to see posts'}
              </Text>
            </View>
          ) : activeTab === 'events' ? (
            <View style={styles.emptyTabState}>
              <Ionicons name="calendar-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyTabTitle}>Events coming soon</Text>
              <Text style={styles.emptyTabSubtitle}>Check the Explore tab for events hosted by this community</Text>
            </View>
          ) : activeTab === 'members' ? (
            <View style={styles.emptyTabState}>
              <Ionicons name="people-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyTabTitle}>{community.stats.totalVolunteers} volunteers</Text>
              <Text style={styles.emptyTabSubtitle}>Join this community to connect with volunteers</Text>
            </View>
          ) : null
        }
        ListFooterComponent={activeTab === 'feed' ? renderFooter : null}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={activeTab === 'feed' ? loadMorePosts : undefined}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[KARMA_PURPLE]}
            tintColor={KARMA_PURPLE}
          />
        }
      />

      {/* Create Post Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share with {community.name}</Text>
              <Pressable onPress={() => setShowCreateModal(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <TextInput
              style={styles.postInput}
              placeholder="What would you like to share?"
              placeholderTextColor={Colors.textSecondary}
              multiline
              maxLength={500}
              value={postContent}
              onChangeText={setPostContent}
              autoFocus
            />

            <Text style={styles.charCount}>{postContent.length}/500</Text>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => {
                  setPostContent('');
                  setShowCreateModal(false);
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.submitBtn, !postContent.trim() && styles.submitBtnDisabled]}
                onPress={handleCreatePost}
                disabled={!postContent.trim() || posting}
              >
                {posting ? (
                  <ActivityIndicator size="small" color={colors.text.inverse} />
                ) : (
                  <Text style={styles.submitBtnText}>Post</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  backBtn: {
    backgroundColor: KARMA_PURPLE,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.xl,
  },
  backBtnText: { fontSize: Typography.body.fontSize, fontWeight: '600', color: colors.text.inverse },

  // List
  listContent: {
    paddingBottom: 120,
  },
  listFooter: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },

  // Hero
  heroBanner: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroIcon: { fontSize: 64 },
  heroIconLabel: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginTop: Spacing.sm,
  },

  // Info Section
  infoSection: {
    backgroundColor: colors.text.inverse,
    padding: Spacing.base,
  },
  communityName: {
    fontSize: Typography.h3.fontSize,
    fontWeight: '800',
    color: colors.deepNavy,
    marginBottom: Spacing.sm,
  },
  communityDescription: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border.default,
    marginBottom: Spacing.md,
  },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: Typography.h4.fontSize, fontWeight: '800', color: colors.deepNavy },
  statLabel: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.border.default },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: KARMA_PURPLE,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    gap: 8,
  },
  followingBtn: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: KARMA_PURPLE,
  },
  followBtnText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  followingBtnText: {
    color: KARMA_PURPLE,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.text.inverse,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: KARMA_PURPLE,
  },
  tabText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: KARMA_PURPLE,
  },

  // Create Post Button
  createPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 8,
    borderWidth: 1,
    borderColor: KARMA_PURPLE,
    borderStyle: 'dashed',
  },
  createPostBtnText: {
    fontSize: Typography.body.fontSize,
    color: KARMA_PURPLE,
    fontWeight: '500',
  },

  // Empty Tab State
  emptyTabState: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.base,
  },
  emptyTabTitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.deepNavy,
    marginTop: Spacing.md,
  },
  emptyTabSubtitle: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },

  // Post Card
  postCard: {
    backgroundColor: colors.text.inverse,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  postCardNgo: {
    borderLeftWidth: 3,
    borderLeftColor: '#D97706',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  authorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  authorBadgeNgo: {
    backgroundColor: '#FEF3C7',
  },
  authorBadgeVolunteer: {
    backgroundColor: '#F5F3FF',
  },
  authorBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  authorBadgeTextNgo: {
    color: '#92400E',
  },
  authorBadgeTextVolunteer: {
    color: '#7C3AED',
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pinnedText: {
    fontSize: Typography.caption.fontSize,
    color: KARMA_PURPLE,
    fontWeight: '500',
  },
  postContent: {
    fontSize: Typography.body.fontSize,
    color: colors.deepNavy,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  tagChip: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagText: {
    fontSize: Typography.caption.fontSize,
    color: KARMA_PURPLE,
    fontWeight: '500',
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postStatText: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
  },
  postDate: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
    marginLeft: 'auto',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.text.inverse,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.base,
    paddingBottom: Platform.OS === 'ios' ? Spacing['2xl'] : Spacing.base,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.deepNavy,
  },
  postInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.body.fontSize,
    color: colors.deepNavy,
    minHeight: 150,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: Spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.base,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
  },
  cancelBtnText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    backgroundColor: KARMA_PURPLE,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '700',
    color: colors.text.inverse,
  },
});

export default withErrorBoundary(KarmaCommunityDetailScreen, 'KarmaCommunityDetail');
