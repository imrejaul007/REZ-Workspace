// ==========================================
// MyTalent - Professional Passport Screen
// Career Timeline, Projects, Certifications, Reputation
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../src/components/Badge';
import { Card, ProgressRing, ProgressBar } from '../../src/components';
import { mockProfessionalPassport, mockReputationScores, mockReputationHistory } from '../../src/data/mockData';

const EVENT_COLORS: Record<string, string> = {
  promotion: Colors.success,
  role_change: Colors.primary,
  project: Colors.secondary,
  award: Colors.warning,
  certification: '#8B5CF6',
  milestone: Colors.textMuted,
};

const EVENT_ICONS: Record<string, string> = {
  promotion: '🎖️',
  role_change: '🔄',
  project: '📋',
  award: '🏆',
  certification: '🎓',
  milestone: '⭐',
};

export default function ProfessionalPassportScreen() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'projects' | 'skills' | 'reputation'>('timeline');
  const passport = mockProfessionalPassport;
  const reputation = mockReputationScores;

  const tabs = [
    { id: 'timeline', label: 'Career Timeline', icon: '📅' },
    { id: 'projects', label: 'Projects', icon: '📋' },
    { id: 'skills', label: 'Skills', icon: '💡' },
    { id: 'reputation', label: 'Reputation', icon: '⭐' },
  ];

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <Card style={styles.headerCard}>
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{passport.projectsDelivered.length}</Text>
            <Text style={styles.statLabel}>Projects</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{passport.certifications.length}</Text>
            <Text style={styles.statLabel}>Certifications</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{passport.skills.length}</Text>
            <Text style={styles.statLabel}>Skills</Text>
          </View>
        </View>
      </Card>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
        contentContainerStyle={styles.tabContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id as any)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Career Timeline */}
        {activeTab === 'timeline' && (
          <View style={styles.timeline}>
            {passport.careerTimeline.map((event, index) => {
              const isLast = index === passport.careerTimeline.length - 1;
              return (
                <View key={event.id} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineDot, { backgroundColor: EVENT_COLORS[event.type] }]}>
                      <Text style={styles.timelineDotIcon}>{EVENT_ICONS[event.type]}</Text>
                    </View>
                    {!isLast && <View style={styles.timelineLine} />}
                  </View>
                  <Card style={styles.timelineCard}>
                    <View style={styles.timelineHeader}>
                      <Text style={styles.timelineTitle}>{event.title}</Text>
                      {event.verified && (
                        <View style={styles.verifiedBadge}>
                          <Text style={styles.verifiedText}>✓</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.timelineDescription}>{event.description}</Text>
                    <View style={styles.timelineMeta}>
                      <Text style={styles.timelineDate}>{event.date}</Text>
                      {event.company && (
                        <Text style={styles.timelineCompany}> • {event.company}</Text>
                      )}
                    </View>
                  </Card>
                </View>
              );
            })}
          </View>
        )}

        {/* Projects */}
        {activeTab === 'projects' && (
          <View>
            {passport.projectsDelivered.map((project) => (
              <Card key={project.id} style={styles.projectCard}>
                <View style={styles.projectHeader}>
                  <View style={styles.projectIcon}>
                    <Text style={styles.projectEmoji}>📋</Text>
                  </View>
                  <View style={styles.projectInfo}>
                    <Text style={styles.projectName}>{project.name}</Text>
                    <Text style={styles.projectRole}>{project.role}</Text>
                  </View>
                  <View style={[styles.statusBadge, {
                    backgroundColor: project.status === 'completed' ? `${Colors.success}20` :
                                   project.status === 'in-progress' ? `${Colors.primary}20` : `${Colors.warning}20`
                  }]}>
                    <Text style={[styles.statusText, {
                      color: project.status === 'completed' ? Colors.success :
                             project.status === 'in-progress' ? Colors.primary : Colors.warning
                    }]}>
                      {project.status === 'in-progress' ? 'In Progress' : 'Completed'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.projectDescription}>{project.description}</Text>

                <View style={styles.projectMeta}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Duration</Text>
                    <Text style={styles.metaValue}>
                      {project.startDate} {project.endDate ? `- ${project.endDate}` : '- Present'}
                    </Text>
                  </View>
                  {project.teamSize && (
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Team</Text>
                      <Text style={styles.metaValue}>{project.teamSize} members</Text>
                    </View>
                  )}
                </View>

                <View style={styles.impactSection}>
                  <Text style={styles.impactIcon}>📈</Text>
                  <Text style={styles.impactText}>{project.impact}</Text>
                </View>

                <View style={styles.techStack}>
                  {project.technologies.map((tech, i) => (
                    <View key={i} style={styles.techBadge}>
                      <Text style={styles.techText}>{tech}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Skills */}
        {activeTab === 'skills' && (
          <View>
            {/* Certifications */}
            <Text style={styles.sectionTitle}>Certifications</Text>
            {passport.certifications.map((cert) => (
              <Card key={cert.id} style={styles.certCard}>
                <View style={styles.certHeader}>
                  <View style={styles.certIcon}>
                    <Text style={styles.certEmoji}>🎓</Text>
                  </View>
                  <View style={styles.certInfo}>
                    <Text style={styles.certName}>{cert.name}</Text>
                    <Text style={styles.certProvider}>{cert.provider}</Text>
                  </View>
                  {cert.verified && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>✓</Text>
                    </View>
                  )}
                </View>
                <View style={styles.certMeta}>
                  <Text style={styles.certDate}>Issued: {cert.issuedDate}</Text>
                  {cert.expiryDate && <Text style={styles.certDate}> • Expires: {cert.expiryDate}</Text>}
                </View>
              </Card>
            ))}

            {/* Skills */}
            <Text style={styles.sectionTitle}>Skills & Expertise</Text>
            {passport.skills.map((skill) => (
              <Card key={skill.skill} style={styles.skillCard}>
                <View style={styles.skillHeader}>
                  <Text style={styles.skillName}>{skill.skill}</Text>
                  <View style={[styles.levelBadge, {
                    backgroundColor: skill.level === 'expert' ? `${Colors.success}20` :
                                   skill.level === 'advanced' ? `${Colors.primary}20` :
                                   skill.level === 'intermediate' ? `${Colors.warning}20` : `${Colors.textMuted}20`
                  }]}>
                    <Text style={[styles.levelText, {
                      color: skill.level === 'expert' ? Colors.success :
                             skill.level === 'advanced' ? Colors.primary :
                             skill.level === 'intermediate' ? Colors.warning : Colors.textMuted
                    }]}>
                      {skill.level.charAt(0).toUpperCase() + skill.level.slice(1)}
                    </Text>
                  </View>
                </View>
                <View style={styles.skillMeta}>
                  <Text style={styles.skillDate}>Acquired: {skill.acquiredDate}</Text>
                  {skill.endorsements > 0 && (
                    <View style={styles.endorsementBadge}>
                      <Text style={styles.endorsementText}>♥ {skill.endorsements}</Text>
                    </View>
                  )}
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Reputation */}
        {activeTab === 'reputation' && (
          <View>
            {/* Overall Score */}
            <Card style={styles.overallCard}>
              <View style={styles.overallContent}>
                <ProgressRing
                  progress={reputation.overall}
                  size={120}
                  strokeWidth={12}
                  color={reputation.overall >= 80 ? Colors.success : reputation.overall >= 60 ? Colors.warning : Colors.error}
                />
                <View style={styles.overallInfo}>
                  <Text style={styles.overallTitle}>Reputation Score</Text>
                  <Text style={styles.overallSubtitle}>
                    Based on your professional activities
                  </Text>
                </View>
              </View>
            </Card>

            {/* Reputation Breakdown */}
            <Text style={styles.sectionTitle}>Score Breakdown</Text>
            <Card style={styles.breakdownCard}>
              {[
                { key: 'reliability', label: 'Reliability', desc: 'Attendance, deadlines' },
                { key: 'leadership', label: 'Leadership', desc: 'Team lead, mentoring' },
                { key: 'collaboration', label: 'Collaboration', desc: 'Teamwork, communication' },
                { key: 'delivery', label: 'Delivery', desc: 'Project completion' },
                { key: 'learning', label: 'Learning', desc: 'Skill growth, certifications' },
                { key: 'trust', label: 'Trust', desc: 'CorpID verification' },
              ].map((item) => (
                <View key={item.key} style={styles.breakdownItem}>
                  <View style={styles.breakdownHeader}>
                    <View>
                      <Text style={styles.breakdownLabel}>{item.label}</Text>
                      <Text style={styles.breakdownDesc}>{item.desc}</Text>
                    </View>
                    <Text style={styles.breakdownValue}>
                      {reputation[item.key as keyof typeof reputation]}
                    </Text>
                  </View>
                  <ProgressBar
                    progress={reputation[item.key as keyof typeof reputation]}
                    color={reputation[item.key as keyof typeof reputation] >= 80 ? Colors.success :
                           reputation[item.key as keyof typeof reputation] >= 60 ? Colors.warning : Colors.error}
                    height={8}
                  />
                </View>
              ))}
            </Card>

            {/* Trend Chart */}
            <Text style={styles.sectionTitle}>Reputation Trend</Text>
            <Card style={styles.trendCard}>
              <View style={styles.trendHeader}>
                <Text style={styles.trendTitle}>Last 3 Months</Text>
              </View>
              <View style={styles.trendChart}>
                {mockReputationHistory.map((month, index) => (
                  <View key={month.date} style={styles.trendMonth}>
                    <View style={styles.trendBars}>
                      <View style={[styles.trendBar, styles.trendBarReliability, { height: `${month.reliability}%` }]} />
                      <View style={[styles.trendBar, styles.trendBarLead, { height: `${month.leadership}%` }]} />
                      <View style={[styles.trendBar, styles.trendBarCollab, { height: `${month.collaboration}%` }]} />
                    </View>
                    <Text style={styles.trendMonthLabel}>{month.date.split('-')[1]}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.trendLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
                  <Text style={styles.legendText}>Reliability</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
                  <Text style={styles.legendText}>Leadership</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.secondary }]} />
                  <Text style={styles.legendText}>Collaboration</Text>
                </View>
              </View>
            </Card>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerCard: {
    margin: Spacing.md,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.borderLight,
  },
  tabContainer: {
    maxHeight: 56,
  },
  tabContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    ...Shadow.sm,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabIcon: {
    fontSize: FontSize.md,
    marginRight: 6,
  },
  tabLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  tabLabelActive: {
    color: Colors.textInverse,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  timeline: {
    paddingTop: Spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineLeft: {
    width: 56,
    alignItems: 'center',
  },
  timelineDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotIcon: {
    fontSize: 20,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.xs,
  },
  timelineCard: {
    flex: 1,
    marginLeft: Spacing.sm,
    marginBottom: Spacing.md,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  timelineTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    flex: 1,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    fontSize: 12,
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
  },
  timelineDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  timelineMeta: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  timelineDate: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  timelineCompany: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  projectCard: {
    marginBottom: Spacing.md,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  projectIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  projectEmoji: {
    fontSize: 24,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  projectRole: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  projectDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  projectMeta: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  metaValue: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },
  impactSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.success + '10',
    borderRadius: BorderRadius.md,
  },
  impactIcon: {
    fontSize: FontSize.md,
    marginRight: Spacing.sm,
  },
  impactText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.success,
    fontWeight: FontWeight.medium,
  },
  techStack: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  techBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: Colors.backgroundDark,
    borderRadius: BorderRadius.sm,
  },
  techText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  certCard: {
    marginBottom: Spacing.sm,
  },
  certHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  certIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  certEmoji: {
    fontSize: 20,
  },
  certInfo: {
    flex: 1,
  },
  certName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  certProvider: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  certMeta: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  certDate: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  skillCard: {
    marginBottom: Spacing.sm,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skillName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  levelBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  levelText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  skillMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  skillDate: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  endorsementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  endorsementText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    fontWeight: FontWeight.semibold,
  },
  overallCard: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  overallContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overallInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  overallTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  overallSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 4,
  },
  breakdownCard: {
    marginTop: Spacing.sm,
  },
  breakdownItem: {
    marginBottom: Spacing.md,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  breakdownLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  breakdownDesc: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  breakdownValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  trendCard: {
    marginTop: Spacing.sm,
  },
  trendHeader: {
    marginBottom: Spacing.md,
  },
  trendTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  trendChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: Spacing.md,
  },
  trendMonth: {
    alignItems: 'center',
  },
  trendBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    gap: 2,
  },
  trendBar: {
    width: 8,
    borderRadius: 4,
  },
  trendBarReliability: {
    backgroundColor: Colors.success,
  },
  trendBarLead: {
    backgroundColor: Colors.primary,
  },
  trendBarCollab: {
    backgroundColor: Colors.secondary,
  },
  trendMonthLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  trendLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
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
    color: Colors.textSecondary,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
