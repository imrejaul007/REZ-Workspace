/**
 * Hotel Reviews Screen
 * Displays aggregated guest feedback and individual reviews
 * Route: /hotel/reviews
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '@/services/apiClient';
import { Colors, Spacing, BorderRadius } from '@/constants/DesignTokens';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface ServiceRating {
  category: string;
  rating: number;
}

interface ReviewItem {
  id: string;
  bookingId: string;
  guestName: string;
  overallRating: number;
  textComment?: string;
  recommendLikelihood: number;
  stayType: string;
  serviceRatings: ServiceRating[];
  submittedAt: string;
  isAnonymous: boolean;
}

interface AggregatedRatings {
  hotelId: string;
  period: 'all_time' | '30_days' | '7_days';
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  averageServiceRatings: Record<string, number>;
  npsScore: number;
  recentTrend: 'improving' | 'stable' | 'declining';
  lastUpdated: string;
}

interface FeedbackResponse {
  success: boolean;
  data: {
    feedback: ReviewItem[];
    total: number;
    page: number;
    totalPages: number;
  };
}

interface RatingsResponse {
  success: boolean;
  data: AggregatedRatings;
}

const C = {
  ...Colors,
  bg: Colors.gray[50],
  white: '#FFFFFF',
  gold: '#F59E0B',
  green: '#16A34A',
  red: '#EF4444',
  cyan: Colors.primary[500] || '#06B6D4',
};

// ─── Star Display ───────────────────────────────────────────────────────────────
function StarDisplay({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={rating >= star ? 'star' : 'star-outline'}
          size={size}
          color={rating >= star ? C.gold : Colors.gray[300]}
        />
      ))}
    </View>
  );
}

// ─── Rating Distribution Bar ─────────────────────────────────────────────────────
function RatingDistributionBar({
  distribution,
  total,
}: {
  distribution: Record<number, number>;
  total: number;
}) {
  return (
    <View style={styles.distributionContainer}>
      {[5, 4, 3, 2, 1].map((rating) => {
        const count = distribution[rating] || 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        return (
          <View key={rating} style={styles.distributionRow}>
            <Text style={styles.distributionLabel}>{rating}</Text>
            <Ionicons name="star" size={12} color={C.gold} />
            <View style={styles.distributionBar}>
              <View
                style={[styles.distributionFill, { width: `${percentage}%` }]}
              />
            </View>
            <Text style={styles.distributionCount}>{count}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Service Rating Bar ─────────────────────────────────────────────────────────
function ServiceRatingBar({
  category,
  rating,
}: {
  category: string;
  rating: number;
}) {
  const categoryLabels: Record<string, string> = {
    cleanliness: 'Cleanliness',
    staff: 'Staff',
    amenities: 'Amenities',
    food: 'Food',
    location: 'Location',
    value: 'Value',
    checkin: 'Check-in',
    checkout: 'Check-out',
  };

  return (
    <View style={styles.serviceRatingRow}>
      <Text style={styles.serviceRatingLabel}>{categoryLabels[category] || category}</Text>
      <View style={styles.serviceRatingBarContainer}>
        <View style={[styles.serviceRatingBar, { width: `${(rating / 5) * 100}%` }]} />
      </View>
      <Text style={styles.serviceRatingValue}>{rating.toFixed(1)}</Text>
    </View>
  );
}

// ─── Review Card ────────────────────────────────────────────────────────────────
function ReviewCard({ review }: { review: ReviewItem }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const stayTypeLabels: Record<string, string> = {
    leisure: 'Leisure',
    business: 'Business',
    family: 'Family',
    couple: 'Couple',
    solo: 'Solo',
  };

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewHeaderLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {review.isAnonymous ? '?' : review.guestName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.guestName}>
              {review.isAnonymous ? 'Anonymous Guest' : review.guestName}
            </Text>
            <Text style={styles.reviewDate}>{formatDate(review.submittedAt)}</Text>
          </View>
        </View>
        <View style={styles.reviewRating}>
          <StarDisplay rating={review.overallRating} />
        </View>
      </View>

      {review.textComment && (
        <Text style={styles.reviewComment}>{review.textComment}</Text>
      )}

      <View style={styles.reviewFooter}>
        <View style={styles.stayTypeBadge}>
          <Text style={styles.stayTypeText}>{stayTypeLabels[review.stayType] || review.stayType}</Text>
        </View>
        {review.recommendLikelihood >= 9 && (
          <View style={[styles.npsBadge, { backgroundColor: '#DCFCE7' }]}>
            <Text style={[styles.npsBadgeText, { color: C.green }]}>Promoter</Text>
          </View>
        )}
        {review.recommendLikelihood <= 6 && (
          <View style={[styles.npsBadge, { backgroundColor: '#FEE2E2' }]}>
            <Text style={[styles.npsBadgeText, { color: C.red }]}>Detractor</Text>
          </View>
        )}
      </View>

      {review.serviceRatings && review.serviceRatings.length > 0 && (
        <View style={styles.serviceRatingsList}>
          {review.serviceRatings.slice(0, 3).map((sr, index) => (
            <View key={sr.category} style={styles.miniServiceRating}>
              <StarDisplay rating={sr.rating} size={12} />
              <Text style={styles.miniServiceLabel}>
                {sr.category.charAt(0).toUpperCase() + sr.category.slice(1)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── NPS Score Card ─────────────────────────────────────────────────────────────
function NpsScoreCard({ score }: { score: number }) {
  const getNpsColor = () => {
    if (score >= 50) return C.green;
    if (score >= 0) return C.gold;
    return C.red;
  };

  const getNpsLabel = () => {
    if (score >= 50) return 'Excellent';
    if (score >= 30) return 'Good';
    if (score >= 0) return 'Needs Work';
    return 'Critical';
  };

  return (
    <View style={styles.npsCard}>
      <Text style={styles.npsLabel}>Net Promoter Score</Text>
      <View style={styles.npsScoreRow}>
        <Text style={[styles.npsScore, { color: getNpsColor() }]}>{score}</Text>
        <View style={styles.npsMeta}>
          <Text style={[styles.npsStatus, { color: getNpsColor() }]}>{getNpsLabel()}</Text>
          <Text style={styles.npsHint}>-100 to +100</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────────
export default function HotelReviewsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aggregatedRatings, setAggregatedRatings] = useState<AggregatedRatings | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [period, setPeriod] = useState<'all_time' | '30_days' | '7_days'>('all_time');
  const [sortBy, setSortBy] = useState<'recent' | 'rating_high' | 'rating_low'>('recent');
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

  const hotelId = 'hotel-001'; // Would come from merchant context

  const fetchRatings = useCallback(async () => {
    try {
      const response = await apiClient.get<RatingsResponse>(
        `/room-service/feedback/hotel/${hotelId}/ratings`,
        { params: { period } }
      );
      if (response.data?.success) {
        setAggregatedRatings(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch ratings:', error);
    }
  }, [hotelId, period]);

  const fetchReviews = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      const params: Record<string, unknown> = {
        page: pageNum,
        limit: 10,
        sortBy,
      };
      if (minRating) params.minRating = minRating;

      const response = await apiClient.get<FeedbackResponse>(
        `/room-service/feedback/hotel/${hotelId}`,
        { params }
      );

      if (response.data?.success) {
        const { feedback, total, totalPages: totalP } = response.data.data;
        if (append) {
          setReviews((prev) => [...prev, ...feedback]);
        } else {
          setReviews(feedback);
        }
        setTotalReviews(total);
        setTotalPages(totalP);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  }, [hotelId, sortBy, minRating]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchRatings(), fetchReviews(1)]);
    setLoading(false);
  }, [fetchRatings, fetchReviews]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const loadMore = async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    await fetchReviews(page + 1, true);
    setLoadingMore(false);
  };

  useEffect(() => {
    loadData();
  }, [period, sortBy, minRating]);

  const filteredReviews = searchQuery
    ? reviews.filter(
        (r) =>
          r.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.textComment?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : reviews;

  const getTrendIcon = () => {
    if (!aggregatedRatings) return 'remove-outline';
    switch (aggregatedRatings.recentTrend) {
      case 'improving':
        return 'trending-up';
      case 'declining':
        return 'trending-down';
      default:
        return 'remove-outline';
    }
  };

  const getTrendColor = () => {
    if (!aggregatedRatings) return Colors.gray[500];
    switch (aggregatedRatings.recentTrend) {
      case 'improving':
        return C.green;
      case 'declining':
        return C.red;
      default:
        return Colors.gray[500];
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loading, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={C.cyan} />
        <Text style={styles.loadingText}>Loading reviews...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.gray[900]} />
        </Pressable>
        <Text style={styles.headerTitle}>Guest Reviews</Text>
        <Pressable style={styles.filterBtn}>
          <Ionicons name="filter-outline" size={22} color={Colors.gray[900]} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Period Filter */}
        <View style={styles.periodFilter}>
          {(['7_days', '30_days', 'all_time'] as const).map((p) => (
            <Pressable
              key={p}
              style={[styles.periodChip, period === p && styles.periodChipActive]}
              onPress={() => setPeriod(p)}
            >
              <Text
                style={[
                  styles.periodChipText,
                  period === p && styles.periodChipTextActive,
                ]}
              >
                {p === '7_days' ? '7 Days' : p === '30_days' ? '30 Days' : 'All Time'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Overall Rating Card */}
        {aggregatedRatings && (
          <View style={styles.overallCard}>
            <View style={styles.overallLeft}>
              <Text style={styles.overallScore}>
                {aggregatedRatings.averageRating.toFixed(1)}
              </Text>
              <StarDisplay rating={Math.round(aggregatedRatings.averageRating)} size={20} />
              <Text style={styles.overallCount}>
                {aggregatedRatings.totalReviews} reviews
              </Text>
            </View>
            <View style={styles.overallRight}>
              <RatingDistributionBar
                distribution={aggregatedRatings.ratingDistribution}
                total={aggregatedRatings.totalReviews}
              />
            </View>
          </View>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <NpsScoreCard score={aggregatedRatings?.npsScore || 0} />
          <View style={styles.trendCard}>
            <Text style={styles.trendLabel}>Recent Trend</Text>
            <View style={styles.trendRow}>
              <Ionicons name={getTrendIcon()} size={24} color={getTrendColor()} />
              <Text style={[styles.trendText, { color: getTrendColor() }]}>
                {aggregatedRatings?.recentTrend === 'improving'
                  ? 'Improving'
                  : aggregatedRatings?.recentTrend === 'declining'
                  ? 'Declining'
                  : 'Stable'}
              </Text>
            </View>
          </View>
        </View>

        {/* Service Ratings */}
        {aggregatedRatings &&
          Object.keys(aggregatedRatings.averageServiceRatings).length > 0 && (
            <View style={styles.serviceRatingsCard}>
              <Text style={styles.sectionTitle}>Service Ratings</Text>
              {Object.entries(aggregatedRatings.averageServiceRatings).map(
                ([category, rating]) => (
                  <ServiceRatingBar
                    key={category}
                    category={category}
                    rating={rating}
                  />
                )
              )}
            </View>
          )}

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={Colors.gray[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search reviews..."
              placeholderTextColor={Colors.gray[400]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={Colors.gray[400]} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Reviews List */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>
              All Reviews ({totalReviews})
            </Text>
            <View style={styles.sortButtons}>
              <Pressable
                style={[styles.sortBtn, sortBy === 'recent' && styles.sortBtnActive]}
                onPress={() => setSortBy('recent')}
              >
                <Text style={[styles.sortBtnText, sortBy === 'recent' && styles.sortBtnTextActive]}>
                  Recent
                </Text>
              </Pressable>
              <Pressable
                style={[styles.sortBtn, sortBy === 'rating_high' && styles.sortBtnActive]}
                onPress={() => setSortBy('rating_high')}
              >
                <Text style={[styles.sortBtnText, sortBy === 'rating_high' && styles.sortBtnTextActive]}>
                  Top
                </Text>
              </Pressable>
              <Pressable
                style={[styles.sortBtn, sortBy === 'rating_low' && styles.sortBtnActive]}
                onPress={() => setSortBy('rating_low')}
              >
                <Text style={[styles.sortBtnText, sortBy === 'rating_low' && styles.sortBtnTextActive]}>
                  Low
                </Text>
              </Pressable>
            </View>
          </View>

          {filteredReviews.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color={Colors.gray[300]} />
              <Text style={styles.emptyTitle}>No reviews yet</Text>
              <Text style={styles.emptySubtitle}>
                Reviews will appear here once guests submit feedback
              </Text>
            </View>
          ) : (
            <>
              {filteredReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}

              {page < totalPages && (
                <Pressable style={styles.loadMoreBtn} onPress={loadMore}>
                  {loadingMore ? (
                    <ActivityIndicator size="small" color={C.cyan} />
                  ) : (
                    <Text style={styles.loadMoreText}>Load More</Text>
                  )}
                </Pressable>
              )}
            </>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: Colors.gray[500],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  backBtn: { padding: 4 },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gray[900],
    marginLeft: 12,
  },
  filterBtn: { padding: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  periodFilter: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  periodChipActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  periodChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray[600],
  },
  periodChipTextActive: {
    color: Colors.white,
  },
  overallCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  overallLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 20,
    borderRightWidth: 1,
    borderRightColor: Colors.gray[100],
  },
  overallScore: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.gray[900],
  },
  overallCount: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 4,
  },
  overallRight: {
    flex: 1,
    paddingLeft: 20,
    justifyContent: 'center',
  },
  distributionContainer: {
    gap: 6,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distributionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray[600],
    width: 12,
  },
  distributionBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.gray[100],
    borderRadius: 4,
    overflow: 'hidden',
  },
  distributionFill: {
    height: '100%',
    backgroundColor: Colors.gold[400],
    borderRadius: 4,
  },
  distributionCount: {
    fontSize: 12,
    color: Colors.gray[500],
    width: 30,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  npsCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  npsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray[500],
    marginBottom: 8,
  },
  npsScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  npsScore: {
    fontSize: 36,
    fontWeight: '800',
  },
  npsMeta: {},
  npsStatus: {
    fontSize: 14,
    fontWeight: '700',
  },
  npsHint: {
    fontSize: 10,
    color: Colors.gray[400],
  },
  trendCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  trendLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray[500],
    marginBottom: 8,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '700',
  },
  serviceRatingsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gray[900],
    marginBottom: 12,
  },
  serviceRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceRatingLabel: {
    width: 90,
    fontSize: 13,
    color: Colors.gray[600],
  },
  serviceRatingBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.gray[100],
    borderRadius: 3,
    overflow: 'hidden',
  },
  serviceRatingBar: {
    height: '100%',
    backgroundColor: Colors.primary[500],
    borderRadius: 3,
  },
  serviceRatingValue: {
    width: 36,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray[900],
    textAlign: 'right',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.gray[900],
  },
  reviewsSection: {
    gap: 12,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  sortBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.gray[100],
  },
  sortBtnActive: {
    backgroundColor: Colors.primary[500],
  },
  sortBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray[600],
  },
  sortBtnTextActive: {
    color: Colors.white,
  },
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  guestName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[900],
  },
  reviewDate: {
    fontSize: 12,
    color: Colors.gray[400],
    marginTop: 2,
  },
  reviewRating: {},
  reviewComment: {
    fontSize: 14,
    color: Colors.gray[700],
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stayTypeBadge: {
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stayTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gray[600],
  },
  npsBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  npsBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  serviceRatingsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  miniServiceRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  miniServiceLabel: {
    fontSize: 11,
    color: Colors.gray[600],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[700],
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.gray[400],
    marginTop: 4,
    textAlign: 'center',
  },
  loadMoreBtn: {
    backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary[500],
  },
});
