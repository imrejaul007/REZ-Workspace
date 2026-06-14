// ==========================================
// MyTalent - Career Tab Screen (Career Hub)
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../src/components/Badge';
import { Card, Button, ProgressRing, ScoreCard } from '../../src/components';
import { mockCareerProgress, mockSkillGaps, mockInternalJobs } from '../../src/data/mockData';
import { getCareerProgress, getSkillGapAnalysis, getInternalJobs } from '../../src/services/careerService';

export default function CareerScreen() {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [progress, setProgress] = useState(mockCareerProgress);
  const [skillGaps, setSkillGaps] = useState(mockSkillGaps);
  const [internalJobs, setInternalJobs] = useState(mockInternalJobs);

  useEffect(() => {
    loadCareerData();
  }, []);

  const loadCareerData = async () => {
    const progressResult = await getCareerProgress('EMP001');
    const gapsResult = await getSkillGapAnalysis('EMP001');
    const jobsResult = await getInternalJobs('EMP001');

    if (progressResult.success && progressResult.progress) {
      setProgress(progressResult.progress);
    }
    if (gapsResult.success && gapsResult.gaps) {
      setSkillGaps(gapsResult.gaps);
    }
    if (jobsResult.success && jobsResult.jobs) {
      setInternalJobs(jobsResult.jobs);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCareerData();
    setRefreshing(false);
  };

  const careerActions = [
    {
      id: 'opportunities',
      title: 'Opportunity Hub',
      subtitle: 'Jobs, gigs, mentorship',
      icon: '🎯',
      color: '#EC4899',
      onPress: () => navigation.navigate('Opportunities'),
    },
    {
      id: 'skill-gap',
      title: 'Skill Gap Analysis',
      subtitle: 'Know what to learn',
      icon: '📊',
      color: Colors.primary,
      onPress: () => navigation.navigate('SkillGap'),
    },
    {
      id: 'career-paths',
      title: 'Career Paths',
      subtitle: 'Explore opportunities',
      icon: '🛤️',
      color: Colors.secondary,
      onPress: () => navigation.navigate('CareerPaths'),
    },
    {
      id: 'ai-coach',
      title: 'AI Career Coach',
      subtitle: 'Get personalized advice',
      icon: '🤖',
      color: Colors.success,
      onPress: () => navigation.navigate('AICoach'),
    },
    {
      id: 'mobility',
      title: 'Internal Mobility',
      subtitle: 'Apply for new roles',
      icon: '🔄',
      color: Colors.warning,
      onPress: () => navigation.navigate('InternalMobility'),
    },
  ];

  const getReadinessColor = (readiness: string) => {
    switch (readiness) {
      case 'Ready':
        return Colors.success;
      case 'In Progress':
        return Colors.warning;
      default:
        return Colors.error;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Career Progress Header */}
      <View style={styles.progressHeader}>
        <View style={styles.progressScore}>
          <ProgressRing
            progress={progress.readinessScore}
            size={100}
            strokeWidth={10}
            color={getReadinessColor(progress.promotionReadiness)}
          />
        </View>
        <View style={styles.progressInfo}>
          <Text style={styles.progressTitle}>Career Progress</Text>
          <Text style={styles.progressSubtitle}>
            {progress.promotionReadiness} for promotion
          </Text>
          <View style={[styles.readinessBadge, { backgroundColor: `${getReadinessColor(progress.promotionReadiness)}20` }]}>
            <Text style={[styles.readinessText, { color: getReadinessColor(progress.promotionReadiness) }]}>
              {progress.promotionReadiness}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{progress.yearsInCurrentRole}</Text>
          <Text style={styles.statLabel}>Years in Role</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{progress.avgPerformanceScore}</Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{progress.skillsMatchPercentage}%</Text>
          <Text style={styles.statLabel}>Skills Match</Text>
        </View>
      </View>

      {/* Career Actions */}
      <Text style={styles.sectionTitle}>Career Tools</Text>
      <View style={styles.actionsGrid}>
        {careerActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionCard}
            onPress={action.onPress}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
              <Text style={styles.actionEmoji}>{action.icon}</Text>
            </View>
            <Text style={styles.actionTitle}>{action.title}</Text>
            <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Career Insights */}
      <Card style={styles.insightsCard}>
        <View style={styles.insightsHeader}>
          <Text style={styles.insightsTitle}>Career Insights</Text>
          <Text style={styles.insightsIcon}>💡</Text>
        </View>
        <View style={styles.insightItem}>
          <Text style={styles.insightBullet}>•</Text>
          <Text style={styles.insightText}>
            You have a {progress.readinessScore}% match for your next role
          </Text>
        </View>
        <View style={styles.insightItem}>
          <Text style={styles.insightBullet}>•</Text>
          <Text style={styles.insightText}>
            Focus on developing Cloud Architecture skills for faster growth
          </Text>
        </View>
        <View style={styles.insightItem}>
          <Text style={styles.insightBullet}>•</Text>
          <Text style={styles.insightText}>
            3 internal positions match your profile
          </Text>
        </View>
      </Card>

      {/* Skill Gap Summary */}
      <Card style={styles.skillCard}>
        <View style={styles.skillHeader}>
          <Text style={styles.cardTitle}>Skill Gap Summary</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SkillGap')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        {skillGaps.slice(0, 3).map((gap) => (
          <View key={gap.skill} style={styles.skillItem}>
            <View style={styles.skillInfo}>
              <Text style={styles.skillName}>{gap.skill}</Text>
              <View style={styles.skillLevel}>
                <Text style={styles.skillLevelText}>
                  {gap.currentLevel} → {gap.requiredLevel}
                </Text>
              </View>
            </View>
            <View style={[styles.skillGapBadge, {
              backgroundColor: gap.gap === 'critical' ? `${Colors.error}20` :
                             gap.gap === 'moderate' ? `${Colors.warning}20` :
                             gap.gap === 'minor' ? `${Colors.secondary}20` : `${Colors.success}20`
            }]}>
              <Text style={[styles.skillGapText, {
                color: gap.gap === 'critical' ? Colors.error :
                       gap.gap === 'moderate' ? Colors.warning :
                       gap.gap === 'minor' ? Colors.secondary : Colors.success
              }]}>
                {gap.gap.charAt(0).toUpperCase() + gap.gap.slice(1)}
              </Text>
            </View>
          </View>
        ))}
      </Card>

      {/* Internal Opportunities */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Internal Opportunities</Text>
        <TouchableOpacity onPress={() => navigation.navigate('InternalMobility')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      {internalJobs.slice(0, 2).map((job) => (
        <Card key={job.id} style={styles.jobCard}>
          <View style={styles.jobHeader}>
            <View>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <Text style={styles.jobDept}>{job.department} • {job.location}</Text>
            </View>
            {job.matchScore && (
              <View style={styles.matchBadge}>
                <Text style={styles.matchScore}>{job.matchScore}%</Text>
                <Text style={styles.matchLabel}>match</Text>
              </View>
            )}
          </View>
          <View style={styles.jobMeta}>
            <Text style={styles.jobMetaText}>{job.experience}</Text>
            <Text style={styles.jobMetaDot}>•</Text>
            <Text style={styles.jobMetaText}>{job.type}</Text>
          </View>
          <Button
            title="Apply Internally"
            variant="outline"
            size="sm"
            fullWidth
            onPress={() => navigation.navigate('InternalMobility')}
            style={styles.applyBtn}
          />
        </Card>
      ))}

      {/* Learning Resources */}
      <Card style={styles.learningCard}>
        <Text style={styles.cardTitle}>Recommended Learning</Text>
        <View style={styles.learningItem}>
          <View style={styles.learningIcon}>
            <Text>📚</Text>
          </View>
          <View style={styles.learningInfo}>
            <Text style={styles.learningTitle}>AWS Solutions Architect</Text>
            <Text style={styles.learningProvider}>AWS Training • 40 hours</Text>
          </View>
          <Button
            title="Start"
            variant="ghost"
            size="sm"
            onPress={() => {}}
          />
        </View>
        <View style={[styles.learningItem, styles.learningItemBorder]}>
          <View style={styles.learningIcon}>
            <Text>📚</Text>
          </View>
          <View style={styles.learningInfo}>
            <Text style={styles.learningTitle}>Leadership Fundamentals</Text>
            <Text style={styles.learningProvider}>Coursera • 20 hours</Text>
          </View>
          <Button
            title="Start"
            variant="ghost"
            size="sm"
            onPress={() => {}}
          />
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
  progressHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  progressScore: {
    marginRight: Spacing.lg,
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },
  progressSubtitle: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  readinessBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  readinessText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadow.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  actionCard: {
    width: '48%',
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadow.sm,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  insightsCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  insightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightsTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  insightsIcon: {
    fontSize: 20,
  },
  insightItem: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  insightBullet: {
    color: Colors.primary,
    fontSize: FontSize.md,
    marginRight: Spacing.sm,
  },
  insightText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  skillCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  viewAllText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  skillItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  skillInfo: {
    flex: 1,
  },
  skillName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  skillLevel: {
    flexDirection: 'row',
    marginTop: 4,
  },
  skillLevelText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  skillGapBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  skillGapText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  seeAllText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  jobCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  jobTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  jobDept: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  matchBadge: {
    alignItems: 'center',
  },
  matchScore: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.success,
  },
  matchLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  jobMetaText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  jobMetaDot: {
    marginHorizontal: Spacing.sm,
    color: Colors.textMuted,
  },
  applyBtn: {
    marginTop: Spacing.md,
  },
  learningCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  learningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  learningItemBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
  },
  learningIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  learningInfo: {
    flex: 1,
  },
  learningTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  learningProvider: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
