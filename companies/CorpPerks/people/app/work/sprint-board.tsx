// ==========================================
// MyTalent - Sprint Board Screen
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../src/components/Badge';
import { Card, Button } from '../../src/components';

interface Task {
  taskId: string;
  title: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  storyPoints: number;
  assignee: string;
  dueDate: string;
}

interface Sprint {
  id: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'completed';
  plannedPoints: number;
  completedPoints: number;
}

// Mock data
const mockSprints: Sprint[] = [
  {
    id: 'SPRINT-00001',
    name: 'Sprint 3 - Integration',
    goal: 'Complete API integration and testing',
    startDate: '2026-05-29',
    endDate: '2026-06-12',
    status: 'active',
    plannedPoints: 28,
    completedPoints: 8
  }
];

const mockTasks: Task[] = [
  { taskId: 'TASK-00001', title: 'API integration', status: 'done', storyPoints: 5, assignee: 'Priya Patel', dueDate: '2026-06-05' },
  { taskId: 'TASK-00002', title: 'Authentication flow', status: 'done', storyPoints: 3, assignee: 'Priya Patel', dueDate: '2026-06-03' },
  { taskId: 'TASK-00003', title: 'Unit tests', status: 'in_progress', storyPoints: 5, assignee: 'Sneha Reddy', dueDate: '2026-06-08' },
  { taskId: 'TASK-00004', title: 'Error handling', status: 'in_progress', storyPoints: 3, assignee: 'Priya Patel', dueDate: '2026-06-10' },
  { taskId: 'TASK-00005', title: 'Performance testing', status: 'review', storyPoints: 5, assignee: 'Vikram Singh', dueDate: '2026-06-07' },
  { taskId: 'TASK-00006', title: 'Documentation', status: 'todo', storyPoints: 3, assignee: 'Sneha Reddy', dueDate: '2026-06-11' },
  { taskId: 'TASK-00007', title: 'Deployment setup', status: 'todo', storyPoints: 2, assignee: 'Vikram Singh', dueDate: '2026-06-12' },
  { taskId: 'TASK-00008', title: 'Monitoring setup', status: 'todo', storyPoints: 2, assignee: 'Vikram Singh', dueDate: '2026-06-12' },
];

