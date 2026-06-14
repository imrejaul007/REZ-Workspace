// ==========================================
// CorpPerks Client App - Project Detail Screen
// ==========================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Linking,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Card, Badge, ProgressBar, Avatar, Button } from '../../src/components';
import { api } from '../../src/services/api';
import {
  Colors,
  Spacing,
  FontSize,
  BorderRadius,
  formatCurrency,
  formatDate,
  getProjectStatusColor,
} from '../../src/utils/theme';
import { Project, Milestone, ProjectTask } from '../../src/types';

export default function ProjectDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { projectId } = route.params;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProject = async () => {
    try {
      const response = await api.getProject(projectId);
      if (response.success && response.data) {
        setProject(response.data);
      }
    } catch (error) {
      logger.error('Error loading project:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProject();
  };

  const getMilestoneStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'check_circle';
      case 'in_progress': return 'autorenew';
      case 'delayed': return 'warning';
      default: return 'radio_button_unchecked';
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return 'check_circle';
      case 'review': return 'visibility';
      case 'in_progress': return 'autorenew';
      default: return 'radio_button_unchecked';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return Colors.error;
      case 'high': return Colors.warning;
      case 'medium': return Colors.secondary;
      case 'low': return Colors.textMuted;
      default: return Colors.textMuted;
    }
  };

  const handleContactTeam = () => {
    navigation.navigate('Messages', { screen: 'Chat', params: { conversationId: 'conv-001' } });
  };

  if (loading || !project) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading project...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Project Header */}
        <Card style={styles.headerCard}>
          <View style={styles.projectHeader}>
            <View style={styles.projectInfo}>
              <View style={styles.statusRow}>
                <Badge label={project.status.replace('_', ' ')} variant="status" />
                <Badge
                  label={project.priority}
                  variant={project.priority === 'high' || project.priority === 'urgent' ? 'error' : 'default'}
                  size="sm"
                />
              </View>
              <Text style={styles.projectName}>{project.name}</Text>
              <Text style={styles.projectDescription}>{project.description}</Text>
            </View>
          </View>

          {/* Progress Section */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.sectionTitle}>Overall Progress</Text>
              <Text style={styles.progressPercentage}>{project.progress}%</Text>
            </View>
            <ProgressBar
              progress={project.progress}
              color={getProjectStatusColor(project.status)}
              height={10}
            />
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatCurrency(project.budget)}</Text>
              <Text style={styles.statLabel}>Budget</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatCurrency(project.spent)}</Text>
              <Text style={styles.statLabel}>Spent</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{project.billableHours}h</Text>
              <Text style={styles.statLabel}>Billable</Text>
            </View>
          </View>
        </Card>

        {/* Timeline */}
        <Card title="Timeline" style={styles.section}>
          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: Colors.success }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Start Date</Text>
                <Text style={styles.timelineValue}>{formatDate(project.startDate, 'long')}</Text>
              </View>
            </View>
            <View style={styles.timelineLine} />
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: Colors.warning }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>End Date</Text>
                <Text style={styles.timelineValue}>{formatDate(project.endDate, 'long')}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Team */}
        {project.teamMembers.length > 0 && (
          <Card
            title="Project Team"
            headerRight={
              <TouchableOpacity onPress={handleContactTeam}>
                <Text style={styles.viewAllText}>Message</Text>
              </TouchableOpacity>
            }
            style={styles.section}
          >
            {project.teamMembers.map((member) => (
              <View key={member.id} style={styles.teamMember}>
                <Avatar
                  uri={member.avatar}
                  name={member.name}
                  size="md"
                />
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRole}>{member.role}</Text>
                </View>
                <Badge label={member.designation} variant="info" size="sm" />
              </View>
            ))}
          </Card>
        )}

        {/* Milestones */}
        {project.milestones.length > 0 && (
          <Card title="Milestones" style={styles.section}>
            {project.milestones.map((milestone: Milestone, index: number) => (
              <View key={milestone.id}>
                <View style={styles.milestoneItem}>
                  <View style={styles.milestoneIcon}>
                    <Text
                      style={[
                        styles.milestoneIconText,
                        { color: getProjectStatusColor(milestone.status) },
                      ]}
                    >
                      {getMilestoneStatusIcon(milestone.status)}
                    </Text>
                  </View>
                  <View style={styles.milestoneContent}>
                    <View style={styles.milestoneHeader}>
                      <Text style={styles.milestoneName}>{milestone.name}</Text>
                      <Badge label={milestone.status.replace('_', ' ')} variant="status" size="sm" />
                    </View>
                    {milestone.description && (
                      <Text style={styles.milestoneDescription}>{milestone.description}</Text>
                    )}
                    <View style={styles.milestoneMeta}>
                      <Text style={styles.milestoneDate}>
                        Due: {formatDate(milestone.dueDate, 'short')}
                      </Text>
                      <Text style={styles.milestoneProgress}>{milestone.progress}%</Text>
                    </View>
                    <ProgressBar
                      progress={milestone.progress}
                      color={getProjectStatusColor(milestone.status)}
                      height={4}
                      style={styles.milestoneProgressBar}
                    />
                  </View>
                </View>
                {index < project.milestones.length - 1 && (
                  <View style={styles.milestoneSeparator} />
                )}
              </View>
            ))}
          </Card>
        )}

        {/* Tasks */}
        {project.tasks.length > 0 && (
          <Card title="Recent Tasks" style={styles.section}>
            {project.tasks.slice(0, 5).map((task: ProjectTask) => (
              <View key={task.id} style={styles.taskItem}>
                <Text style={styles.taskIcon}>
                  {getTaskStatusIcon(task.status)}
                </Text>
                <View style={styles.taskContent}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <View style={styles.taskMeta}>
                    <Text style={styles.taskAssignee}>{task.assigneeName}</Text>
                    {task.dueDate && (
                      <Text style={styles.taskDue}>
                        Due: {formatDate(task.dueDate, 'short')}
                      </Text>
                    )}
                  </View>
                </View>
                <View
                  style={[
                    styles.taskPriority,
                    { backgroundColor: getPriorityColor(task.priority) + '20' },
                  ]}
                >
                  <Text
                    style={[styles.taskPriorityText, { color: getPriorityColor(task.priority) }]}
                  >
                    {task.priority}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Documents */}
        {project.documents.length > 0 && (
          <Card title="Documents" style={styles.section}>
            {project.documents.map((doc) => (
              <TouchableOpacity key={doc.id} style={styles.documentItem}>
                <View style={styles.documentIcon}>
                  <Text style={styles.documentIconText}>description</Text>
                </View>
                <View style={styles.documentContent}>
                  <Text style={styles.documentName}>{doc.name}</Text>
                  <Text style={styles.documentMeta}>
                    {doc.uploadedBy} • {formatDate(doc.uploadedAt, 'relative')}
                  </Text>
                </View>
                <Text style={styles.downloadIcon}>download</Text>
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Contact Team"
            onPress={handleContactTeam}
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  headerCard: {
    marginBottom: Spacing.md,
  },
  projectHeader: {
    marginBottom: Spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  projectName: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  projectDescription: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  progressSection: {
    marginBottom: Spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  progressPercentage: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  statValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  section: {
    marginBottom: Spacing.md,
  },
  viewAllText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  timeline: {
    paddingLeft: Spacing.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: Spacing.md,
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: Colors.border,
    marginLeft: 5,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: Spacing.md,
  },
  timelineLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  timelineValue: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  teamMember: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  memberInfo: {
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
  },
  milestoneItem: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
  },
  milestoneIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  milestoneIconText: {
    fontSize: 20,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  milestoneName: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
  },
  milestoneDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  milestoneMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  milestoneDate: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  milestoneProgress: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  milestoneProgressBar: {
    marginTop: Spacing.xs,
  },
  milestoneSeparator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 56,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  taskIcon: {
    fontSize: 18,
    color: Colors.textMuted,
    marginRight: Spacing.md,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  taskMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  taskAssignee: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  taskDue: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  taskPriority: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
  },
  taskPriorityText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  documentIconText: {
    fontSize: 20,
    color: Colors.primary,
  },
  documentContent: {
    flex: 1,
  },
  documentName: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  documentMeta: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  downloadIcon: {
    fontSize: 20,
    color: Colors.primary,
  },
  actions: {
    marginTop: Spacing.md,
  },
});
