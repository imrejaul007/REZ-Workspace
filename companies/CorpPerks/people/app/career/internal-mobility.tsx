// ==========================================
// MyTalent - Internal Mobility Screen
// ==========================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../src/components/Badge';
import { Card, Button, StatusBadge } from '../../src/components';
import { mockInternalJobs } from '../../src/data/mockData';
import { getInternalJobs, applyForJob, getMyApplications } from '../../src/services/careerService';

export default function InternalMobilityScreen() {
  const [jobs, setJobs] = useState(mockInternalJobs);
  const [activeTab, setActiveTab] = useState<'openings' | 'applications'>('openings');
  const [myApplications, setMyApplications] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const jobsResult = await getInternalJobs('EMP001');
    if (jobsResult.success && jobsResult.jobs) {
      setJobs(jobsResult.jobs);
    }
    const appsResult = await getMyApplications('EMP001');
    if (appsResult.success && appsResult.applications) {
      setMyApplications(appsResult.applications);
    }
  };

  const handleApply = async (jobId: string, jobTitle: string) => {
    Alert.alert(
      'Apply for Position',
      `Apply for ${jobTitle}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: async () => {
            const result = await applyForJob('EMP001', jobId);
            if (result.success) {
              Alert.alert('Success', 'Your application has been submitted!');
              loadData();
            }
          },
        },
      ]
    );
  };

  const departments = [...new Set(jobs.map((j) => j.department))];

  return (
    <ScrollView style={styles.container}>
      {/* Stats */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{jobs.length}</Text>
          <Text style={styles.statLabel}>Open Positions</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{myApplications.length}</Text>
          <Text style={styles.statLabel}>My Applications</Text>
        </Card>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'openings' && styles.tabActive]}
          onPress={() => setActiveTab('openings')}
        >
          <Text style={[styles.tabText, activeTab === 'openings' && styles.tabTextActive]}>
            Open Positions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'applications' && styles.tabActive]}
          onPress={() => setActiveTab('applications')}
        >
          <Text style={[styles.tabText, activeTab === 'applications' && styles.tabTextActive]}>
            My Applications
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'openings' ? (
        <>
          {/* Departments */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.departmentsScroll}
            contentContainerStyle={styles.departmentsContainer}
          >
            <TouchableOpacity style={[styles.deptChip, styles.deptChipActive]}>
              <Text style={[styles.deptChipText, styles.deptChipTextActive]}>All</Text>
            </TouchableOpacity>
            {departments.map((dept) => (
              <TouchableOpacity key={dept} style={styles.deptChip}>
                <Text style={styles.deptChipText}>{dept}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Jobs */}
          {jobs.map((job) => (
            <Card key={job.id} style={styles.jobCard}>
              <View style={styles.jobHeader}>
                <View style={styles.jobInfo}>
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
                <View style={styles.metaItem}>
                  <Text style={styles.metaIcon}>💼</Text>
                  <Text style={styles.metaText}>{job.experience}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaIcon}>⏰</Text>
                  <Text style={styles.metaText}>{job.type}</Text>
                </View>
              </View>

              <Text style={styles.jobDesc} numberOfLines={2}>
                {job.description}
              </Text>

              <View style={styles.requirements}>
                {job.requirements.slice(0, 3).map((req, i) => (
                  <View key={i} style={styles.reqTag}>
                    <Text style={styles.reqText}>{req}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.jobFooter}>
                <Text style={styles.postedDate}>Posted: {job.postedOn}</Text>
                <Button
                  title="Apply"
                  variant="primary"
                  size="sm"
                  onPress={() => handleApply(job.id, job.title)}
                />
              </View>
            </Card>
          ))}
        </>
      ) : (
        <>
          {/* My Applications */}
          {myApplications.length > 0 ? (
            myApplications.map((app) => (
              <Card key={app.id} style={styles.appCard}>
                <View style={styles.appHeader}>
                  <View>
                    <Text style={styles.appTitle}>{app.jobTitle}</Text>
                    <Text style={styles.appDept}>{app.department}</Text>
                  </View>
                  <StatusBadge status={app.status.toLowerCase().replace(' ', '-')} />
                </View>
                <View style={styles.appMeta}>
                  <Text style={styles.appDate}>Applied: {app.appliedOn}</Text>
                </View>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Applications Yet</Text>
              <Text style={styles.emptyDesc}>
                Your internal job applications will appear here
              </Text>
            </Card>
          )}
        </>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  statsRow: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.textInverse,
    fontWeight: FontWeight.semibold,
  },
  departmentsScroll: {
    marginTop: Spacing.md,
  },
  departmentsContainer: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  deptChip: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  deptChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  deptChipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  deptChipTextActive: {
    color: Colors.textInverse,
    fontWeight: FontWeight.semibold,
  },
  jobCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  jobInfo: {},
  jobTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  jobDept: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
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
    marginTop: Spacing.md,
    gap: Spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  metaText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  jobDesc: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    lineHeight: 22,
  },
  requirements: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  reqTag: {
    backgroundColor: Colors.backgroundDark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  reqText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  postedDate: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  appCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  appTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  appDept: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  appMeta: {
    marginTop: Spacing.md,
  },
  appDate: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  emptyCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  emptyDesc: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
