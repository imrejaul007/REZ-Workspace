// ==========================================
// MyTalent - Career Paths Screen
// ==========================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../src/components/Badge';
import { Card, Button, ProgressBar } from '../../src/components';
import { mockCareerPath, mockSkillGaps } from '../../src/data/mockData';
import { getCareerPaths } from '../../src/services/careerService';

export default function CareerPathsScreen() {
  const [careerPath, setCareerPath] = useState(mockCareerPath);

  useEffect(() => {
    loadCareerPaths();
  }, []);

  const loadCareerPaths = async () => {
    const result = await getCareerPaths('EMP001');
    if (result.success && result.path) {
      setCareerPath(result.path);
    }
  };

  const getProbabilityColor = (prob: number) => {
    if (prob >= 80) return Colors.success;
    if (prob >= 60) return Colors.warning;
    return Colors.error;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Current Role */}
      <Card style={styles.currentCard}>
        <View style={styles.currentHeader}>
          <Text style={styles.currentLabel}>Current Role</Text>
        </View>
        <Text style={styles.currentRole}>{careerPath.currentRole}</Text>
        <View style={styles.currentMeta}>
          <Text style={styles.metaText}>2.5 years in role</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>4.2/5 rating</Text>
        </View>
      </Card>

      {/* Next Possible Roles */}
      <Text style={styles.sectionTitle}>Next Possible Roles</Text>
      {careerPath.nextRoles.map((role, index) => (
        <Card key={index} style={styles.roleCard}>
          <View style={styles.roleHeader}>
            <View style={styles.roleNumber}>
              <Text style={styles.roleNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleName}>{role.role}</Text>
              <Text style={styles.roleTime}>{role.timeToPromote}</Text>
            </View>
            <View style={[styles.probBadge, { backgroundColor: `${getProbabilityColor(role.probability)}20` }]}>
              <Text style={[styles.probText, { color: getProbabilityColor(role.probability) }]}>
                {role.probability}%
              </Text>
            </View>
          </View>

          <View style={styles.skillsSection}>
            <Text style={styles.skillsTitle}>Skills Required</Text>
            <View style={styles.skillsTags}>
              {role.skillsRequired.map((skill, i) => (
                <View key={i} style={styles.skillTag}>
                  <Text style={styles.skillTagText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>

          <ProgressBar
            progress={role.probability}
            color={getProbabilityColor(role.probability)}
            height={6}
            style={styles.probBar}
          />

          <Button
            title="View Path"
            variant="outline"
            size="sm"
            fullWidth
            onPress={() => Alert.alert('Coming Soon', 'Career path visualization will be available soon!')}
            style={styles.viewBtn}
          />
        </Card>
      ))}

      {/* Career Timeline */}
      <Text style={styles.sectionTitle}>Your Career Timeline</Text>
      <Card style={styles.timelineCard}>
        {careerPath.timeline.map((item, index) => (
          <View key={index}>
            <View style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={styles.timelineDot} />
                {index < careerPath.timeline.length - 1 && <View style={styles.timelineLine} />}
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineYear}>{item.year}</Text>
                <Text style={styles.timelineRole}>{item.expectedRole}</Text>
              </View>
            </View>
          </View>
        ))}
      </Card>

      {/* Development Plan */}
      <Card style={styles.planCard}>
        <View style={styles.planHeader}>
          <Text style={styles.planIcon}>📋</Text>
          <View style={styles.planInfo}>
            <Text style={styles.planTitle}>Personal Development Plan</Text>
            <Text style={styles.planSubtitle}>Based on your career goals</Text>
          </View>
        </View>
        <View style={styles.planItems}>
          <View style={styles.planItem}>
            <Text style={styles.planItemNum}>1</Text>
            <Text style={styles.planItemText}>Complete Cloud Architecture course</Text>
          </View>
          <View style={styles.planItem}>
            <Text style={styles.planItemNum}>2</Text>
            <Text style={styles.planItemText}>Lead a cross-functional project</Text>
          </View>
          <View style={styles.planItem}>
            <Text style={styles.planItemNum}>3</Text>
            <Text style={styles.planItemText}>Build presentation skills</Text>
          </View>
        </View>
        <Button
          title="Get Full Plan"
          variant="primary"
          fullWidth
          onPress={() => Alert.alert('Coming Soon', 'Full development plan will be available soon!')}
          style={styles.planBtn}
        />
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
  currentCard: {
    margin: Spacing.md,
    backgroundColor: Colors.primary,
  },
  currentHeader: {
    marginBottom: Spacing.xs,
  },
  currentLabel: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  currentRole: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },
  currentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  metaText: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  metaDot: {
    marginHorizontal: Spacing.sm,
    color: 'rgba(255,255,255,0.5)',
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  roleCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  roleNumberText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },
  roleInfo: {
    flex: 1,
  },
  roleName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  roleTime: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  probBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  probText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  skillsSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  skillsTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  skillsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  skillTag: {
    backgroundColor: Colors.backgroundDark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  skillTagText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  probBar: {
    marginTop: Spacing.md,
  },
  viewBtn: {
    marginTop: Spacing.md,
  },
  timelineCard: {
    marginHorizontal: Spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineLeft: {
    width: 30,
    alignItems: 'center',
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: Spacing.lg,
  },
  timelineYear: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  timelineRole: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  planCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  planIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  planInfo: {},
  planTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  planSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  planItems: {},
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  planItemNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
    marginRight: Spacing.sm,
  },
  planItemText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  planBtn: {
    marginTop: Spacing.md,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
