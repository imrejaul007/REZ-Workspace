// ==========================================
// CorpPerks Manager App - Performance Review Screen
// ==========================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Card, Avatar, Badge, ProgressBar, Button } from '../src/components';
import { api } from '../src/services/api';
import { useStore } from '../src/store';
import {
  Colors,
  Spacing,
  FontSize,
  BorderRadius,
  formatDate,
} from '../src/utils/theme';
import { PerformanceReview } from '../src/types';

export default function PerformanceReviewScreen() {
  const { teamMembers } = useStore();
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const response = await api.getPerformanceReviews();
      if (response.success && response.data) {
        setReviews(response.data);
      }
    } catch (error) {
      logger.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return Colors.success;
      case 'calibration':
        return Colors.warning;
      case 'manager_review':
        return Colors.info;
      case 'self_review':
        return Colors.secondary;
      default:
        return Colors.textMuted;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Performance Reviews</Text>
          <Text style={styles.headerSubtitle}>
            Current review cycle: Q2 2026
          </Text>
        </View>

        {/* Team Members for Review */}
        <Card title="Pending Reviews" style={styles.section}>
          {teamMembers.map((member) => (
            <View key={member.id} style={styles.reviewItem}>
              <Avatar uri={member.avatar} name={member.name} size="md" />
              <View style={styles.reviewInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberRole}>{member.designation}</Text>
              </View>
              <View style={styles.reviewStatus}>
                {member.performanceScore ? (
                  <>
                    <Text style={styles.ratingValue}>
                      {member.performanceScore.toFixed(1)}
                    </Text>
                    <Text style={styles.ratingMax}>/5.0</Text>
                  </>
                ) : (
                  <Badge label="Not Started" variant="warning" size="sm" />
                )}
              </View>
            </View>
          ))}
        </Card>

        {/* 360 Feedback Section */}
        <Card title="360 Feedback Summary" style={styles.section}>
          <View style={styles.feedbackHeader}>
            <Text style={styles.feedbackTitle}>Feedback Received</Text>
            <Badge label="5 Reviews" variant="info" size="sm" />
          </View>
          <Text style={styles.feedbackDesc}>
            360-degree feedback from peers, direct reports, and skip-level managers
          </Text>

          <View style={styles.feedbackGrid}>
            <View style={styles.feedbackItem}>
              <Text style={styles.feedbackLabel}>Communication</Text>
              <View style={styles.feedbackRating}>
                <Text style={styles.feedbackValue}>4.2</Text>
                <Text style={styles.feedbackMax}>/5</Text>
              </View>
            </View>
            <View style={styles.feedbackItem}>
              <Text style={styles.feedbackLabel}>Leadership</Text>
              <View style={styles.feedbackRating}>
                <Text style={styles.feedbackValue}>4.5</Text>
                <Text style={styles.feedbackMax}>/5</Text>
              </View>
            </View>
            <View style={styles.feedbackItem}>
              <Text style={styles.feedbackLabel}>Delivery</Text>
              <View style={styles.feedbackRating}>
                <Text style={styles.feedbackValue}>4.0</Text>
                <Text style={styles.feedbackMax}>/5</Text>
              </View>
            </View>
            <View style={styles.feedbackItem}>
              <Text style={styles.feedbackLabel}>Collaboration</Text>
              <View style={styles.feedbackRating}>
                <Text style={styles.feedbackValue}>4.3</Text>
                <Text style={styles.feedbackMax}>/5</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Rating Guide */}
        <Card title="Rating Guide" style={styles.section}>
          <View style={styles.ratingGuide}>
            <View style={styles.ratingGuideItem}>
              <View style={[styles.ratingDot, { backgroundColor: Colors.error }]} />
              <Text style={styles.ratingGuideText}>1.0 - 2.0: Needs Improvement</Text>
            </View>
            <View style={styles.ratingGuideItem}>
              <View style={[styles.ratingDot, { backgroundColor: Colors.warning }]} />
              <Text style={styles.ratingGuideText}>2.0 - 3.0: Meets Some Expectations</Text>
            </View>
            <View style={styles.ratingGuideItem}>
              <View style={[styles.ratingDot, { backgroundColor: Colors.success }]} />
              <Text style={styles.ratingGuideText}>3.0 - 4.0: Meets Expectations</Text>
            </View>
            <View style={styles.ratingGuideItem}>
              <View style={[styles.ratingDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.ratingGuideText}>4.0 - 5.0: Exceeds Expectations</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  header: {
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.md,
  },
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  reviewInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  memberName: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  memberRole: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  reviewStatus: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  ratingValue: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.success,
  },
  ratingMax: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  feedbackTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  feedbackDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  feedbackGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  feedbackItem: {
    width: '48%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  feedbackLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  feedbackRating: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  feedbackValue: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.primary,
  },
  feedbackMax: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    marginLeft: 2,
  },
  ratingGuide: {
    gap: Spacing.sm,
  },
  ratingGuideItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.md,
  },
  ratingGuideText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});
