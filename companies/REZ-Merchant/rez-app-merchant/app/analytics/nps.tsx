import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { logger } from '@/utils/logger';
import { apiClient } from '@/services/api/client';
import { showAlert } from '@/utils/alert';
import { useStore } from '@/contexts/StoreContext';

interface NPSScore {
  promoters: number;
  passives: number;
  detractors: number;
  totalResponses: number;
  responseRate: number;
  npsScore: number;
}

interface NPSComment {
  id: string;
  rating: number;
  text: string;
  date: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface NPSAnalytics {
  score: NPSScore;
  recentComments: NPSComment[];
}

type PeriodType = 'week' | 'month' | 'quarter' | 'year';

export default function NPSAnalyticsScreen() {
  const [analytics, setAnalytics] = useState<NPSAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<PeriodType>('month');
  const { activeStore } = useStore();

  const fetchAnalytics = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) setRefreshing(true);
        else setIsLoading(true);

        const response = await apiClient.get<NPSAnalytics>(
          `/merchant/analytics/nps?period=${period}`
        );

        if (response.success && response.data) {
          setAnalytics(response.data);
        } else {
          showAlert('Error', response.message || 'Failed to load NPS data');
        }
      } catch (error) {
        logger.error('Error fetching NPS analytics:', error);
        showAlert('Error', error?.message || 'Failed to load NPS data');
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [period]
  );

  useEffect(() => {
    fetchAnalytics();
  }, [period, fetchAnalytics]);

  const handleRefresh = () => {
    fetchAnalytics(true);
  };

  const getSentimentColor = (sentiment: string): string => {
    switch (sentiment) {
      case 'positive':
        return Colors.light.success;
      case 'negative':
        return Colors.light.error;
      default:
        return Colors.light.warning;
    }
  };

  const getSentimentIcon = (sentiment: string): string => {
    switch (sentiment) {
      case 'positive':
        return 'checkmark-circle';
      case 'negative':
        return 'alert-circle';
      default:
        return 'help-circle';
    }
  };

  const renderProgressBar = (percentage: number) => {
    return (
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: Colors.light.tint,
            },
          ]}
        />
      </View>
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <ThemedText style={styles.loadingText}>Loading NPS data...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>NPS - Customer Satisfaction</ThemedText>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'quarter', 'year'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodButton, period === p && styles.periodButtonActive]}
              onPress={() => setPeriod(p)}
            >
              <ThemedText
                style={[styles.periodButtonText, period === p && styles.periodButtonTextActive]}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {analytics && (
          <>
            {/* NPS Score Card */}
            <View style={styles.scoreCard}>
              <View style={styles.scoreValue}>
                <ThemedText style={styles.score}>{analytics.score.npsScore}</ThemedText>
              </View>

              {renderProgressBar((analytics.score.npsScore + 100) / 2)}

              <View style={styles.responseInfo}>
                <ThemedText style={styles.responseText}>
                  {analytics.score.totalResponses} responses · {analytics.score.responseRate}%
                  response rate
                </ThemedText>
              </View>
            </View>

            {/* Distribution */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Responses by category</ThemedText>

              <View style={styles.categoryItem}>
                <View style={styles.categoryHeader}>
                  <ThemedText style={styles.categoryLabel}>Promoters (9-10)</ThemedText>
                  <ThemedText style={styles.categoryValue}>{analytics.score.promoters}%</ThemedText>
                </View>
                {renderProgressBar(analytics.score.promoters)}
              </View>

              <View style={styles.categoryItem}>
                <View style={styles.categoryHeader}>
                  <ThemedText style={styles.categoryLabel}>Passives (7-8)</ThemedText>
                  <ThemedText style={styles.categoryValue}>{analytics.score.passives}%</ThemedText>
                </View>
                {renderProgressBar(analytics.score.passives)}
              </View>

              <View style={styles.categoryItem}>
                <View style={styles.categoryHeader}>
                  <ThemedText style={styles.categoryLabel}>Detractors (0-6)</ThemedText>
                  <ThemedText style={styles.categoryValue}>
                    {analytics.score.detractors}%
                  </ThemedText>
                </View>
                {renderProgressBar(analytics.score.detractors)}
              </View>
            </View>

            {/* Recent Comments */}
            {analytics.recentComments.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Recent comments</ThemedText>
                <FlatList
                  data={analytics.recentComments}
                  renderItem={({ item }) => (
                    <View style={styles.commentCard}>
                      <View style={styles.commentHeader}>
                        <View style={styles.ratingBadge}>
                          <ThemedText style={styles.ratingText}>★{item.rating}</ThemedText>
                        </View>
                        <ThemedText style={styles.commentDate}>{item.date}</ThemedText>
                      </View>
                      <ThemedText style={styles.commentText} numberOfLines={3}>
                        {item.text}
                      </ThemedText>
                      <View style={styles.sentimentIndicator}>
                        <Ionicons
                          name={getSentimentIcon(item.sentiment) as unknown as keyof typeof Ionicons.glyphMap}
                          size={14}
                          color={getSentimentColor(item.sentiment)}
                        />
                        <ThemedText
                          style={[
                            styles.sentimentLabel,
                            { color: getSentimentColor(item.sentiment) },
                          ]}
                        >
                          {item.sentiment === 'positive'
                            ? '✓'
                            : item.sentiment === 'negative'
                              ? '⚠'
                              : ''}
                        </ThemedText>
                      </View>
                    </View>
                  )}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              </View>
            )}

            {/* Configure Button */}
            <TouchableOpacity
              style={styles.configButton}
              onPress={() =>
                router.push(activeStore?._id ? `/stores/${activeStore._id}/details` : '/stores')
              }
            >
              <Ionicons name="settings" size={16} color={Colors.light.card} />
              <ThemedText style={styles.configButtonText}>Configure NPS</ThemedText>
            </TouchableOpacity>
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
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    backgroundColor: Colors.light.card,
  },
  periodButtonActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.text,
  },
  periodButtonTextActive: {
    color: Colors.light.card,
  },
  scoreCard: {
    paddingHorizontal: 12,
    paddingVertical: 20,
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 20,
  },
  scoreValue: {
    alignItems: 'center',
    marginBottom: 16,
  },
  score: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.light.text,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  responseInfo: {
    alignItems: 'center',
  },
  responseText: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  categoryItem: {
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.text,
  },
  categoryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
  },
  commentCard: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.light.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.light.warning + '20',
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.warning,
  },
  commentDate: {
    fontSize: 11,
    color: Colors.light.icon,
  },
  commentText: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
    marginBottom: 8,
  },
  sentimentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sentimentLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  configButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 32,
  },
  configButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.card,
  },
});
