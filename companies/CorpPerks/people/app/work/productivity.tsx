// ==========================================
// MyTalent - Productivity Screen
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../src/components/Badge';
import { Card, ProgressRing } from '../../src/components';
import { mockProductivityStats } from '../../src/data/mockData';
import { getProductivityStats } from '../../src/services/careerService';

export default function ProductivityScreen() {
  const [stats, setStats] = useState(mockProductivityStats);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const result = await getProductivityStats('EMP001');
    // Note: This would be a proper API call
    // For now, using mock data
  };

  const scoreCards = [
    {
      score: stats.overallScore,
      title: 'Overall',
      color: Colors.primary,
    },
    {
      score: stats.attendanceScore,
      title: 'Attendance',
      color: Colors.success,
    },
    {
      score: stats.taskCompletionScore,
      title: 'Task Completion',
      color: Colors.secondary,
    },
    {
      score: stats.deadlineAdherenceScore,
      title: 'Deadline Adherence',
      color: Colors.warning,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Overall Productivity Score */}
      <Card style={styles.mainScoreCard}>
        <View style={styles.mainScoreContent}>
          <ProgressRing
            progress={stats.overallScore}
            size={140}
            strokeWidth={14}
            color={stats.overallScore >= 80 ? Colors.success : stats.overallScore >= 60 ? Colors.warning : Colors.error}
          />
          <View style={styles.mainScoreInfo}>
            <Text style={styles.mainScoreTitle}>Productivity Index</Text>
            <Text style={styles.mainScoreSubtitle}>
              {stats.overallScore >= 80 ? 'Excellent' : stats.overallScore >= 60 ? 'Good' : 'Needs Improvement'}
            </Text>
            <View style={styles.teamRankBadge}>
              <Text style={styles.teamRankText}>
                Team Rank: #{stats.teamRanking.position}/{stats.teamRanking.total}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Score Breakdown */}
      <Text style={styles.sectionTitle}>Score Breakdown</Text>
      <View style={styles.scoresGrid}>
        {scoreCards.map((card) => (
          <Card key={card.title} style={styles.scoreCard}>
            <ProgressRing
              progress={card.score}
              size={60}
              strokeWidth={6}
              color={card.color}
            />
            <Text style={styles.scoreCardTitle}>{card.title}</Text>
          </Card>
        ))}
      </View>

      {/* Weekly Insights */}
      <Text style={styles.sectionTitle}>Weekly Insights</Text>
      <Card style={styles.chartCard}>
        <View style={styles.chart}>
          {stats.weeklyInsights.map((day, index) => (
            <View key={day.day} style={styles.chartBar}>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${day.productivity}%`,
                      backgroundColor: day.productivity >= 80 ? Colors.success :
                                     day.productivity >= 60 ? Colors.warning : Colors.error,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{day.day}</Text>
            </View>
          ))}
        </View>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
            <Text style={styles.legendText}>80%+ Excellent</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
            <Text style={styles.legendText}>60-79% Good</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.error }]} />
            <Text style={styles.legendText}>&lt;60% Needs Work</Text>
          </View>
        </View>
      </Card>

      {/* Team Ranking */}
      <Text style={styles.sectionTitle}>Team Ranking</Text>
      <Card style={styles.rankingCard}>
        <View style={styles.rankingHeader}>
          <View style={styles.rankingPosition}>
            <Text style={styles.rankingNum}>#{stats.teamRanking.position}</Text>
            <Text style={styles.rankingTotal}>of {stats.teamRanking.total}</Text>
          </View>
          <View style={styles.rankingChange}>
            <Text style={styles.rankingChangeText}>{stats.teamRanking.change}</Text>
          </View>
        </View>
        <View style={styles.rankingBar}>
          <View
            style={[
              styles.rankingProgress,
              {
                width: `${((stats.teamRanking.total - stats.teamRanking.position + 1) / stats.teamRanking.total) * 100}%`,
              },
            ]}
          />
          <View
            style={[
              styles.rankingMarker,
              {
                left: `${((stats.teamRanking.total - stats.teamRanking.position + 1) / stats.teamRanking.total) * 100}%`,
              },
            ]}
          />
        </View>
        <View style={styles.rankingPercentile}>
          <Text style={styles.percentileValue}>Top {(100 - ((stats.teamRanking.position / stats.teamRanking.total) * 100)).toFixed(0)}%</Text>
          <Text style={styles.percentileLabel}>Percentile</Text>
        </View>
      </Card>

      {/* Tips */}
      <Text style={styles.sectionTitle}>Productivity Tips</Text>
      <Card style={styles.tipsCard}>
        <View style={styles.tipItem}>
          <Text style={styles.tipIcon}>💡</Text>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Peak Hours Identified</Text>
            <Text style={styles.tipDesc}>Your most productive time is 10 AM - 12 PM. Schedule important tasks during this window.</Text>
          </View>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipIcon}>🎯</Text>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Focus on Deadlines</Text>
            <Text style={styles.tipDesc}>Improving deadline adherence by 10% can boost your overall score by 15 points.</Text>
          </View>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipIcon}>📊</Text>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Weekly Review</Text>
            <Text style={styles.tipDesc}>Take 15 minutes every Friday to review the week's achievements and plan for next week.</Text>
          </View>
        </View>
      </Card>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mainScoreCard: {
    margin: Spacing.md,
  },
  mainScoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainScoreInfo: {
    marginLeft: Spacing.lg,
    flex: 1,
  },
  mainScoreTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  mainScoreSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  teamRankBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  teamRankText: {
    fontSize: FontSize.sm,
    color: Colors.textInverse,
    fontWeight: FontWeight.semibold,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  scoresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  scoreCard: {
    width: '48%',
    alignItems: 'center',
    padding: Spacing.md,
  },
  scoreCardTitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  chartCard: {
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  chartBar: {
    alignItems: 'center',
  },
  barContainer: {
    width: 30,
    height: 100,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: BorderRadius.md,
  },
  barLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  rankingCard: {
    marginHorizontal: Spacing.md,
  },
  rankingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankingPosition: {},
  rankingNum: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  rankingTotal: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  rankingChange: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  rankingChangeText: {
    fontSize: FontSize.sm,
    color: Colors.success,
    fontWeight: FontWeight.semibold,
  },
  rankingBar: {
    height: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: 4,
    marginTop: Spacing.md,
    position: 'relative',
  },
  rankingProgress: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  rankingMarker: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.card,
    marginLeft: -8,
  },
  rankingPercentile: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  percentileValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  percentileLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  tipsCard: {
    marginHorizontal: Spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  tipIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  tipDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
