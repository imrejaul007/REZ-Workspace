// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  FlatList,
  Image,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { tryApi } from '@/services/tryApi';
import { logger } from '@/utils/logger';

interface HistoryItem {
  bookingId: string;
  trialId: string;
  title: string;
  merchant: string;
  merchantImage?: string;
  image: string;
  coinsPaid: number;
  commitmentFeePaid: number;
  bookingDate: string;
  status: 'active' | 'completed' | 'expired';
  qrToken?: string;
  rating?: number;
  reviewText?: string;
  completedDate?: string;
}

type FilterTab = 'all' | 'active' | 'completed' | 'expired';

export default function TrialHistoryScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [reviewModal, setReviewModal] = useState<{ visible: boolean; bookingId?: string }>({
    visible: false,
  });
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<{ coins: number } | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await tryApi.getHistory();
        setBookings(data);
      } catch (err) {
        if (__DEV__) logger.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const filteredBookings = bookings.filter((b) => {
    if (activeFilter === 'all') return true;
    return b.status === activeFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.successScale[500];
      case 'completed':
        return colors.brand.purple;
      case 'expired':
        return colors.text.tertiary;
      default:
        return colors.text.secondary;
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'active':
        return 'checkmark-circle';
      case 'completed':
        return 'star';
      case 'expired':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const handleQRPress = (booking: HistoryItem) => {
    if (booking.status === 'active') {
      router.push(`/try/booking/${booking.bookingId}`);
    }
  };

  const handleReviewPress = (booking: HistoryItem) => {
    if (booking.status === 'completed' && !booking.rating) {
      setReviewModal({ visible: true, bookingId: booking.bookingId });
      setReviewRating(5);
      setReviewText('');
      setReviewError(null);
      setReviewSuccess(null);
    }
  };

  const renderBookingItem = ({ item }: { item: HistoryItem }) => (
    <View style={styles.bookingCard}>
      {/* Image */}
      <Image source={{ uri: item.image }} style={styles.bookingImage} accessibilityIgnoresInvertColors />

      {/* Status Badge */}
      <View
        style={[
          styles.statusBadge,
          {
            backgroundColor: `${getStatusColor(item.status)}20`,
            borderColor: getStatusColor(item.status),
          },
        ]}
      >
        <Ionicons name={getStatusIcon(item.status)} size={14} color={getStatusColor(item.status)} />
        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.bookingContent}>
        {/* Title and Merchant */}
        <View>
          <Text style={styles.bookingTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.bookingMerchant}>{item.merchant}</Text>
        </View>

        {/* Meta */}
        <View style={styles.bookingMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar" size={12} color={colors.text.secondary} />
            <Text style={styles.metaText}>{item.bookingDate}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.coinsBadge}>{item.coinsPaid} 🪙</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.feeBadge}>₹{item.commitmentFeePaid}</Text>
          </View>
        </View>

        {/* Rating if completed */}
        {item.rating && (
          <View style={styles.ratingRow}>
            {[...Array(5)].map((_, i) => (
              <Ionicons
                key={i}
                name={i < item.rating! ? 'star' : 'star-outline'}
                size={14}
                color={i < item.rating! ? '#FFD700' : colors.text.tertiary}
              />
            ))}
            <Text style={styles.ratingText}>{item.rating} stars</Text>
          </View>
        )}

        {/* Review Text if available */}
        {item.reviewText && (
          <Text style={styles.reviewText} numberOfLines={2}>
            {item.reviewText}
          </Text>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {item.status === 'active' && (
            <Pressable style={styles.actionButton} onPress={() => handleQRPress(item)}>
              <Ionicons name="qr-code" size={16} color={colors.brand.purple} />
              <Text style={styles.actionButtonText}>View QR</Text>
            </Pressable>
          )}

          {item.status === 'completed' && !item.rating && (
            <Pressable style={styles.actionButton} onPress={() => handleReviewPress(item)}>
              <Ionicons name="star" size={16} color={colors.brand.goldAccent} />
              <Text style={styles.actionButtonText}>Rate</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-outline" size={48} color={colors.text.tertiary} />
      <Text style={styles.emptyTitle}>No {activeFilter === 'all' ? 'bookings' : activeFilter} bookings yet</Text>
      <Text style={styles.emptySubtitle}>Start exploring and booking trials to see them here</Text>
      <Pressable style={styles.emptyButton} onPress={() => router.back()}>
        <Text style={styles.emptyButtonText}>Browse Trials</Text>
      </Pressable>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.purple} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Trial Bookings</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        {(['all', 'active', 'completed', 'expired'] as const).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.filterTab, activeFilter === tab ? styles.filterTabActive : null]}
            onPress={() => setActiveFilter(tab)}
          >
            <Text style={[styles.filterTabText, activeFilter === tab ? styles.filterTabTextActive : null]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Bookings List */}
      <FlatList
        data={filteredBookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item.bookingId}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<EmptyState />}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
      />

      {/* Review Modal */}
      <Modal
        visible={reviewModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setReviewModal({ visible: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate Your Experience</Text>

            {/* Star Rating */}
            <View style={styles.starRating}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} onPress={() => setReviewRating(star)}>
                  <Ionicons
                    name={star <= reviewRating ? 'star' : 'star-outline'}
                    size={32}
                    color={star <= reviewRating ? '#FFD700' : colors.text.tertiary}
                  />
                </Pressable>
              ))}
            </View>

            <Text style={styles.ratingLabel}>
              {reviewRating === 1
                ? 'Poor'
                : reviewRating === 2
                  ? 'Fair'
                  : reviewRating === 3
                    ? 'Good'
                    : reviewRating === 4
                      ? 'Very Good'
                      : 'Excellent'}
            </Text>

            {/* Error / success feedback */}
            {reviewError ? <Text style={styles.reviewErrorText}>{reviewError}</Text> : null}
            {reviewSuccess ? (
              <Text style={styles.reviewSuccessText}>
                ✓ Review submitted! You earned 🪙 {reviewSuccess.coins} coins.
              </Text>
            ) : null}

            {/* Submit Button */}
            <Pressable
              style={[styles.modalButton, reviewSubmitting ? styles.modalButtonDisabled : null]}
              disabled={reviewSubmitting}
              onPress={async () => {
                if (!reviewModal.bookingId) return;
                setReviewSubmitting(true);
                setReviewError(null);
                setReviewSuccess(null);
                try {
                  const result = await tryApi.submitReview(reviewModal.bookingId, reviewRating, reviewText);
                  if (result.success) {
                    // Update local booking list so the star shows immediately
                    setBookings((prev) =>
                      prev.map((b) =>
                        b.bookingId === reviewModal.bookingId ? { ...b, rating: reviewRating, reviewText } : b,
                      ),
                    );
                    setReviewSuccess({ coins: result.coinsEarned ?? 0 });
                    // Auto-close after 1.5 s
                    setTimeout(() => {
                      setReviewModal({ visible: false });
                      setReviewText('');
                      setReviewRating(5);
                      setReviewSuccess(null);
                    }, 1500);
                  } else {
                    setReviewError(result.message || 'Could not submit review. Try again.');
                  }
                } catch (err) {
                  setReviewError(err?.message || 'Something went wrong. Please try again.');
                } finally {
                  setReviewSubmitting(false);
                }
              }}
            >
              {reviewSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.modalButtonText}>Submit Review</Text>
              )}
            </Pressable>

            <Pressable
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={() => {
                setReviewModal({ visible: false });
                setReviewText('');
                setReviewRating(5);
                setReviewError(null);
                setReviewSuccess(null);
              }}
            >
              <Text style={styles.modalButtonSecondaryText}>Skip</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Header - Modern glass
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },

  // Filter Bar - Modern pills
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    backgroundColor: '#fff',
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  filterTabActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  filterTabTextActive: {
    color: '#fff',
  },

  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },

  // Booking Card - Premium style
  bookingCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  bookingImage: {
    width: '100%',
    height: 160,
    backgroundColor: colors.background.secondary,
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(8px)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Content - Clean layout
  bookingContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    lineHeight: 22,
  },
  bookingMerchant: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
    marginTop: 2,
  },
  bookingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  coinsBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
    backgroundColor: 'rgba(99,102,241,0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 10,
  },
  feeBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },

  // Rating
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
    marginLeft: 4,
  },
  reviewText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // Actions - Modern buttons
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm + 2,
    backgroundColor: 'rgba(99,102,241,0.1)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(99,102,241,0.2)',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F1',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: '#6366F1',
    borderRadius: 16,
    marginTop: spacing.lg,
    ...Platform.select({
      ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },

  // Modal Styles - Premium bottom sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  starRating: {
    flexDirection: 'row',
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  ratingLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#D97706',
  },
  modalButton: {
    width: '100%',
    paddingVertical: spacing.md + 2,
    backgroundColor: '#6366F1',
    borderRadius: 16,
    alignItems: 'center',
    marginTop: spacing.md,
    ...Platform.select({
      ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  modalButtonSecondary: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  modalButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  reviewErrorText: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  reviewSuccessText: {
    fontSize: 14,
    color: '#10B981',
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontWeight: '700',
  },
});
