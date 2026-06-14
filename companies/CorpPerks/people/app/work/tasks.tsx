// ==========================================
// MyTalent - Tasks Screen
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow, getPriorityColor, formatDate } from '../../src/components/Badge';
import { Card, Button, StatusBadge, ProgressBar, EmptyState } from '../../src/components';
import { mockTasks } from '../../src/data/mockData';
import { useAppStore } from '../../src/store/useAppStore';

export default function TasksScreen() {
  const { tasks, completeTask, addTask } = useAppStore();
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'assigned'>('daily');

  useEffect(() => {
    if (tasks.length === 0) {
      // Initialize with mock data
      mockTasks.forEach((task) => addTask(task));
    }
  }, []);

  const filteredTasks = mockTasks.filter((task) => {
    switch (activeTab) {
      case 'daily':
        return task.category === 'personal' || task.category === 'meeting';
      case 'weekly':
        return task.category === 'work';
      case 'assigned':
        return task.assignedBy;
      default:
        return true;
    }
  });

  const pendingTasks = filteredTasks.filter((t) => t.status !== 'completed');
  const completedTasks = filteredTasks.filter((t) => t.status === 'completed');

  const handleCompleteTask = (taskId: string) => {
    Alert.alert(
      'Complete Task',
      'Mark this task as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => {
            completeTask(taskId);
            Alert.alert('Success', 'Task marked as completed!');
          },
        },
      ]
    );
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Tab Buttons */}
      <View style={styles.tabs}>
        {(['daily', 'weekly', 'assigned'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{pendingTasks.length}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: Colors.success }]}>{completedTasks.length}</Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: Colors.error }]}>
              {pendingTasks.filter((t) => t.priority === 'urgent').length}
            </Text>
            <Text style={styles.summaryLabel}>Urgent</Text>
          </View>
        </View>
      </Card>

      {/* Pending Tasks */}
      <Text style={styles.sectionTitle}>Pending Tasks</Text>
      {pendingTasks.length > 0 ? (
        pendingTasks.map((task) => (
          <Card key={task.id} style={styles.taskCard}>
            <TouchableOpacity
              style={styles.taskComplete}
              onPress={() => handleCompleteTask(task.id)}
            >
              <View style={styles.checkbox} />
            </TouchableOpacity>
            <View style={styles.taskContent}>
              <View style={styles.taskHeader}>
                <View style={styles.taskTitleRow}>
                  <Text style={styles.priorityIcon}>{getPriorityIcon(task.priority)}</Text>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                </View>
                <StatusBadge status={task.status} size="sm" />
              </View>
              {task.description && (
                <Text style={styles.taskDesc}>{task.description}</Text>
              )}
              <View style={styles.taskMeta}>
                <Text style={styles.taskDue}>Due: {formatDate(task.dueDate)}</Text>
                {task.assignedBy && (
                  <Text style={styles.taskAssigned}>By: {task.assignedBy}</Text>
                )}
              </View>
              {task.progress !== undefined && (
                <ProgressBar
                  progress={task.progress}
                  color={Colors.primary}
                  height={4}
                  style={styles.taskProgress}
                />
              )}
            </View>
          </Card>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No pending tasks</Text>
        </Card>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Completed</Text>
          {completedTasks.map((task) => (
            <Card key={task.id} style={styles.taskCard}>
              <View style={styles.taskComplete}>
                <View style={[styles.checkbox, styles.checkboxChecked]}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              </View>
              <View style={styles.taskContent}>
                <Text style={[styles.taskTitle, styles.taskTitleDone]}>{task.title}</Text>
              </View>
            </Card>
          ))}
        </>
      )}

      {/* Add Task Button */}
      <Button
        title="+ Add New Task"
        variant="outline"
        fullWidth
        onPress={() => Alert.alert('Coming Soon', 'Task creation will be available soon!')}
        style={styles.addBtn}
      />

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabs: {
    flexDirection: 'row',
    margin: Spacing.md,
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
  summaryCard: {
    marginHorizontal: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
  },
  summaryValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  taskCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskComplete: {
    padding: Spacing.sm,
    paddingTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  checkboxChecked: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priorityIcon: {
    fontSize: 14,
    marginRight: Spacing.xs,
  },
  taskTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    flex: 1,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  taskDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  taskMeta: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  taskDue: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  taskAssigned: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  taskProgress: {
    marginTop: Spacing.sm,
  },
  emptyCard: {
    marginHorizontal: Spacing.md,
    alignItems: 'center',
    padding: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  addBtn: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
