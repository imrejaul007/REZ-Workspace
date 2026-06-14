// ==========================================
// MyTalent - AI Insights Dashboard
// Personalized insights and weekly digest
// ==========================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAIAgents } from '../src/hooks/useAIAgents';
import { useAppStore } from '../src/store/useAppStore';
import { DailyInsight, WeeklyDigest } from '../src/services/aiAgentsService';

// ==========================================
// Constants
// ==========================================

const { width } = Dimensions.get('window');

const COLORS = {
  background: '#0F172A',
  card: '#1E293B',
  cardLight: '#334155',
  primary: '#6366F1',
  primaryLight: '#818CF8',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  border: '#334155',
};

// ==========================================
// Types
// ==========================================

type InsightType = 'productivity' | 'career' | 'wellness' | 'financial' | 'learning';

interface InsightCardProps {
  insight: DailyInsight;
  index: number;
}

interface ScoreRingProps {
  score: number;
  color: string;
  size?: number;
  label: string;
}

// ==========================================
// Score Ring Component
// ==========================================

const ScoreRing: React.FC<ScoreRingProps> = ({ score, color, size = 100, label }) => {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <View style={[styles.scoreRing, { width: size, height: size }]}>
      <View style={styles.scoreRingInner}>
        <Text style={[styles.scoreValue, { color }]}>{score}%</Text>
        <Text style={styles.scoreLabel}>{label}</Text>
      </View>
      <View style={[styles.scoreRingBackground, {
        width: size - 4,
        height: size - 4,
        borderRadius: (size - 4) / 2,
        borderWidth: 4,
        borderColor: color + '30',
      }]} />
    </View>
  );
};

// ==========================================
// Insight Card Component
// ==========================================

