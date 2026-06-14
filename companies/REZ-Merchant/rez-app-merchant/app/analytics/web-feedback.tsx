import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { logger } from '@/utils/logger';

interface WebFeedbackSummary {
  foodQualityAvg: number;
  serviceSpeedAvg: number;
  recommendPercent: number;
  totalResponses: number;
}

interface WebFeedbackEntry {
  id: string;
  foodQuality: number;
  serviceSpeed: number;
  wouldRecommend: boolean;
  comment: string | null;
  date: string;
}

interface WebFeedbackData {
  summary: WebFeedbackSummary;
  recentFeedback: WebFeedbackEntry[];
}

export default function WebFeedbackScreen() {
  const [data, setData] = useState<WebFeedbackData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);

  const fetchFeedback = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setIsLoading(true);

      const res = await apiClient.get<WebFeedbackData>('/api/merchant/analytics/web-feedback');

      if (res.success && res.data) {
        setData(res.data);
        setIsEmpty(res.data.summary.totalResponses === 0);
      } else {
        setIsEmpty(true);
      }
    } catch (error) {
      // 404 or any error — show empty state gracefully
      logger.error('Web feedback fetch error:', error);
      setIsEmpty(true);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleRefresh = () => {
    fetchFeedback(true);
  };

  const renderStars = (rating: number, max = 5) => {
    return Array.from({ length: max }, (_, i) => (
      <Ionicons
        key={i}
        name={i < Math.round(rating) ? 'star' : 'star-outline'}
        size={14}
        color={Colors.light.warning}
      />
    ));
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <ThemedText style={styles.loadingText}>Loading feedback data...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Web Menu Feedback</ThemedText>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {isEmpty || !data ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={56} color={Colors.light.icon} />
            <ThemedText style={styles.emptyTitle}>No feedback yet</ThemedText>
            <ThemedText style={styles.emptyMessage}>
              No web menu feedback yet. Feedback from QR-scanned orders will appear here.
            </ThemedText>
          </View>
        ) : (
          <>
            {/* Summary Cards */}
            <ThemedText style={styles.sectionTitle}>Summary</ThemedText>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { borderColor: Colors.light.tint }]}>
                <Ionicons name="restaurant-outline" size={22} color={Colors.light.tint} />
                <ThemedText style={styles.summaryValue}>
                  {data.summary.foodQualityAvg.toFixed(1)}
                </ThemedText>
                <ThemedText style={styles.summaryLabel}>Food Quality</ThemedText>
                <View style={styles.starsRow}>{renderStars(data.summary.foodQualityAvg)}</View>
              </View>

              <View style={[styles.summaryCard, { borderColor: Colors.light.success }]}>
                <Ionicons name="flash-outline" size={22} color={Colors.light.success} />
                <ThemedText style={styles.summaryValue}>
                  {data.summary.serviceSpeedAvg.toFixed(1)}
                </ThemedText>
                <ThemedText style={styles.summaryLabel}>Service Speed</ThemedText>
                <View style={styles.starsRow}>{renderStars(data.summary.serviceSpeedAvg)}</View>
              </View>

              <View style={[styles.summaryCard, { borderColor: Colors.light.warning }]}>
                <Ionicons name="thumbs-up-outline" size={22} color={Colors.light.warning} />
                <ThemedText style={styles.summaryValue}>
                  {data.summary.recommendPercent}%
                </ThemedText>
                <ThemedText style={styles.summaryLabel}>Recommend</ThemedText>
                <ThemedText style={styles.summarySubLabel}>
                  {data.summary.totalResponses} responses
                </ThemedText>
              </View>
            </View>

            {/* Recent Feedback */}
            {data.recentFeedback.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Recent Feedback</ThemedText>
                <FlatList
                  data={data.recentFeedback}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <View style={styles.feedbackCard}>
                      <View style={styles.feedbackHeader}>
                        <ThemedText style={styles.feedbackDate}>{item.date}</ThemedText>
                        <View
                          style={[
                            styles.recommendBadge,
                            {
                              backgroundColor: item.wouldRecommend
                                ? Colors.light.success + '20'
                                : Colors.light.error + '20',
                            },
                          ]}
                        >
                          <Ionicons
                            name={item.wouldRecommend ? 'thumbs-up' : 'thumbs-down'}
                            size={12}
                            color={item.wouldRecommend ? Colors.light.success : Colors.light.error}
                          />
                          <ThemedText
                            style={[
                              styles.recommendText,
                              {
                                color: item.wouldRecommend
                                  ? Colors.light.success
                                  : Colors.light.error,
                              },
                            ]}
                          >
                            {item.wouldRecommend ? 'Recommends' : 'Does not recommend'}
                          </ThemedText>
                        </View>
                      </View>

                      <View style={styles.ratingsRow}>
                        <View style={styles.ratingItem}>
                          <ThemedText style={styles.ratingLabel}>Food</ThemedText>
                          <View style={styles.starsRow}>{renderStars(item.foodQuality)}</View>
                        </View>
                        <View style={styles.ratingItem}>
                          <ThemedText style={styles.ratingLabel}>Speed</ThemedText>
                          <View style={styles.starsRow}>{renderStars(item.serviceSpeed)}</View>
                        </View>
                      </View>

                      {item.comment ? (
                        <ThemedText style={styles.feedbackComment} numberOfLines={3}>
                          "{item.comment}"
                        </ThemedText>
                      ) : null}
                    </View>
                  )}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.light.tint,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.light.card,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  emptyMessage: {
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: Colors.light.card,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 4,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.icon,
    textAlign: 'center',
  },
  summarySubLabel: {
    fontSize: 10,
    color: Colors.light.icon,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 1,
  },
  section: {
    marginBottom: 20,
  },
  feedbackCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 12,
    marginBottom: 10,
    gap: 8,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedbackDate: {
    fontSize: 11,
    color: Colors.light.icon,
  },
  recommendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  recommendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  ratingsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  ratingItem: {
    gap: 3,
  },
  ratingLabel: {
    fontSize: 11,
    color: Colors.light.icon,
    fontWeight: '500',
  },
  feedbackComment: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
