'use client';

import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';

// Types
interface Task {
  taskId: string;
  title: string;
  description: string;
  assigneeType: 'employee' | 'manager' | 'hr' | 'it' | 'finance';
  category: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  dueDate: string;
  completedAt?: string;
  order: number;
  isRequired: boolean;
}

interface OnboardingInstance {
  instanceId: string;
  employeeId: string;
  employeeName: string;
  templateName: string;
  startDate: string;
  targetEndDate: string;
  status: 'not_started' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
  progress: number;
  tasks: Task[];
  department?: string;
  role?: string;
}

// Mock current user
const currentUser = {
  employeeId: 'EMP-101',
  role: 'employee'
};

export default function MyOnboarding() {
  const [onboarding, setOnboarding] = useState<OnboardingInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const fetchOnboarding = useCallback(async () => {
    try {
      // Try to fetch from API
      const res = await fetch('http://localhost:4732/api/onboarding/active', {
        headers: {
          'x-employee-id': currentUser.employeeId
        }
      });

      if (res.ok) {
        const data = await res.json();
        setOnboarding(data.data);
      } else {
        // Use mock data
        setOnboarding(mockOnboarding);
      }
    } catch (error) {
      // Use mock data
      setOnboarding(mockOnboarding);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchOnboarding();
  }, [fetchOnboarding]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOnboarding();
  };

  const completeTask = async (taskId: string) => {
    try {
      const res = await fetch(`http://localhost:4732/api/onboarding/${onboarding?.instanceId}/task/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });

      if (res.ok) {
        const data = await res.json();
        setOnboarding(data.data);
      }
    } catch (error) {
      // Update locally for demo
      if (onboarding) {
        const updatedTasks = onboarding.tasks.map(t =>
          t.taskId === taskId ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString() } : t
        );
        const completedCount = updatedTasks.filter(t => t.status === 'completed' || t.status === 'skipped').length;
        setOnboarding({
          ...onboarding,
          tasks: updatedTasks,
          progress: Math.round((completedCount / updatedTasks.length) * 100)
        });
      }
    }
    setSelectedTask(null);
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      documentation: '📄',
      training: '📚',
      equipment: '💻',
      introduction: '🤝',
      compliance: '✅',
      other: '📋'
    };
    return icons[category] || '📋';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#F59E0B',
      in_progress: '#3B82F6',
      completed: '#22C55E',
      skipped: '#6B7280'
    };
    return colors[status] || '#9CA3AF';
  };

  const getDaysRemaining = () => {
    if (!onboarding) return 0;
    const days = Math.ceil((new Date(onboarding.targetEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading your onboarding...</Text>
      </View>
    );
  }

  if (!onboarding) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🎉</Text>
        <Text style={styles.emptyTitle}>No Active Onboarding</Text>
        <Text style={styles.emptyText}>
          You don't have any active onboarding process.
          If you just joined, please contact HR.
        </Text>
      </View>
    );
  }

  const pendingTasks = onboarding.tasks.filter(t => t.status !== 'completed');
  const completedTasks = onboarding.tasks.filter(t => t.status === 'completed');

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.welcomeText}>Welcome aboard!</Text>
          <Text style={styles.templateName}>{onboarding.templateName}</Text>
        </View>
        <View style={styles.progressCard}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressLabel}>Your Progress</Text>
            <Text style={styles.progressValue}>{onboarding.progress}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${onboarding.progress}%` }]} />
          </View>
          <View style={styles.progressStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completedTasks.length}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{pendingTasks.length}</Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{getDaysRemaining()}</Text>
              <Text style={styles.statLabel}>Days Left</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tasks to Complete</Text>
          {pendingTasks.sort((a, b) => a.order - b.order).map(task => (
            <TouchableOpacity
              key={task.taskId}
              style={styles.taskCard}
              onPress={() => setSelectedTask(task)}
            >
              <View style={styles.taskIcon}>
                <Text style={styles.taskIconText}>{getCategoryIcon(task.category)}</Text>
              </View>
              <View style={styles.taskContent}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <View style={styles.taskMeta}>
                  <View style={[styles.statusBadge, { background: `${getStatusColor(task.status)}20` }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
                      {task.status.replace('_', ' ')}
                    </Text>
                  </View>
                  <Text style={styles.dueDate}>
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Completed Tasks</Text>
          {completedTasks.sort((a, b) => a.order - b.order).map(task => (
            <View key={task.taskId} style={[styles.taskCard, styles.completedTask]}>
              <View style={[styles.taskIcon, styles.completedIcon]}>
                <Text style={styles.taskIconText}>✓</Text>
              </View>
              <View style={styles.taskContent}>
                <Text style={[styles.taskTitle, styles.completedTitle]}>{task.title}</Text>
                <Text style={styles.completedDate}>
                  Completed {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : ''}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalIcon}>{getCategoryIcon(selectedTask.category)}</Text>
              <Text style={styles.modalTitle}>{selectedTask.title}</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedTask(null)}>
                <Text style={styles.closeBtnText}>×</Text>
              </TouchableOpacity>
            </View>

            {selectedTask.description && (
              <Text style={styles.modalDesc}>{selectedTask.description}</Text>
            )}

            <View style={styles.modalDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Assigned to</Text>
                <Text style={styles.detailValue}>{selectedTask.assigneeType}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Due Date</Text>
                <Text style={styles.detailValue}>
                  {new Date(selectedTask.dueDate).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={[styles.statusBadge, { background: `${getStatusColor(selectedTask.status)}20` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(selectedTask.status) }]}>
                    {selectedTask.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>
            </View>

            {selectedTask.status !== 'completed' && (
              <TouchableOpacity
                style={styles.completeBtn}
                onPress={() => completeTask(selectedTask.taskId)}
              >
                <Text style={styles.completeBtnText}>Mark as Complete</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

// Mock data for demo
const mockOnboarding: OnboardingInstance = {
  instanceId: 'ONB_1',
  employeeId: 'EMP-101',
  employeeName: 'Priya Sharma',
  templateName: 'Standard Employee Onboarding',
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  targetEndDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'in_progress',
  progress: 35,
  department: 'Engineering',
  role: 'Software Engineer',
  tasks: [
    {
      taskId: 'T1',
      title: 'Create employee profile',
      description: 'Complete your profile information including contact details, emergency contacts, and work preferences.',
      assigneeType: 'employee',
      category: 'documentation',
      status: 'completed',
      dueDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      order: 0,
      isRequired: true
    },
    {
      taskId: 'T2',
      title: 'Set up email and accounts',
      description: 'Access your email, Slack, and other work accounts. IT will send credentials.',
      assigneeType: 'employee',
      category: 'equipment',
      status: 'completed',
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      order: 1,
      isRequired: true
    },
    {
      taskId: 'T3',
      title: 'Complete compliance training',
      description: 'Complete mandatory security, privacy, and company policies training modules.',
      assigneeType: 'employee',
      category: 'compliance',
      status: 'in_progress',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      order: 2,
      isRequired: true
    },
    {
      taskId: 'T4',
      title: 'Meet with your manager',
      description: 'Schedule a 1:1 with your manager to discuss role expectations and 30-day goals.',
      assigneeType: 'manager',
      category: 'introduction',
      status: 'pending',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      order: 3,
      isRequired: true
    },
    {
      taskId: 'T5',
      title: 'Review team processes',
      description: 'Understand team workflows, tools, and communication channels.',
      assigneeType: 'employee',
      category: 'training',
      status: 'pending',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      order: 4,
      isRequired: true
    },
    {
      taskId: 'T6',
      title: 'Set 30-day goals',
      description: 'Document your goals with manager agreement for the first 30 days.',
      assigneeType: 'employee',
      category: 'other',
      status: 'pending',
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      order: 5,
      isRequired: true
    },
    {
      taskId: 'T7',
      title: 'Team lunch introduction',
      description: 'Social lunch with team members (optional but recommended).',
      assigneeType: 'manager',
      category: 'introduction',
      status: 'pending',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      order: 6,
      isRequired: false
    }
  ]
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f9fafb'
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22
  },
  header: {
    padding: 16,
    backgroundColor: '#fff'
  },
  headerTop: {
    marginBottom: 16
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4
  },
  templateName: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500'
  },
  progressCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  progressLabel: {
    fontSize: 14,
    color: '#6b7280'
  },
  progressValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981'
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  statItem: {
    alignItems: 'center'
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937'
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2
  },
  section: {
    padding: 16,
    paddingBottom: 0
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  completedTask: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb'
  },
  taskIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  completedIcon: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)'
  },
  taskIconText: {
    fontSize: 20
  },
  taskContent: {
    flex: 1
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4
  },
  completedTitle: {
    color: '#9ca3af',
    textDecorationLine: 'line-through'
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    textTransform: 'capitalize'
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize'
  },
  dueDate: {
    fontSize: 12,
    color: '#6b7280'
  },
  completedDate: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 2
  },
  chevron: {
    fontSize: 24,
    color: '#9ca3af'
  },
  modalOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%'
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16
  },
  modalIcon: {
    fontSize: 48,
    marginBottom: 12
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center'
  },
  closeBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeBtnText: {
    fontSize: 24,
    color: '#6b7280'
  },
  modalDesc: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22
  },
  modalDetails: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280'
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    textTransform: 'capitalize'
  },
  completeBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center'
  },
  completeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  bottomPadding: {
    height: 32
  }
});
