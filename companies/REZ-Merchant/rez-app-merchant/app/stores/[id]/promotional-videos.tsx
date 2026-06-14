import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/DesignTokens';
import { BottomNav, BOTTOM_NAV_HEIGHT_CONSTANT } from '@/components/navigation/BottomNav';
import { useStore } from '@/contexts/StoreContext';
import ConfirmModal from '@/components/common/ConfirmModal';
import SuccessModal from '@/components/common/SuccessModal';
import ErrorModal from '@/components/common/ErrorModal';

import { VideoCard, AnalyticsCard, VideoUploadModal } from '@/components/promotional';
import { promotionalVideosService } from '@/services/api/promotionalVideos';
import { PromotionalVideo, StoreVideoAnalytics } from '@/types/promotionalVideo';
import { logger } from '@/utils/logger';

type SortOption = 'newest' | 'popular' | 'views';

export default function PromotionalVideosScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const storeId = params.id as string;
  const { stores } = useStore();
  const store = stores.find((s) => s._id === storeId);

  // Data state
  const [videos, setVideos] = useState<PromotionalVideo[]>([]);
  const [analytics, setAnalytics] = useState<StoreVideoAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<PromotionalVideo | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Feedback modals
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });
  const [errorMessage, setErrorMessage] = useState({ title: '', message: '' });

  // Load data
  useEffect(() => {
    if (storeId) {
      loadData();
    }
  }, [storeId, sortBy]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load videos and analytics in parallel
      const [videosResponse, analyticsResponse] = await Promise.all([
        promotionalVideosService.getStoreVideos(storeId, {
          sortBy,
          limit: 50,
        }),
        promotionalVideosService.getStoreAnalytics(storeId),
      ]);

      setVideos(videosResponse.videos);
      setAnalytics(analyticsResponse);
    } catch (err) {
      logger.error('Error loading promotional videos:', err);
      setError(err.message || 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [storeId, sortBy]);

  // Handle upload success
  const handleUploadSuccess = useCallback(() => {
    setSuccessMessage({
      title: 'Video Uploaded',
      message: 'Your promotional video has been uploaded successfully.',
    });
    setShowSuccessModal(true);
    loadData();
  }, []);

  // Handle delete
  const handleDeletePress = useCallback((video: PromotionalVideo) => {
    setSelectedVideo(video);
    setShowDeleteModal(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedVideo) return;

    setDeleting(true);
    try {
      await promotionalVideosService.deleteVideo(selectedVideo._id);
      setShowDeleteModal(false);
      setSelectedVideo(null);
      setSuccessMessage({
        title: 'Video Deleted',
        message: 'The video has been deleted successfully.',
      });
      setShowSuccessModal(true);
      loadData();
    } catch (err) {
      logger.error('Delete video error:', err);
      setErrorMessage({
        title: 'Delete Failed',
        message: err.message || 'Failed to delete video. Please try again.',
      });
      setShowErrorModal(true);
    } finally {
      setDeleting(false);
    }
  }, [selectedVideo]);

  // Handle video press (could navigate to detail/edit screen)
  const handleVideoPress = useCallback((video: PromotionalVideo) => {
    // For now, just log - could navigate to edit screen
    logger.debug('Video pressed:', video._id);
  }, []);

  // Handle edit
  const handleEditPress = useCallback((video: PromotionalVideo) => {
    // For now, show a message - could navigate to edit screen
    setErrorMessage({
      title: 'Coming Soon',
      message: 'Video editing will be available in the next update.',
    });
    setShowErrorModal(true);
  }, []);

  // Render sort selector
  const renderSortSelector = () => (
    <View style={styles.sortContainer}>
      {(['newest', 'popular', 'views'] as SortOption[]).map((option) => (
        <TouchableOpacity
          key={option}
          style={[styles.sortOption, sortBy === option && styles.sortOptionActive]}
          onPress={() => setSortBy(option)}
          activeOpacity={0.7}
        >
          <ThemedText style={[styles.sortText, sortBy === option && styles.sortTextActive]}>
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="videocam-outline" size={64} color={Colors.gray[300]} />
      </View>
      <ThemedText style={styles.emptyTitle}>No promotional videos yet</ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        Upload videos to showcase your products and engage customers
      </ThemedText>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => setShowUploadModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={20} color={Colors.text.inverse} />
        <ThemedText style={styles.emptyButtonText}>Upload First Video</ThemedText>
      </TouchableOpacity>
    </View>
  );

  // Render video item
  const renderVideoItem = ({ item }: { item: PromotionalVideo }) => (
    <VideoCard
      video={item}
      onPress={() => handleVideoPress(item)}
      onEdit={() => handleEditPress(item)}
      onDelete={() => handleDeletePress(item)}
    />
  );

  // Render header
  const renderHeader = () => (
    <View style={styles.headerSection}>
      {/* Analytics Card */}
      {analytics && (
        <AnalyticsCard
          analytics={analytics}
          onBestVideoPress={() => {
            if (analytics.bestPerforming) {
              const video = videos.find((v) => v._id === analytics.bestPerforming?._id);
              if (video) handleVideoPress(video);
            }
          }}
          isLoading={loading}
        />
      )}

      {/* Sort selector */}
      {videos.length > 0 && (
        <>
          <View style={styles.listHeader}>
            <ThemedText style={styles.listTitle}>Your Videos</ThemedText>
            <ThemedText style={styles.videoCount}>
              {videos.length} video{videos.length !== 1 ? 's' : ''}
            </ThemedText>
          </View>
          {renderSortSelector()}
        </>
      )}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <ThemedText style={styles.headerTitle}>Promotional Videos</ThemedText>
            <ThemedText style={styles.headerSubtitle}>{store?.name || ''}</ThemedText>
          </View>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <ThemedText style={styles.loadingText}>Loading videos...</ThemedText>
        </View>

        <BottomNav />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <ThemedText style={styles.headerTitle}>Promotional Videos</ThemedText>
          <ThemedText style={styles.headerSubtitle}>{store?.name || ''}</ThemedText>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowUploadModal(true)}>
          <Ionicons name="add" size={24} color={Colors.text.inverse} />
        </TouchableOpacity>
      </View>

      {/* Error State */}
      {error && !loading && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color={Colors.error[500]} />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <ThemedText style={styles.retryText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      <FlatList
        data={videos}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        contentContainerStyle={[styles.listContent, videos.length === 0 && styles.listContentEmpty]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary[500]]}
            tintColor={Colors.primary[500]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* FAB for quick add */}
      {videos.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowUploadModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="videocam" size={24} color={Colors.text.inverse} />
        </TouchableOpacity>
      )}

      <BottomNav />

      {/* Upload Modal */}
      <VideoUploadModal
        visible={showUploadModal}
        storeId={storeId}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={showDeleteModal}
        title="Delete Video"
        message={`Are you sure you want to delete "${selectedVideo?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedVideo(null);
        }}
      />

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        title={successMessage.title}
        message={successMessage.message}
        onClose={() => setShowSuccessModal(false)}
      />

      {/* Error Modal */}
      <ErrorModal
        visible={showErrorModal}
        title={errorMessage.title}
        message={errorMessage.message}
        onClose={() => setShowErrorModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
  },
  headerRight: {
    width: 44,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: BOTTOM_NAV_HEIGHT_CONSTANT,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error[50],
    padding: Spacing.md,
    margin: Spacing.base,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.error[700],
  },
  retryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.error[500],
    borderRadius: BorderRadius.md,
  },
  retryText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.medium,
  },
  listContent: {
    padding: Spacing.base,
    paddingBottom: BOTTOM_NAV_HEIGHT_CONSTANT + Spacing['3xl'],
  },
  listContentEmpty: {
    flex: 1,
  },
  headerSection: {
    marginBottom: Spacing.md,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  listTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
  },
  videoCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
  },
  sortContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.base,
  },
  sortOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  sortOptionActive: {
    backgroundColor: Colors.background.primary,
    ...Shadows.sm,
  },
  sortText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    fontWeight: Typography.fontWeight.medium,
  },
  sortTextActive: {
    color: Colors.primary[600],
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: BOTTOM_NAV_HEIGHT_CONSTANT,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: Typography.lineHeight.base,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  emptyButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.inverse,
  },
  fab: {
    position: 'absolute',
    right: Spacing.base,
    bottom: BOTTOM_NAV_HEIGHT_CONSTANT + Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
});