const InsightCard: React.FC<InsightCardProps> = ({ insight, index }) => {
  const getIcon = (type: InsightType) => {
    switch (type) {
      case 'productivity': return 'flash';
      case 'career': return 'trending-up';
      case 'wellness': return 'heart';
      case 'financial': return 'cash';
      case 'learning': return 'book';
      default: return 'bulb';
    }
  };

  const getColor = (type: InsightType) => {
    switch (type) {
      case 'productivity': return COLORS.warning;
      case 'career': return COLORS.primary;
      case 'wellness': return COLORS.error;
      case 'financial': return COLORS.success;
      case 'learning': return '#8B5CF6';
      default: return COLORS.textMuted;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return COLORS.error;
      case 'medium': return COLORS.warning;
      default: return COLORS.textMuted;
    }
  };

  const color = getColor(insight.type);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(400)}
      style={styles.insightCard}
    >
      <View style={[styles.insightHeader, { borderLeftColor: color }]}>
        <View style={[styles.insightIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={getIcon(insight.type) as any} size={20} color={color} />
        </View>
        <View style={styles.insightHeaderContent}>
          <Text style={styles.insightTitle}>{insight.title}</Text>
          <View style={styles.insightMeta}>
            <Text style={[styles.insightType, { color }]}>
              {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
            </Text>
            <Text style={styles.insightDot}>•</Text>
            <Text style={[styles.insightPriority, { color: getPriorityColor(insight.priority) }]}>
              {insight.priority} priority
            </Text>
          </View>
        </View>
        {insight.score && (
          <View style={[styles.scoreBadge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.scoreBadgeText, { color }]}>{insight.score}%</Text>
          </View>
        )}
      </View>

      <Text style={styles.insightDescription}>{insight.description}</Text>

      {insight.trend && (
        <View style={styles.trendContainer}>
          <Ionicons
            name={insight.trend === 'improving' ? 'arrow-up' : insight.trend === 'declining' ? 'arrow-down' : 'remove'}
            size={16}
            color={insight.trend === 'improving' ? COLORS.success : insight.trend === 'declining' ? COLORS.error : COLORS.textMuted}
          />
          <Text style={styles.trendText}>
            {insight.trend === 'improving' ? 'Improving' : insight.trend === 'declining' ? 'Needs attention' : 'Stable'}
          </Text>
        </View>
      )}

      {insight.recommendations.length > 0 && (
        <View style={styles.recommendationsContainer}>
          <Text style={styles.recommendationsTitle}>Recommendations:</Text>
          {insight.recommendations.slice(0, 3).map((rec, i) => (
            <View key={i} style={styles.recommendationItem}>
              <View style={[styles.recommendationDot, { backgroundColor: color }]} />
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );
};

// ==========================================
// Summary Card Component
// ==========================================

interface SummaryCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
  trend?: 'up' | 'down' | 'stable';
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, color, trend }) => (
  <View style={[styles.summaryCard, { borderTopColor: color }]}>
    <View style={[styles.summaryIcon, { backgroundColor: color + '20' }]}>
      <Text style={styles.summaryIconText}>{icon}</Text>
    </View>
    <View style={styles.summaryContent}>
      <Text style={styles.summaryValue}>{value}%</Text>
      <Text style={styles.summaryTitle}>{title}</Text>
    </View>
    {trend && (
      <Ionicons
        name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove'}
        size={20}
        color={trend === 'up' ? COLORS.success : trend === 'down' ? COLORS.error : COLORS.textMuted}
      />
    )}
  </View>
);

// ==========================================
// Weekly Summary Component
// ==========================================

interface WeeklySummaryProps {
  digest: WeeklyDigest;
}

const WeeklySummary: React.FC<WeeklySummaryProps> = ({ digest }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Animated.View entering={FadeInDown.duration(500)} style={styles.weeklyCard}>
      <View style={styles.weeklyHeader}>
        <Text style={styles.weeklyTitle}>Weekly Summary</Text>
        <Text style={styles.weeklyDates}>
          {formatDate(digest.weekStart)} - {formatDate(digest.weekEnd)}
        </Text>
      </View>

      <View style={styles.summaryGrid}>
        <SummaryCard
          title="Productivity"
          value={digest.summary.productivity}
          icon="⚡"
          color={COLORS.warning}
          trend="up"
        />
        <SummaryCard
          title="Learning"
          value={digest.summary.learning}
          icon="📚"
          color={COLORS.success}
          trend="stable"
        />
        <SummaryCard
          title="Wellness"
          value={digest.summary.wellness}
          icon="💚"
          color={COLORS.error}
          trend="down"
        />
        <SummaryCard
          title="Career"
          value={digest.summary.careerProgress}
          icon="📈"
          color={COLORS.primary}
          trend="up"
        />
      </View>

      {digest.highlights.length > 0 && (
        <View style={styles.highlightsContainer}>
          <Text style={styles.highlightsTitle}>Highlights</Text>
          {digest.highlights.map((highlight, index) => (
            <View key={index} style={styles.highlightItem}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.highlightText}>{highlight}</Text>
            </View>
          ))}
        </View>
      )}

      {digest.upcomingGoals.length > 0 && (
        <View style={styles.goalsContainer}>
          <Text style={styles.goalsTitle}>Upcoming Goals</Text>
          {digest.upcomingGoals.map((goal, index) => (
            <View key={index} style={styles.goalItem}>
              <View style={styles.goalBullet} />
              <Text style={styles.goalText}>{goal}</Text>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );
};

// ==========================================
// Main Insights Dashboard
// ==========================================

export default function AIInsightsScreen() {
  const router = useRouter();
  const {
    dailyInsights,
    weeklyDigest,
    isLoadingInsights,
    loadInsights,
  } = useAIAgents();

  const employee = useAppStore((state) => state.user.employee);

  // Load insights on mount
  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  // Handle back
  const handleBack = () => {
    router.back();
  };

  // Filter insights by type
  const getInsightsByType = (type: InsightType) => {
    return dailyInsights.filter(i => i.type === type);
  };

  // Overall score
  const overallScore = dailyInsights.length > 0
    ? Math.round(dailyInsights.reduce((acc, i) => acc + (i.score || 70), 0) / dailyInsights.length)
    : 75;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Insights</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadInsights}>
          <Ionicons name="refresh" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingInsights}
            onRefresh={loadInsights}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Welcome Section */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Hello, {employee?.name?.split(' ')[0] || 'there'}!
          </Text>
          <Text style={styles.welcomeSubtext}>
            Here's your personalized insights for today
          </Text>
        </Animated.View>

        {/* Overall Score */}
        <Animated.View entering={FadeInUp.delay(100).duration(500)}>
          <LinearGradient
            colors={[COLORS.primary + '30', COLORS.primary + '10']}
            style={styles.overallCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.overallContent}>
              <View style={styles.overallScoreContainer}>
                <Text style={styles.overallScoreLabel}>Overall Score</Text>
                <Text style={styles.overallScoreValue}>{overallScore}</Text>
              </View>
              <View style={styles.overallStats}>
                <View style={styles.overallStat}>
                  <Text style={styles.overallStatValue}>{dailyInsights.length}</Text>
                  <Text style={styles.overallStatLabel}>Insights</Text>
                </View>
                <View style={styles.overallStatDivider} />
                <View style={styles.overallStat}>
                  <Text style={styles.overallStatValue}>
                    {dailyInsights.filter(i => i.priority === 'high').length}
                  </Text>
                  <Text style={styles.overallStatLabel}>Priority</Text>
                </View>
                <View style={styles.overallStatDivider} />
                <View style={styles.overallStat}>
                  <Text style={styles.overallStatValue}>
                    {weeklyDigest?.highlights.length || 0}
                  </Text>
                  <Text style={styles.overallStatLabel}>Wins</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Weekly Summary */}
        {weeklyDigest && (
          <WeeklySummary digest={weeklyDigest} />
        )}

        {/* Productivity Insights */}
        {getInsightsByType('productivity').length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: COLORS.warning + '20' }]}>
                <Ionicons name="flash" size={18} color={COLORS.warning} />
              </View>
              <Text style={styles.sectionTitle}>Productivity</Text>
            </View>
            {getInsightsByType('productivity').map((insight, index) => (
              <InsightCard key={insight.id} insight={insight} index={index} />
            ))}
          </View>
        )}

        {/* Career Insights */}
        {getInsightsByType('career').length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: COLORS.primary + '20' }]}>
                <Ionicons name="trending-up" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.sectionTitle}>Career</Text>
            </View>
            {getInsightsByType('career').map((insight, index) => (
              <InsightCard key={insight.id} insight={insight} index={index} />
            ))}
          </View>
        )}

        {/* Learning Insights */}
        {getInsightsByType('learning').length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#8B5CF6' + '20' }]}>
                <Ionicons name="book" size={18} color="#8B5CF6" />
              </View>
              <Text style={styles.sectionTitle}>Learning</Text>
            </View>
            {getInsightsByType('learning').map((insight, index) => (
              <InsightCard key={insight.id} insight={insight} index={index} />
            ))}
          </View>
        )}

        {/* Financial Insights */}
        {getInsightsByType('financial').length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: COLORS.success + '20' }]}>
                <Ionicons name="cash" size={18} color={COLORS.success} />
              </View>
              <Text style={styles.sectionTitle}>Financial</Text>
            </View>
            {getInsightsByType('financial').map((insight, index) => (
              <InsightCard key={insight.id} insight={insight} index={index} />
            ))}
          </View>
        )}

        {/* Wellness Insights */}
        {getInsightsByType('wellness').length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: COLORS.error + '20' }]}>
                <Ionicons name="heart" size={18} color={COLORS.error} />
              </View>
              <Text style={styles.sectionTitle}>Wellness</Text>
            </View>
            {getInsightsByType('wellness').map((insight, index) => (
              <InsightCard key={insight.id} insight={insight} index={index} />
            ))}
          </View>
        )}

        {/* All Insights (if not filtered) */}
        {dailyInsights.length === 0 && !isLoadingInsights && (
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No insights yet</Text>
            <Text style={styles.emptySubtext}>
              Start chatting with our AI agents to get personalized insights
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/ai-hub')}
            >
              <Text style={styles.emptyButtonText}>Chat with AI</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// Styles
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  refreshButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  welcomeSection: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 15,
    color: COLORS.textMuted,
  },
  overallCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  overallContent: {
    alignItems: 'center',
  },
  overallScoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  overallScoreLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  overallScoreValue: {
    fontSize: 56,
    fontWeight: '800',
    color: COLORS.primary,
  },
  overallStats: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-around',
  },
  overallStat: {
    alignItems: 'center',
  },
  overallStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  overallStatLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  overallStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  weeklyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  weeklyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weeklyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  weeklyDates: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    minWidth: (width - 60) / 2,
    backgroundColor: COLORS.cardLight,
    borderRadius: 12,
    padding: 12,
    borderTopWidth: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryIconText: {
    fontSize: 16,
  },
  summaryContent: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  summaryTitle: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  highlightsContainer: {
    backgroundColor: COLORS.cardLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  highlightsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  highlightText: {
    fontSize: 13,
    color: COLORS.text,
    flex: 1,
  },
  goalsContainer: {
    backgroundColor: COLORS.cardLight,
    borderRadius: 10,
    padding: 12,
  },
  goalsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  goalBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  goalText: {
    fontSize: 13,
    color: COLORS.text,
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  insightCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingLeft: 12,
    borderLeftWidth: 3,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightHeaderContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  insightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  insightType: {
    fontSize: 12,
    fontWeight: '500',
  },
  insightDot: {
    color: COLORS.textMuted,
  },
  insightPriority: {
    fontSize: 12,
    fontWeight: '500',
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  insightDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 12,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  trendText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  recommendationsContainer: {
    backgroundColor: COLORS.cardLight,
    borderRadius: 10,
    padding: 12,
  },
  recommendationsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  recommendationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  recommendationText: {
    fontSize: 13,
    color: COLORS.text,
    flex: 1,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  scoreRing: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreRingInner: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  scoreRingBackground: {
    position: 'absolute',
  },
});
