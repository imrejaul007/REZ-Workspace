// ==========================================
// MyTalent - Skill Gap Analysis Screen
// ==========================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../src/components/Badge';
import { Card, Button, ProgressBar } from '../../src/components';
import { mockSkillGaps } from '../../src/data/mockData';
import { getSkillGapAnalysis } from '../../src/services/careerService';

export default function SkillGapScreen() {
  const [skillGaps, setSkillGaps] = useState(mockSkillGaps);

  useEffect(() => {
    loadSkillGaps();
  }, []);

  const loadSkillGaps = async () => {
    const result = await getSkillGapAnalysis('EMP001');
    if (result.success && result.gaps) {
      setSkillGaps(result.gaps);
    }
  };

  const getGapColor = (gap: string) => {
    switch (gap) {
      case 'critical': return Colors.error;
      case 'moderate': return Colors.warning;
      case 'minor': return Colors.secondary;
      case 'met': return Colors.success;
      default: return Colors.textMuted;
    }
  };

  const getLevelProgress = (level: string) => {
    switch (level) {
      case 'none': return 0;
      case 'basic': return 25;
      case 'intermediate': return 50;
      case 'advanced': return 75;
      case 'expert': return 100;
      default: return 0;
    }
  };

  const criticalGaps = skillGaps.filter((g) => g.gap === 'critical' || g.gap === 'moderate');
  const metSkills = skillGaps.filter((g) => g.gap === 'met');

  return (
    <ScrollView style={styles.container}>
      {/* Summary */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View>
            <Text style={styles.summaryTitle}>Skills Analysis</Text>
            <Text style={styles.summarySubtitle}>{criticalGaps.length} gaps to address</Text>
          </View>
          <View style={styles.summaryStats}>
            <Text style={styles.statsNum}>{skillGaps.length}</Text>
            <Text style={styles.statsLabel}>Total Skills</Text>
          </View>
        </View>
        <View style={styles.summaryProgress}>
          <View style={styles.progressItem}>
            <View style={[styles.progressDot, { backgroundColor: Colors.error }]} />
            <Text style={styles.progressLabel}>Critical: {skillGaps.filter(g => g.gap === 'critical').length}</Text>
          </View>
          <View style={styles.progressItem}>
            <View style={[styles.progressDot, { backgroundColor: Colors.warning }]} />
            <Text style={styles.progressLabel}>Moderate: {skillGaps.filter(g => g.gap === 'moderate').length}</Text>
          </View>
          <View style={styles.progressItem}>
            <View style={[styles.progressDot, { backgroundColor: Colors.success }]} />
            <Text style={styles.progressLabel}>Met: {skillGaps.filter(g => g.gap === 'met').length}</Text>
          </View>
        </View>
      </Card>

      {/* Skills to Develop */}
      <Text style={styles.sectionTitle}>Skills to Develop</Text>
      {criticalGaps.map((gap) => (
        <Card key={gap.skill} style={styles.skillCard}>
          <View style={styles.skillHeader}>
            <View style={styles.skillInfo}>
              <Text style={styles.skillName}>{gap.skill}</Text>
              <View style={[styles.gapBadge, { backgroundColor: `${getGapColor(gap.gap)}20` }]}>
                <Text style={[styles.gapBadgeText, { color: getGapColor(gap.gap) }]}>
                  {gap.gap.charAt(0).toUpperCase() + gap.gap.slice(1)} Gap
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.levelContainer}>
            <View style={styles.levelRow}>
              <Text style={styles.levelLabel}>Current</Text>
              <Text style={styles.levelValue}>{gap.currentLevel}</Text>
            </View>
            <ProgressBar
              progress={getLevelProgress(gap.currentLevel)}
              color={Colors.warning}
              height={8}
              style={styles.levelBar}
            />
            <View style={styles.levelRow}>
              <Text style={styles.levelLabel}>Required</Text>
              <Text style={styles.levelValue}>{gap.requiredLevel}</Text>
            </View>
            <ProgressBar
              progress={getLevelProgress(gap.requiredLevel)}
              color={Colors.success}
              height={8}
              style={styles.levelBar}
            />
          </View>
          {gap.recommendedCourses.length > 0 && (
            <View style={styles.coursesSection}>
              <Text style={styles.coursesTitle}>Recommended Courses</Text>
              {gap.recommendedCourses.map((course) => (
                <View key={course.id} style={styles.courseItem}>
                  <View style={styles.courseIcon}>
                    <Text>📚</Text>
                  </View>
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseName}>{course.title}</Text>
                    <Text style={styles.courseMeta}>{course.provider} • {course.duration}</Text>
                  </View>
                  <Button
                    title="Start"
                    variant="outline"
                    size="sm"
                    onPress={() => Alert.alert('Coming Soon', 'Course enrollment will be available soon!')}
                  />
                </View>
              ))}
            </View>
          )}
        </Card>
      ))}

      {/* Skills Met */}
      <Text style={styles.sectionTitle}>Skills Met</Text>
      {metSkills.map((skill) => (
        <Card key={skill.skill} style={styles.metCard}>
          <View style={styles.metHeader}>
            <View style={styles.metCheck}>
              <Text style={styles.metCheckIcon}>✓</Text>
            </View>
            <View style={styles.metInfo}>
              <Text style={styles.metName}>{skill.skill}</Text>
              <Text style={styles.metLevel}>{skill.currentLevel}</Text>
            </View>
          </View>
        </Card>
      ))}

      {/* Learning Budget */}
      <Card style={styles.budgetCard}>
        <View style={styles.budgetHeader}>
          <Text style={styles.budgetIcon}>💰</Text>
          <View style={styles.budgetInfo}>
            <Text style={styles.budgetTitle}>Learning Budget</Text>
            <Text style={styles.budgetSubtitle}>₹50,000 available</Text>
          </View>
        </View>
        <View style={styles.budgetUsage}>
          <ProgressBar progress={30} color={Colors.primary} height={10} />
          <Text style={styles.budgetText}>₹15,000 used of ₹50,000</Text>
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
  summaryCard: {
    margin: Spacing.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  summarySubtitle: {
    fontSize: FontSize.md,
    color: Colors.error,
    marginTop: 4,
  },
  summaryStats: {
    alignItems: 'center',
  },
  statsNum: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  statsLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  summaryProgress: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  progressLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  skillCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  skillHeader: {
    marginBottom: Spacing.md,
  },
  skillInfo: {},
  skillName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  gapBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginTop: 4,
  },
  gapBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  levelContainer: {
    marginTop: Spacing.sm,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  levelLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  levelValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  levelBar: {
    marginBottom: Spacing.md,
  },
  coursesSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  coursesTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  courseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  courseIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  courseMeta: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  metCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  metHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  metCheckIcon: {
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
  },
  metInfo: {},
  metName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  metLevel: {
    fontSize: FontSize.sm,
    color: Colors.success,
    marginTop: 2,
  },
  budgetCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  budgetInfo: {},
  budgetTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  budgetSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.success,
    marginTop: 2,
  },
  budgetUsage: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  budgetText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
