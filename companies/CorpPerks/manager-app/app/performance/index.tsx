// ==========================================
// CorpPerks Manager App - Performance Overview Screen
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
import { useNavigation } from '@react-navigation/native';
import { Card, Avatar, Badge, ProgressBar, StatCard } from '../src/components';
import { api } from '../src/services/api';
import { useStore } from '../src/store';
import {
  Colors,
  Spacing,
  FontSize,
  BorderRadius,
  formatDate,
} from '../src/utils/theme';
import { OKR, PerformanceReview, PromotionCandidate } from '../src/types';

export default function PerformanceOverviewScreen() {
  const navigation = useNavigation<any>();
  const { teamMembers, teamOKRs, setTeamOKRs } = useStore();
  const [okrs, setOkrs] = useState<OKR[]>([]);
  const [promotionCandidates, setPromotionCandidates] = useState<PromotionCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'okrs' | 'promotions'>('overview');

  const loadData = async () => {
    try {
      const [okrRes, promotionRes] = await Promise.all([
        api.getTeamOKRs(),
        api.getPromotionCandidates(),
      ]);

      if (okrRes.success && okrRes.data) {
        setOkrs(okrRes.data);
        setTeamOKRs(okrRes.data);
      }

      if (promotionRes.success && promotionRes.data) {
        setPromotionCandidates(promotionRes.data.map((c) => ({
          employeeId: c.employee.id,
          employeeName: c.employee.name,
          currentRole: c.employee.designation,
          targetRole: 'Senior ' + c.employee.designation,
          readinessScore: c.score * 20,
          avgPerformanceRating: c.score,
          tenure: '2 years',
          keyStrengths: ['Leadership', 'Technical Skills', 'Communication'],
          developmentAreas: ['Project Management'],
          recommendation: 'promote_6m' as const,
        })));
      }
    } catch (error) {
      logger.error('Error loading performance data:', error);
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

  const avgTeamPerformance = teamMembers.length > 0
    ? teamMembers.reduce((acc, m) => acc + (m.performanceScore || 0), 0) / teamMembers.filter((m) => m.performanceScore).length || 0
    : 0;

  const TabButton = ({ label, value }: { label: string; value: typeof selectedTab }) => (
    <TouchableOpacity
      style={[styles.tabButton, selectedTab === value && styles.tabButtonActive]}
      onPress={() => setSelectedTab(value)}
    >
      <Text style={[styles.tabButtonText, selectedTab === value && styles.tabButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Team Performance Summary */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Team Performance</Text>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="Avg Rating"
            value={avgTeamPerformance.toFixed(1)}
            subtitle="/5.0"
            color={Colors.success}
            style={styles.statCard}
          />
          <StatCard
            title="Active OKRs"
            value={okrs.length}
            color={Colors.primary}
            style={styles.statCard}
          />
          <StatCard
            title="Promotion Ready"
            value={promotionCandidates.length}
            color={Colors.warning}
            style={styles.statCard}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('PerformanceReview')}
          >
            <Text style={styles.quickActionIcon}>rate_review</Text>
            <Text style={styles.quickActionLabel}>Reviews</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => setSelectedTab('okrs')}
          >
            <Text style={styles.quickActionIcon}>track_changes</Text>
            <Text style={styles.quickActionLabel}>OKRs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => setSelectedTab('promotions')}
          >
            <Text style={styles.quickActionIcon}>trending_up</Text>
            <Text style={styles.quickActionLabel}>Promotions</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TabButton label="Overview" value="overview" />
          <TabButton label="OKRs" value="okrs" />
          <TabButton label="Promotions" value="promotions" />
        </View>

        {/* Tab Content */}
        {selectedTab === 'overview' && (
          <View>
            {/* Top Performers */}
            <Card title="Top Performers" style={styles.section}>
              {teamMembers
                .filter((m) => m.performanceScore && m.performanceScore >= 4.0)
                .sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0))
                .slice(0, 3)
                .map((member, index) => (
                  <View key={member.id} style={styles.performerItem}>
                    <Text style={styles.performerRank}>#{index + 1}</Text>
                    <Avatar uri={member.avatar} name={member.name} size="sm" />
                    <View style={styles.performerInfo}>
                      <Text style={styles.performerName}>{member.name}</Text>
                      <Text style={styles.performerRole}>{member.designation}</Text>
                    </View>
                    <View style={styles.performerScore}>
                      <Text style={styles.scoreValue}>{member.performanceScore?.toFixed(1)}</Text>
                      <Text style={styles.scoreLabel}>/5.0</Text>
                    </View>
                  </View>
                ))}
            </Card>

            {/* OKR Summary */}
            <Card
              title="Q2 OKR Progress"
              headerRight={
                <TouchableOpacity onPress={() => setSelectedTab('okrs')}>
                  <Text style={styles.viewAll}>View All</Text>
                </TouchableOpacity>
              }
              style={styles.section}
            >
              {okrs.slice(0, 3).map((okr) => (
                <View key={okr.id} style={styles.okrItem}>
                  <View style={styles.okrHeader}>
                    <Text style={styles.okrName}>{okr.employeeName}</Text>
                    <Text style={styles.okrProgress}>{okr.overallProgress}%</Text>
                  </View>
                  <ProgressBar
                    progress={okr.overallProgress}
                    showPercentage={false}
                    height={6}
                    color={okr.overallProgress >= 70 ? Colors.success : Colors.warning}
                  />
                </View>
              ))}
              {okrs.length === 0 && (
                <Text style={styles.emptyText}>No OKRs set for this quarter</Text>
              )}
            </Card>
          </View>
        )}

        {selectedTab === 'okrs' && (
          <View>
            {okrs.length > 0 ? (
              okrs.map((okr) => (
                <Card key={okr.id} title={okr.employeeName} style={styles.section}>
                  <View style={styles.okrHeader}>
                    <Badge label={`${okr.quarter} ${okr.year}`} variant="info" size="sm" />
                    <Badge
                      label={okr.status}
                      variant={okr.status === 'active' ? 'success' : 'default'}
                      size="sm"
                    />
                  </View>

                  <View style={styles.okrOverallProgress}>
                    <Text style={styles.overallProgressLabel}>Overall Progress</Text>
                    <View style={styles.overallProgressRow}>
                      <Text style={styles.overallProgressValue}>{okr.overallProgress}%</Text>
                      <Text style={styles.overallProgressMax}>/100%</Text>
                    </View>
                  </View>

                  <ProgressBar
                    progress={okr.overallProgress}
                    showPercentage={false}
                    height={12}
                    color={okr.overallProgress >= 70 ? Colors.success : Colors.warning}
                    style={{ marginBottom: Spacing.md }}
                  />

                  {okr.objectives.map((obj) => (
                    <View key={obj.id} style={styles.objectiveCard}>
                      <Text style={styles.objectiveTitle}>{obj.title}</Text>
                      <ProgressBar
                        progress={obj.progress}
                        showPercentage={false}
                        height={8}
                        color={Colors.primary}
                        style={{ marginTop: Spacing.sm }}
                      />
                      <Text style={styles.objectiveProgress}>{obj.progress}%</Text>

                      {obj.keyResults.map((kr) => (
                        <View key={kr.id} style={styles.krItem}>
                          <View style={styles.krHeader}>
                            <Text style={styles.krTitle}>{kr.title}</Text>
                            <Text style={styles.krProgress}>
                              {kr.current}/{kr.target} {kr.unit}
                            </Text>
                          </View>
                          <ProgressBar
                            progress={kr.progress}
                            showPercentage={false}
                            height={4}
                            color={kr.progress >= 70 ? Colors.success : Colors.warning}
                          />
                        </View>
                      ))}
                    </View>
                  ))}
                </Card>
              ))
            ) : (
              <Card style={styles.section}>
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>track_changes</Text>
                  <Text style={styles.emptyTitle}>No OKRs Found</Text>
                  <Text style={styles.emptyText}>
                    OKRs will appear here once they are set for your team members
                  </Text>
                </View>
              </Card>
            )}
          </View>
        )}

        {selectedTab === 'promotions' && (
          <View>
            {promotionCandidates.length > 0 ? (
              promotionCandidates.map((candidate) => (
                <Card key={candidate.employeeId} style={styles.section}>
                  <View style={styles.candidateHeader}>
                    <Avatar
                      uri={`https://i.pravatar.cc/150?u=${candidate.employeeId}`}
                      name={candidate.employeeName}
                      size="lg"
                    />
                    <View style={styles.candidateInfo}>
                      <Text style={styles.candidateName}>{candidate.employeeName}</Text>
                      <Text style={styles.candidateCurrentRole}>{candidate.currentRole}</Text>
                      <View style={styles.candidateTenure}>
                        <Text style={styles.tenureLabel}>{candidate.tenure}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.promotionDetails}>
                    <View style={styles.promotionRow}>
                      <Text style={styles.promotionLabel}>Target Role:</Text>
                      <Text style={styles.promotionValue}>{candidate.targetRole}</Text>
                    </View>
                    <View style={styles.promotionRow}>
                      <Text style={styles.promotionLabel}>Performance:</Text>
                      <Text style={styles.performanceValue}>
                        {candidate.avgPerformanceRating.toFixed(1)}/5.0
                      </Text>
                    </View>
                    <View style={styles.promotionRow}>
                      <Text style={styles.promotionLabel}>Readiness:</Text>
                      <Text style={styles.readinessValue}>
                        {candidate.readinessScore}% ready
                      </Text>
                    </View>
                  </View>

                  <View style={styles.strengthsSection}>
                    <Text style={styles.sectionTitle}>Key Strengths</Text>
                    <View style={styles.tagContainer}>
                      {candidate.keyStrengths.map((strength, index) => (
                        <View key={index} style={styles.strengthTag}>
                          <Text style={styles.strengthTagText}>{strength}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <Badge
                    label={
                      candidate.recommendation === 'promote_now'
                        ? 'Ready Now'
                        : candidate.recommendation === 'promote_6m'
                        ? 'Ready in 6 months'
                        : 'Develop First'
                    }
                    variant={
                      candidate.recommendation === 'promote_now'
                        ? 'success'
                        : candidate.recommendation === 'promote_6m'
                        ? 'warning'
                        : 'info'
                    }
                    style={{ alignSelf: 'flex-start', marginTop: Spacing.md }}
                  />
                </Card>
              ))
            ) : (
              <Card style={styles.section}>
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>trending_up</Text>
                  <Text style={styles.emptyTitle}>No Promotion Candidates</Text>
                  <Text style={styles.emptyText}>
                    Team members ready for promotion will appear here
                  </Text>
                </View>
              </Card>
            )}
          </View>
        )}
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
  statsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  quickActions: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.sm,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  quickActionLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    marginBottom: Spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
  },
  tabButtonText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: Colors.textInverse,
  },
  section: {
    marginBottom: Spacing.md,
  },
  viewAll: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  performerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  performerRank: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
    width: 30,
  },
  performerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  performerName: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  performerRole: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  performerScore: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.success,
  },
  scoreLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  okrItem: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  okrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  okrName: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  okrProgress: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  okrOverallProgress: {
    marginBottom: Spacing.sm,
  },
  overallProgressLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  overallProgressRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  overallProgressValue: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.primary,
  },
  overallProgressMax: {
    fontSize: FontSize.lg,
    color: Colors.textMuted,
    marginLeft: Spacing.xs,
  },
  objectiveCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  objectiveTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  objectiveProgress: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  krItem: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  krHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  krTitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  krProgress: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  candidateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  candidateInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  candidateName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  candidateCurrentRole: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  candidateTenure: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  tenureLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  promotionDetails: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  promotionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  promotionLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  promotionValue: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  performanceValue: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.success,
  },
  readinessValue: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  strengthsSection: {
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  strengthTag: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  strengthTagText: {
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
