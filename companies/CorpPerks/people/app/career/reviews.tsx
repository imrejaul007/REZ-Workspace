'use client';

import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';

// Types
interface Review {
  id: string;
  cycleId: string;
  cycleName: string;
  reviewerId?: string;
  reviewerName?: string;
  employeeName: string;
  ratings: { category: string; score: number; comment?: string }[];
  feedback?: string;
  strengths?: string;
  improvements?: string;
  recommendations?: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'acknowledged';
  submittedAt?: string;
  overallScore?: number;
}

interface ReviewCycle {
  id: string;
  name: string;
  status: 'active' | 'completed';
  startDate: string;
  endDate: string;
}

// API base URL
const API_BASE = process.env.NEXT_PUBLIC_PERFORMANCE_API || 'http://localhost:4729';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my' | 'team'>('my');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showSelfReview, setShowSelfReview] = useState(false);
  const [selfReviewForm, setSelfReviewForm] = useState({
    achievements: '',
    challenges: '',
    goals: '',
    development: '',
    ratings: { performance: 3, competency: 3, goal: 3, overall: 3 },
  });

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      // In real app, get userId from auth context
      const userId = 'current-user';
      const res = await fetch(`${API_BASE}/api/reviews?employeeId=${userId}`);
      const data = await res.json();

      if (data.success) {
        setReviews(data.data || []);
      }
    } catch {
      // Use mock data as fallback
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch cycles
  const fetchCycles = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reviews/cycles`);
      const data = await res.json();
      if (data.success) {
        setCycles(data.data?.data?.filter((c: ReviewCycle) => c.status === 'active') || []);
      }
    } catch {
      // Use mock data
    }
  }, []);

  useEffect(() => {
    fetchReviews();
    fetchCycles();
  }, [fetchReviews, fetchCycles]);

  const mockReviews: Review[] = [
    {
      id: '1',
      cycleId: '1',
      cycleName: 'Q1 2026 Performance Review',
      employeeName: 'Priya Sharma',
      reviewerName: 'Rahul Singh',
      ratings: [
        { category: 'performance', score: 4.5, comment: 'Consistently exceeds expectations' },
        { category: 'competency', score: 4, comment: 'Strong technical skills' },
        { category: 'goal', score: 5, comment: 'All goals achieved' },
        { category: 'overall', score: 4.5 },
      ],
      feedback: 'Priya has shown exceptional growth this quarter. Her leadership on the dashboard project was outstanding.',
      strengths: 'Technical expertise, problem-solving, mentorship',
      improvements: 'Could take more initiative in cross-team collaboration',
      recommendations: 'Promote to Senior Developer role',
      status: 'acknowledged',
      submittedAt: '2026-03-25',
      overallScore: 4.5,
    },
    {
      id: '2',
      cycleId: '2',
      cycleName: 'Q2 2026 Mid-Year Review',
      employeeName: 'Priya Sharma',
      reviewerName: 'Sneha Patel',
      ratings: [
        { category: 'performance', score: 4, comment: 'Good progress' },
        { category: 'competency', score: 4, comment: 'Improving steadily' },
        { category: 'goal', score: 3, comment: 'On track' },
      ],
      status: 'in_progress',
      overallScore: 3.7,
    },
  ];

  const displayReviews = reviews.length > 0 ? reviews : mockReviews;

  // Calculate stats
  const stats = {
    total: displayReviews.length,
    completed: displayReviews.filter(r => r.status === 'acknowledged').length,
    pending: displayReviews.filter(r => ['pending', 'in_progress'].includes(r.status)).length,
    avgScore: displayReviews
      .filter(r => r.overallScore)
      .reduce((acc, r) => acc + (r.overallScore || 0), 0) / displayReviews.filter(r => r.overallScore).length || 0,
  };

  const renderStars = (score: number, size: number = 16) => {
    const fullStars = Math.floor(score);
    const hasHalf = score % 1 >= 0.5;
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <Text key={i} style={{ fontSize: size, color: i <= fullStars ? '#fbbf24' : '#e5e7eb' }}>
            ★
          </Text>
        ))}
        <Text style={{ marginLeft: 8, color: '#6b7280', fontSize: 14 }}>
          {score.toFixed(1)}
        </Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Performance Reviews</Text>
        <Text style={styles.subtitle}>Track your reviews and submit self-assessments</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#f3e8ff' }]}>
          <Text style={[styles.statValue, { color: '#8b5cf6' }]}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#dcfce7' }]}>
          <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
          <Text style={[styles.statValue, { color: '#fbbf24' }]}>{stats.avgScore.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Avg Score</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && styles.tabActive]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>My Reviews</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'team' && styles.tabActive]}
          onPress={() => setActiveTab('team')}
        >
          <Text style={[styles.tabText, activeTab === 'team' && styles.tabTextActive]}>Team Reviews</Text>
        </TouchableOpacity>
      </View>

      {/* Reviews List */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Review History</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setShowSelfReview(true)}
          >
            <Text style={styles.primaryButtonText}>Submit Self-Review</Text>
          </TouchableOpacity>
        </View>

        {displayReviews.map(review => (
          <TouchableOpacity
            key={review.id}
            style={styles.reviewCard}
            onPress={() => setSelectedReview(review)}
          >
            <View style={styles.reviewHeader}>
              <View>
                <Text style={styles.reviewTitle}>{review.cycleName}</Text>
                <Text style={styles.reviewSubtitle}>
                  Reviewed by {review.reviewerName || 'Pending'}
                </Text>
              </View>
              <View style={[styles.statusBadge, {
                backgroundColor: review.status === 'acknowledged' ? '#dcfce7' :
                               review.status === 'submitted' ? '#dbeafe' : '#fef3c7'
              }]}>
                <Text style={[styles.statusText, {
                  color: review.status === 'acknowledged' ? '#15803d' :
                         review.status === 'submitted' ? '#1d4ed8' : '#b45309'
                }]}>
                  {review.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>

            {review.overallScore && (
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Overall Score</Text>
                {renderStars(review.overallScore)}
              </View>
            )}

            <View style={styles.ratingsPreview}>
              {review.ratings.slice(0, 3).map((rating, i) => (
                <View key={i} style={styles.ratingChip}>
                  <Text style={styles.ratingCategory}>{rating.category}</Text>
                  <Text style={styles.ratingScore}>{rating.score}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Review Detail Modal */}
      <Modal
        visible={!!selectedReview}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedReview(null)}
      >
        {selectedReview && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedReview.cycleName}</Text>
              <TouchableOpacity onPress={() => setSelectedReview(null)}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {selectedReview.overallScore && (
                <View style={styles.overallScoreCard}>
                  <Text style={styles.overallScoreLabel}>Overall Performance</Text>
                  {renderStars(selectedReview.overallScore, 32)}
                </View>
              )}

              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Ratings</Text>
                {selectedReview.ratings.map((rating, i) => (
                  <View key={i} style={styles.ratingRow}>
                    <Text style={styles.ratingLabel}>{rating.category}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Text key={star} style={{ fontSize: 18, color: star <= rating.score ? '#fbbf24' : '#e5e7eb' }}>
                          ★
                        </Text>
                      ))}
                      <Text style={styles.ratingValue}>{rating.score.toFixed(1)}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {selectedReview.feedback && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailTitle}>Manager Feedback</Text>
                  <View style={styles.feedbackCard}>
                    <Text style={styles.feedbackText}>{selectedReview.feedback}</Text>
                  </View>
                </View>
              )}

              {selectedReview.strengths && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailTitle}>Strengths</Text>
                  <Text style={styles.listText}>{selectedReview.strengths}</Text>
                </View>
              )}

              {selectedReview.improvements && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailTitle}>Areas for Improvement</Text>
                  <Text style={styles.listText}>{selectedReview.improvements}</Text>
                </View>
              )}

              {selectedReview.recommendations && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailTitle}>Recommendations</Text>
                  <Text style={styles.listText}>{selectedReview.recommendations}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* Self-Review Modal */}
      <Modal
        visible={showSelfReview}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSelfReview(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Submit Self-Review</Text>
            <TouchableOpacity onPress={() => setShowSelfReview(false)}>
              <Text style={styles.closeButton}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Key Achievements</Text>
              <TextInput
                style={[styles.textArea, { height: 100 }]}
                value={selfReviewForm.achievements}
                onChangeText={(text) => setSelfReviewForm({ ...selfReviewForm, achievements: text })}
                placeholder="Describe your key achievements this review period..."
                multiline
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Challenges Faced</Text>
              <TextInput
                style={[styles.textArea, { height: 100 }]}
                value={selfReviewForm.challenges}
                onChangeText={(text) => setSelfReviewForm({ ...selfReviewForm, challenges: text })}
                placeholder="What challenges did you face and how did you overcome them?"
                multiline
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Goals Progress</Text>
              <TextInput
                style={[styles.textArea, { height: 100 }]}
                value={selfReviewForm.goals}
                onChangeText={(text) => setSelfReviewForm({ ...selfReviewForm, goals: text })}
                placeholder="Update on your goals and key results..."
                multiline
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Development Areas</Text>
              <TextInput
                style={[styles.textArea, { height: 100 }]}
                value={selfReviewForm.development}
                onChangeText={(text) => setSelfReviewForm({ ...selfReviewForm, development: text })}
                placeholder="What skills would you like to develop?"
                multiline
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Self-Rating</Text>
              <View style={styles.ratingGrid}>
                {(['performance', 'competency', 'goal', 'overall'] as const).map(category => (
                  <View key={category} style={styles.ratingItem}>
                    <Text style={styles.ratingItemLabel}>{category}</Text>
                    <View style={styles.ratingButtons}>
                      {[1, 2, 3, 4, 5].map(score => (
                        <TouchableOpacity
                          key={score}
                          style={[
                            styles.ratingButton,
                            selfReviewForm.ratings[category] === score && styles.ratingButtonActive
                          ]}
                          onPress={() => setSelfReviewForm({
                            ...selfReviewForm,
                            ratings: { ...selfReviewForm.ratings, [category]: score }
                          })}
                        >
                          <Text style={[
                            styles.ratingButtonText,
                            selfReviewForm.ratings[category] === score && styles.ratingButtonTextActive
                          ]}>{score}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { marginTop: 20, marginBottom: 40 }]}
              onPress={() => {
                Alert.alert('Success', 'Self-review submitted successfully!');
                setShowSelfReview(false);
              }}
            >
              <Text style={styles.submitButtonText}>Submit Self-Review</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    backgroundColor: '#8b5cf6',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: '#ddd6fe',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#8b5cf6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: 'white',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviewSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  ratingsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  ratingCategory: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  ratingScore: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    color: '#8b5cf6',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 16,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  overallScoreCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  overallScoreLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  detailSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  ratingLabel: {
    fontSize: 14,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    color: '#8b5cf6',
  },
  feedbackCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  feedbackText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
  },
  listText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  textArea: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
  },
  ratingGrid: {
    gap: 16,
  },
  ratingItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
  },
  ratingItemLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  ratingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingButtonActive: {
    backgroundColor: '#8b5cf6',
  },
  ratingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  ratingButtonTextActive: {
    color: 'white',
  },
  submitButton: {
    backgroundColor: '#8b5cf6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
