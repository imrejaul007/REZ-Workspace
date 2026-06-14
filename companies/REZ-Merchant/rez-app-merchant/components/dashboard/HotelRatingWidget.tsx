/**
 * Hotel Rating Widget
 * Displays aggregated guest ratings for hotel dashboard
 * Can be embedded in unknown hotel dashboard screen
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import apiClient from '@/services/apiClient';
import { Colors, BorderRadius, Spacing } from '@/constants/DesignTokens';

const C = {
  ...Colors,
  gold: Colors.gold[400] || '#F59E0B',
  green: Colors.green[600] || '#16A34A',
  red: Colors.red[500] || '#EF4444',
};

// ─── Types ─────────────────────────────────────────────────────────────────────
interface HotelRatingWidgetProps {
  hotelId: string;
  compact?: boolean;
  onViewAllPress?: () => void;
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

// ─── Rating Distribution ─────────────────────────────────────────────────────────
function RatingDistributionMini({
  distribution,
  total,
}: {
  distribution: Record<number, number>;
  total: number;
}) {
  return (
    <View style={styles.distributionMini}>
      {[5, 4, 3, 2, 1].map((rating) => {
        const count = distribution[rating] || 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        return (
          <View key={rating} style={styles.distributionRow}>
            <Text style={styles.distributionLabel}>{rating}</Text>
            <Ionicons name="star" size={10} color={C.gold} />
            <View style={styles.distributionBar}>
              <View style={[styles.distributionFill, { width: `${percentage}%` }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Service Rating Row ─────────────────────────────────────────────────────────
function ServiceRatingMini({
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
  };

  return (
    <View style={styles.serviceRatingRow}>
      <Text style={styles.serviceRatingLabel}>
        {categoryLabels[category] || category}
      </Text>
      <View style={styles.serviceRatingContainer}>
        <View style={[styles.serviceRatingBar, { width: `${(rating / 5) * 100}%` }]} />
      </View>
      <Text style={styles.serviceRatingValue}>{rating.toFixed(1)}</Text>
    </View>
  );
}

// ─── Main Widget ────────────────────────────────────────────────────────────────
export default function HotelRatingWidget({
  hotelId,
  compact = false,
  onViewAllPress,
}: HotelRatingWidgetProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ratings, setRatings] = useState<AggregatedRatings | null>(null);

  const fetchRatings = useCallback(async () => {
    try {
      const response = await apiClient.get(`/room-service/feedback/hotel/${hotelId}/ratings`, {
        params: { period: '30_days' },
      });
      if (response.data?.success) {
        setRatings(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch ratings:', error);
    }
  }, [hotelId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRatings();
    setRefreshing(false);
  }, [fetchRatings]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchRatings();
      setLoading(false);
    };
    loadData();
  }, [fetchRatings]);

  const handleViewAll = () => {
    if (onViewAllPress) {
      onViewAllPress();
    } else {
      router.push('/hotel/reviews');
    }
  };

  const getTrendIcon = () => {
    if (!ratings) return 'remove-outline';
    switch (ratings.recentTrend) {
      case 'improving':
        return 'trending-up';
      case 'declining':
        return 'trending-down';
      default:
        return 'remove-outline';
    }
  };

  const getTrendColor = () => {
    if (!ratings) return Colors.gray[400];
    switch (ratings.recentTrend) {
      case 'improving':
        return C.green;
      case 'declining':
        return C.red;
      default:
        return Colors.gray[400];
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary[500]} />
        </View>
      </View>
    );
  }

  if (!ratings || ratings.totalReviews === 0) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={32} color={Colors.gray[300]} />
          <Text style={styles.emptyTitle}>No Reviews Yet</Text>
          <Text style={styles.emptySubtitle}>
            Guest reviews will appear here
          </Text>
        </View>
      </View>
    );
  }

  if (compact) {
    return (
      <View style={[styles.container, styles.containerCompact]}>
        <Pressable style={styles.compactCard} onPress={handleViewAll}>
          <View style={styles.compactHeader}>
            <View style={styles.compactLeft}>
              <Text style={styles.compactScore}>
                {ratings.averageRating.toFixed(1)}
              </Text>
              <View style={styles.compactStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={ratings.averageRating >= star ? 'star' : 'star-outline'}
                    size={14}
                    color={ratings.averageRating >= star ? C.gold : Colors.gray[300]}
                  />
                ))}
              </View>
              <Text style={styles.compactCount}>
                {ratings.totalReviews} reviews
              </Text>
            </View>
            <View style={styles.compactRight}>
              <View style={styles.trendBadge}>
                <Ionicons name={getTrendIcon()} size={16} color={getTrendColor()} />
                <Text style={[styles.trendText, { color: getTrendColor() }]}>
                  {ratings.recentTrend === 'improving'
                    ? 'Improving'
                    : ratings.recentTrend === 'declining'
                    ? 'Declining'
                    : 'Stable'}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.card} onPress={handleViewAll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Guest Ratings</Text>
            <Text style={styles.subtitle}>Last 30 days</Text>
          </View>
          <View style={styles.viewAllBtn}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.primary[500]} />
          </View>
        </View>

        <View style={styles.overallSection}>
          <View style={styles.scoreCard}>
            <Text style={styles.bigScore}>{ratings.averageRating.toFixed(1)}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={ratings.averageRating >= star ? 'star' : 'star-outline'}
                  size={18}
                  color={ratings.averageRating >= star ? C.gold : Colors.gray[300]}
                />
              ))}
            </View>
            <Text style={styles.reviewCount}>
              Based on {ratings.totalReviews} reviews
            </Text>
          </View>

          <View style={styles.metricsColumn}>
            <View style={styles.npsMetric}>
              <Text style={styles.npsLabel}>NPS Score</Text>
              <Text
                style={[
                  styles.npsValue,
                  {
                    color:
                      ratings.npsScore >= 50
                        ? C.green
                        : ratings.npsScore >= 0
                        ? C.gold
                        : C.red,
                  },
                ]}
              >
                {ratings.npsScore}
              </Text>
            </View>
            <View style={styles.trendMetric}>
              <Text style={styles.trendLabel}>Trend</Text>
              <View style={styles.trendRow}>
                <Ionicons name={getTrendIcon()} size={18} color={getTrendColor()} />
                <Text style={[styles.trendValue, { color: getTrendColor() }]}>
                  {ratings.recentTrend === 'improving'
                    ? 'Improving'
                    : ratings.recentTrend === 'declining'
                    ? 'Declining'
                    : 'Stable'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {Object.keys(ratings.averageServiceRatings).length > 0 && (
          <View style={styles.serviceSection}>
            <Text style={styles.sectionTitle}>Service Breakdown</Text>
            <View style={styles.serviceRatings}>
              {Object.entries(ratings.averageServiceRatings)
                .slice(0, 4)
                .map(([category, rating]) => (
                  <ServiceRatingMini
                    key={category}
                    category={category}
                    rating={rating}
                  />
                ))}
            </View>
          </View>
        )}

        <View style={styles.distributionSection}>
          <RatingDistributionMini
            distribution={ratings.ratingDistribution}
            total={ratings.totalReviews}
          />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  containerCompact: {
    marginBottom: 8,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: 16,
  },
  compactCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gray[900],
  },
  subtitle: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 2,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary[500],
  },
  overallSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  scoreCard: {
    alignItems: 'center',
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: Colors.gray[100],
  },
  bigScore: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.gray[900],
  },
  starsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  reviewCount: {
    fontSize: 11,
    color: Colors.gray[500],
    marginTop: 4,
  },
  metricsColumn: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
  },
  npsMetric: {},
  npsLabel: {
    fontSize: 11,
    color: Colors.gray[500],
    fontWeight: '600',
  },
  npsValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  trendMetric: {},
  trendLabel: {
    fontSize: 11,
    color: Colors.gray[500],
    fontWeight: '600',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  serviceSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray[700],
    marginBottom: 8,
  },
  serviceRatings: {
    gap: 8,
  },
  serviceRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceRatingLabel: {
    width: 80,
    fontSize: 12,
    color: Colors.gray[600],
  },
  serviceRatingContainer: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.gray[100],
    borderRadius: 2,
    overflow: 'hidden',
  },
  serviceRatingBar: {
    height: '100%',
    backgroundColor: Colors.primary[500],
    borderRadius: 2,
  },
  serviceRatingValue: {
    width: 32,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray[900],
    textAlign: 'right',
  },
  distributionSection: {},
  distributionMini: {
    gap: 4,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distributionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gray[500],
    width: 10,
  },
  distributionBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.gray[100],
    borderRadius: 3,
    overflow: 'hidden',
  },
  distributionFill: {
    height: '100%',
    backgroundColor: C.gold,
    borderRadius: 3,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactScore: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.gray[900],
  },
  compactStars: {
    flexDirection: 'row',
  },
  compactCount: {
    fontSize: 11,
    color: Colors.gray[500],
    marginLeft: 4,
  },
  compactRight: {},
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.gray[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  loadingContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  emptyState: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[700],
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.gray[400],
    marginTop: 2,
    textAlign: 'center',
  },
});
