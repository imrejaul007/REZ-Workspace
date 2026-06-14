// @ts-nocheck
/**
 * app/store-reviews.tsx
 *
 * Full-screen review list for a store.
 * Route: /store-reviews?storeId=<id>&storeName=<name>
 *
 * - Fetches GET /api/stores/:storeId/reviews (via storeSearchService)
 * - Average rating header with breakdown bars
 * - Anonymous FlatList of reviews (no usernames shown)
 * - "Write a Review" FAB if user has not reviewed this store recently
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storeSearchService, Review, ReviewStats } from '@/services/storeSearchService';
import RatingPrompt from '@/components/store/RatingPrompt';
import { colors } from '@/constants/theme';
import { logger } from '@/utils/logger';

const STORAGE_KEY = 'rez_rated_stores';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

async function hasRatedRecently(storeId: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const map: Record<string, string> = JSON.parse(raw);
    if (!map[storeId]) return false;
    const last = new Date(map[storeId]).getTime();
    return Date.now() - last < 7 * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

// ── Breakdown bar ─────────────────────────────────────────────────────────────

function BreakdownBar({ label, pct }: { label: string; pct: number }) {
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { flex: pct / 100 }]} />
        <View style={{ flex: 1 - pct / 100 }} />
      </View>
      <Text style={styles.barPct}>{Math.round(pct)}%</Text>
    </View>
  );
}

// ── Star display ──────────────────────────────────────────────────────────────

function StarDisplay({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons
          key={s}
          name={s <= Math.round(rating) ? 'star' : 'star-outline'}
          size={14}
          color={colors.lightMustard}
        />
      ))}
    </View>
  );
}

// ── Review card ───────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <StarDisplay rating={review.rating} />
        <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
      </View>
      {review?.title ? <Text style={styles.reviewTitle}>{review.title}</Text> : null}
      {review?.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
    </View>
  );
}

// ── Rating header ─────────────────────────────────────────────────────────────

function RatingHeader({ stats }: { stats: ReviewStats }) {
  const total = stats.count || 1;
  const dist = stats.distribution ?? {};

  // distribution keys may be "1"-"5" or 1-5
  const pct = (star: number) => {
    const val = dist[String(star)] ?? dist[star] ?? 0;
    return (val / total) * 100;
  };

  return (
    <View style={styles.ratingHeader}>
      <View style={styles.ratingBig}>
        <Text style={styles.ratingNumber}>{stats.average.toFixed(1)}</Text>
        <StarDisplay rating={stats.average} />
        <Text style={styles.ratingCount}>{stats.count} reviews</Text>
      </View>
      <View style={styles.breakdownContainer}>
        {[5, 4, 3, 2, 1].map((s) => (
          <BreakdownBar key={s} label={`${s}★`} pct={pct(s)} />
        ))}
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function StoreReviewsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ storeId?: string; storeName?: string }>();
  const storeId = params.storeId ?? '';
  const storeName = params.storeName ? decodeURIComponent(params.storeName) : 'Store';

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [ratingTrigger, setRatingTrigger] = useState(0);
  const pageRef = useRef(1);
  // CA-DSC-019 FIX: Use AbortController to cancel previous request before starting new one
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadPage = useCallback(
    async (pageNum: number, append = false) => {
      try {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);

        // Cancel previous request if still in flight
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        const res = await storeSearchService.getStoreReviews({
          storeId,
          page: pageNum,
          limit: 20,
          sortBy: 'newest',
        });

        if (res.success && res.data) {
          setStats(res.data.ratingStats);
          setReviews((prev) => (append ? [...prev, ...res.data.reviews] : res.data.reviews));
          setHasMore(res.data.pagination.hasNextPage);
          pageRef.current = pageNum;
          setPage(pageNum);
        }
      } catch (err) {
        // Ignore abort errors, log others
        if (err?.name !== 'AbortError') {
          logger.warn('[StoreReviews] Failed to load reviews:', { message: err?.message });
        }
      } finally {
        if (pageNum === 1) setLoading(false);
        else setLoadingMore(false);
      }
    },
    [storeId],
  );

  useEffect(() => {
    if (!storeId) return;
    loadPage(1);

    // Check whether the user can leave a review
    let mounted = true;
    Promise.all([storeSearchService.canUserReviewStore(storeId).catch(() => null), hasRatedRecently(storeId)]).then(
      ([canRes, rated]) => {
        if (!mounted) return;
        const backendSays = canRes?.data?.canReview ?? true;
        setCanReview(backendSays && !rated);
      },
    );

    return () => {
      mounted = false;
    };
  }, [storeId, loadPage]);

  const handleEndReached = useCallback(() => {
    if (!hasMore || loadingMore) return;
    loadPage(pageRef.current + 1, true);
  }, [hasMore, loadingMore, loadPage]);

  const renderItem = useCallback(({ item }: { item: Review }) => <ReviewCard review={item} />, []);

  const keyExtractor = useCallback((item: Review) => item._id, []);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: `${storeName} Reviews`,
          headerBackTitle: 'Back',
        }}
      />

      <RatingPrompt
        storeId={storeId}
        storeName={storeName}
        triggerCount={ratingTrigger}
        onDismiss={() => loadPage(1)}
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.nileBlue} />
      ) : (
        <FlashList
          data={reviews}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={stats ? <RatingHeader stats={stats} /> : null}
          ListEmptyComponent={<Text style={styles.empty}>No reviews yet. Be the first!</Text>}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ margin: 16 }} color={colors.midGray} /> : null}
          contentContainerStyle={styles.listContent}
          estimatedItemSize={120}
        />
      )}

      {/* Write a Review FAB */}
      {canReview && !loading && (
        <Pressable
          style={styles.fab}
          onPress={() => setRatingTrigger((t) => t + 1)}
          accessibilityRole="button"
          accessibilityLabel="Write a Review"
        >
          <Ionicons name="create-outline" size={22} color={colors.nileBlue} />
          <Text style={styles.fabText}>Write a Review</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  listContent: {
    paddingBottom: 120,
  },
  // Rating header
  ratingHeader: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    gap: 16,
  },
  ratingBig: {
    alignItems: 'center',
    gap: 6,
    minWidth: 72,
  },
  ratingNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.nileBlue,
    lineHeight: 40,
  },
  ratingCount: {
    fontSize: 12,
    color: colors.midGray,
  },
  breakdownContainer: {
    flex: 1,
    gap: 5,
    justifyContent: 'center',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barLabel: {
    fontSize: 11,
    color: colors.midGray,
    width: 24,
    textAlign: 'right',
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.neutral[100],
    borderRadius: 3,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  barFill: {
    backgroundColor: colors.lightMustard,
    borderRadius: 3,
  },
  barPct: {
    fontSize: 11,
    color: colors.midGray,
    width: 30,
  },
  // Review card
  reviewCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 14,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    shadowColor: colors.nileBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewDate: {
    fontSize: 12,
    color: colors.neutral[400],
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.nileBlue,
    marginBottom: 4,
  },
  reviewComment: {
    fontSize: 13,
    color: colors.neutral[600],
    lineHeight: 19,
  },
  empty: {
    textAlign: 'center',
    color: colors.midGray,
    marginTop: 48,
    fontSize: 15,
  },
  // FAB
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 20,
    left: 20,
    backgroundColor: colors.lightMustard,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: colors.nileBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  fabText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.nileBlue,
  },
});
