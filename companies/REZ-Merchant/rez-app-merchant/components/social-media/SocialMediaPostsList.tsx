import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { showAlert } from '@/utils/alert';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { socialMediaService, SocialMediaPost, SocialMediaStats } from '@/services/api/socialMedia';
import { SocialMediaPostCard } from './SocialMediaPostCard';
import { VerifyPostModal } from './VerifyPostModal';
import { logger } from '@/utils/logger';

type StatusFilter = 'all' | 'pending' | 'approved' | 'credited' | 'rejected';

interface SocialMediaPostsListProps {
  storeId?: string; // Filter posts by specific store
  onStatsUpdate?: (stats: SocialMediaStats) => void;
}

export function SocialMediaPostsList({ storeId, onStatsUpdate }: SocialMediaPostsListProps) {
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [stats, setStats] = useState<SocialMediaStats | null>(null);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SocialMediaPost | null>(null);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | null>(null);

  const fetchData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setIsLoading(true);

      if (__DEV__) logger.log('Fetching social media posts...', { storeId, activeFilter });

      const [postsData, statsData] = await Promise.all([
        socialMediaService.getSocialMediaPosts({
          status: activeFilter !== 'all' ? activeFilter : undefined,
          limit: 50,
          page: 1,
          storeId: storeId // Pass store ID to filter by selected store
        }),
        socialMediaService.getSocialMediaStats()
      ]);

      if (__DEV__) logger.log('Social media data received', { posts: postsData.posts.length, stats: statsData });

      setPosts(postsData.posts || []);
      setStats(statsData);
      onStatsUpdate?.(statsData);
    } catch (error) {
      if (__DEV__) logger.error('Error fetching social media data', error);
      showAlert('Error', 'Failed to load social media posts. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter, storeId, onStatsUpdate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData(true);
  };

  const handleApprove = (postId: string) => {
    const post = posts.find(p => p._id === postId);
    if (post) {
      setSelectedPost(post);
      setModalAction('approve');
    }
  };

  const handleReject = (postId: string) => {
    const post = posts.find(p => p._id === postId);
    if (post) {
      setSelectedPost(post);
      setModalAction('reject');
    }
  };

  const handleConfirmApprove = async (notes?: string) => {
    if (!selectedPost) return;

    try {
      if (__DEV__) logger.log('Approving post', { postId: selectedPost._id });
      await socialMediaService.approveSocialMediaPost(selectedPost._id, notes);
      if (__DEV__) logger.log('Post approved successfully');
      showAlert('Success', `Post approved! ${selectedPost.cashbackAmount} REZ Coins credited to user.`);
      setSelectedPost(null);
      setModalAction(null);
      await fetchData();
    } catch (error) {
      if (__DEV__) logger.error('Error approving post', error);
      showAlert('Error', error.message || 'Failed to approve post. Please try again.');
    }
  };

  const handleConfirmReject = async (reason: string) => {
    if (!selectedPost) return;

    try {
      if (__DEV__) logger.log('Rejecting post', { postId: selectedPost._id });
      await socialMediaService.rejectSocialMediaPost(selectedPost._id, reason);
      if (__DEV__) logger.log('Post rejected successfully');
      showAlert('Success', 'Post has been rejected.');
      setSelectedPost(null);
      setModalAction(null);
      await fetchData();
    } catch (error) {
      if (__DEV__) logger.error('Error rejecting post', error);
      showAlert('Error', error.message || 'Failed to reject post. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setSelectedPost(null);
    setModalAction(null);
  };

  const filterTabs: Array<{ key: StatusFilter; label: string; count?: number }> = [
    { key: 'all', label: 'All', count: stats?.total || 0 },
    { key: 'pending', label: 'Pending', count: stats?.pending || 0 },
    { key: 'approved', label: 'Approved', count: stats?.approved || 0 },
    { key: 'credited', label: 'Credited', count: stats?.credited || 0 },
    { key: 'rejected', label: 'Rejected', count: stats?.rejected || 0 },
  ];

  const filteredPosts = activeFilter === 'all'
    ? posts
    : posts.filter(post => post.status === activeFilter);

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ThemedText>Loading social media posts...</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats Cards */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{stats.pending}</ThemedText>
            <ThemedText style={styles.statLabel}>Pending</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={[styles.statValue, { color: Colors.light.success }]}>
              {stats.credited}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Credited</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={[styles.statValue, { color: Colors.light.primary }]}>
              {stats.creditedAmount.toFixed(0)}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Coins Paid</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={[styles.statValue, { color: Colors.light.success }]}>
              {stats.approvalRate}%
            </ThemedText>
            <ThemedText style={styles.statLabel}>Approval Rate</ThemedText>
          </View>
        </View>
      )}

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
        {filterTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeFilter === tab.key && styles.activeTab]}
            onPress={() => setActiveFilter(tab.key)}
          >
            <ThemedText
              style={[styles.tabText, activeFilter === tab.key && styles.activeTabText]}
            >
              {tab.label} ({tab.count})
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Posts List */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredPosts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={48} color={Colors.light.textSecondary} />
            <ThemedText style={styles.emptyStateText}>
              No social media posts found
            </ThemedText>
            <ThemedText style={styles.emptyStateSubtext}>
              {activeFilter === 'all'
                ? 'Users have not submitted unknown social media posts yet'
                : `No ${activeFilter} posts found`}
            </ThemedText>
          </View>
        ) : (
          filteredPosts.map((post) => (
            <SocialMediaPostCard
              key={post._id}
              post={post}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))
        )}

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Verification Modal */}
      {selectedPost && modalAction && (
        <VerifyPostModal
          visible={!!selectedPost && !!modalAction}
          post={selectedPost}
          action={modalAction}
          onConfirmApprove={handleConfirmApprove}
          onConfirmReject={handleConfirmReject}
          onClose={handleCloseModal}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  tabsContainer: {
    marginBottom: 16,
    flexGrow: 0,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  activeTab: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 13,
    color: Colors.light.text,
  },
  activeTabText: {
    color: Colors.light.background,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default SocialMediaPostsList;