export default function SprintBoardScreen() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const activeSprint = mockSprints.find(s => s.status === 'active');
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const reviewTasks = tasks.filter(t => t.status === 'review');
  const doneTasks = tasks.filter(t => t.status === 'done');

  const completionPercentage = activeSprint
    ? Math.round((activeSprint.completedPoints / activeSprint.plannedPoints) * 100)
    : 0;

  const daysRemaining = activeSprint
    ? Math.ceil((new Date(activeSprint.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
  };

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    setTasks(prev => prev.map(t =>
      t.taskId === taskId ? { ...t, status: newStatus } : t
    ));

    // Update sprint completed points
    const updatedTasks = tasks.map(t =>
      t.taskId === taskId ? { ...t, status: newStatus } : t
    );
    const newCompletedPoints = updatedTasks
      .filter(t => t.status === 'done')
      .reduce((sum, t) => sum + t.storyPoints, 0);

    Alert.alert(
      'Status Updated',
      `Task moved to ${newStatus.replace('_', ' ')}`
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return Colors.success;
      case 'in_progress': return Colors.primary;
      case 'review': return Colors.warning;
      default: return Colors.gray;
    }
  };

  const renderTaskCard = (task: Task) => (
    <TouchableOpacity
      key={task.taskId}
      style={styles.taskCard}
      onPress={() => handleTaskPress(task)}
    >
      <View style={styles.taskHeader}>
        <Text style={styles.taskPoints}>{task.storyPoints} pts</Text>
      </View>
      <Text style={styles.taskTitle}>{task.title}</Text>
      <View style={styles.taskFooter}>
        <Text style={styles.taskAssignee}>{task.assignee.split(' ')[0]}</Text>
        <Text style={styles.taskDue}>{task.dueDate.slice(5)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderColumn = (title: string, tasks: Task[], status: Task['status']) => (
    <View style={styles.column}>
      <View style={[styles.columnHeader, { borderTopColor: getStatusColor(status) }]}>
        <Text style={styles.columnTitle}>{title}</Text>
        <View style={[styles.columnBadge, { backgroundColor: getStatusColor(status) + '20' }]}>
          <Text style={[styles.columnBadgeText, { color: getStatusColor(status) }]}>
            {tasks.length}
          </Text>
        </View>
      </View>
      <ScrollView style={styles.columnContent} showsVerticalScrollIndicator={false}>
        {tasks.length === 0 ? (
          <View style={styles.emptyColumn}>
            <Text style={styles.emptyText}>No tasks</Text>
          </View>
        ) : (
          tasks.map(renderTaskCard)
        )}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Sprint Board</Text>
          <Text style={styles.sprintName}>{activeSprint?.name}</Text>
        </View>
        <View style={[styles.sprintStatusBadge, { backgroundColor: Colors.success + '20' }]}>
          <Text style={[styles.sprintStatusText, { color: Colors.success }]}>
            {activeSprint?.status}
          </Text>
        </View>
      </View>

      {/* Sprint Info */}
      {activeSprint && (
        <Card style={styles.sprintInfoCard}>
          <View style={styles.sprintInfoRow}>
            <View style={styles.sprintInfoItem}>
              <Text style={styles.sprintInfoLabel}>Goal</Text>
              <Text style={styles.sprintInfoValue}>{activeSprint.goal}</Text>
            </View>
          </View>
          <View style={styles.sprintStats}>
            <View style={styles.sprintStat}>
              <Text style={styles.sprintStatValue}>{daysRemaining}</Text>
              <Text style={styles.sprintStatLabel}>Days Left</Text>
            </View>
            <View style={styles.sprintStat}>
              <Text style={styles.sprintStatValue}>{activeSprint.completedPoints}</Text>
              <Text style={styles.sprintStatLabel}>Completed</Text>
            </View>
            <View style={styles.sprintStat}>
              <Text style={styles.sprintStatValue}>{activeSprint.plannedPoints}</Text>
              <Text style={styles.sprintStatLabel}>Planned</Text>
            </View>
            <View style={styles.sprintStat}>
              <Text style={[styles.sprintStatValue, { color: Colors.success }]}>
                {completionPercentage}%
              </Text>
              <Text style={styles.sprintStatLabel}>Velocity</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${completionPercentage}%` }
              ]}
            />
          </View>
        </Card>
      )}

      {/* Kanban Board */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.boardContainer}
        contentContainerStyle={styles.boardContent}
      >
        {renderColumn('To Do', todoTasks, 'todo')}
        {renderColumn('In Progress', inProgressTasks, 'in_progress')}
        {renderColumn('Review', reviewTasks, 'review')}
        {renderColumn('Done', doneTasks, 'done')}
      </ScrollView>

      {/* Task Detail Modal */}
      {selectedTask && (
        <View style={styles.taskModal}>
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setSelectedTask(null)}
            activeOpacity={1}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTaskId}>{selectedTask.taskId}</Text>
                <TouchableOpacity onPress={() => setSelectedTask(null)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.modalTitle}>{selectedTask.title}</Text>
              <View style={styles.modalMeta}>
                <View style={styles.modalMetaItem}>
                  <Text style={styles.modalMetaLabel}>Assignee</Text>
                  <Text style={styles.modalMetaValue}>{selectedTask.assignee}</Text>
                </View>
                <View style={styles.modalMetaItem}>
                  <Text style={styles.modalMetaLabel}>Due Date</Text>
                  <Text style={styles.modalMetaValue}>{selectedTask.dueDate}</Text>
                </View>
                <View style={styles.modalMetaItem}>
                  <Text style={styles.modalMetaLabel}>Story Points</Text>
                  <Text style={styles.modalMetaValue}>{selectedTask.storyPoints}</Text>
                </View>
              </View>

              <Text style={styles.modalSectionTitle}>Move to</Text>
              <View style={styles.statusButtons}>
                {(['todo', 'in_progress', 'review', 'done'] as const).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusButton,
                      { backgroundColor: getStatusColor(status) + '20' },
                      selectedTask.status === status && styles.statusButtonActive
                    ]}
                    onPress={() => {
                      handleStatusChange(selectedTask.taskId, status);
                      setSelectedTask(null);
                    }}
                  >
                    <Text style={[styles.statusButtonText, { color: getStatusColor(status) }]}>
                      {status.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  sprintName: {
    fontSize: FontSize.sm,
    color: Colors.gray,
    marginTop: Spacing.xs,
  },
  sprintStatusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  sprintStatusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    textTransform: 'capitalize',
  },
  sprintInfoCard: {
    margin: Spacing.md,
    marginBottom: 0,
  },
  sprintInfoRow: {
    marginBottom: Spacing.md,
  },
  sprintInfoItem: {
    flex: 1,
  },
  sprintInfoLabel: {
    fontSize: FontSize.xs,
    color: Colors.gray,
    marginBottom: Spacing.xs,
  },
  sprintInfoValue: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  sprintStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sprintStat: {
    alignItems: 'center',
  },
  sprintStatValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  sprintStatLabel: {
    fontSize: FontSize.xs,
    color: Colors.gray,
    marginTop: Spacing.xs,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 4,
  },
  boardContainer: {
    flex: 1,
  },
  boardContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  column: {
    width: 280,
    marginRight: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadow.md,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderTopWidth: 4,
    backgroundColor: Colors.gray + '10',
  },
  columnTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  columnBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  columnContent: {
    padding: Spacing.sm,
    maxHeight: 400,
  },
  emptyColumn: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.gray,
  },
  taskCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: Spacing.xs,
  },
  taskPoints: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  taskTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskAssignee: {
    fontSize: FontSize.xs,
    color: Colors.gray,
  },
  taskDue: {
    fontSize: FontSize.xs,
    color: Colors.gray,
  },
  taskModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  modalTaskId: {
    fontSize: FontSize.sm,
    color: Colors.gray,
    fontWeight: FontWeight.medium,
  },
  modalClose: {
    fontSize: FontSize.lg,
    color: Colors.gray,
    padding: Spacing.xs,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  modalMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalMetaItem: {
    minWidth: 100,
  },
  modalMetaLabel: {
    fontSize: FontSize.xs,
    color: Colors.gray,
    marginBottom: Spacing.xs,
  },
  modalMetaValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  modalSectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statusButton: {
    flex: 1,
    minWidth: 80,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  statusButtonActive: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  statusButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    textTransform: 'capitalize',
  },
});
