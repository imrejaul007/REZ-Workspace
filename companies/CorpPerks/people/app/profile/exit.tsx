'use client';

import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';

// Types
interface Task {
  taskId: string;
  title: string;
  assigneeType: string;
  category: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'blocked';
  dueDate: string;
  completedAt?: string;
  order: number;
  isRequired: boolean;
}

interface ClearanceItem {
  category: string;
  cleared: boolean;
  clearedBy?: string;
  clearedAt?: string;
}

interface OffboardingInstance {
  instanceId: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  targetEndDate: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  progress: number;
  tasks: Task[];
  clearanceChecklist: ClearanceItem[];
  notes: string[];
}

interface ExitInterview {
  interviewId: string;
  employeeName: string;
  type: 'resignation' | 'termination' | 'retirement' | 'contract_end';
  scheduledDate?: string;
  status: 'scheduled' | 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  responses: { questionId: string; question: string; answer: string; rating?: number }[];
  overallRating?: number;
}

interface ExitFeedback {
  feedbackId: string;
  category: string;
  feedbackType: 'reason' | 'comment' | 'suggestion' | 'compliment';
  content: string;
  createdAt: string;
}

// Mock current user
const currentUser = {
  employeeId: 'EMP-201'
};

export default function MyExit() {
  const [offboarding, setOffboarding] = useState<OffboardingInstance | null>(null);
  const [interview, setInterview] = useState<ExitInterview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'clearance'>('overview');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [feedback, setFeedback] = useState('');

  const fetchData = useCallback(async () => {
    try {
      // Try to fetch from APIs
      const [offboardRes, interviewRes] = await Promise.all([
        fetch('http://localhost:4733/api/offboarding/active', {
          headers: { 'x-employee-id': currentUser.employeeId }
        }),
        fetch(`http://localhost:4733/api/exit/employee/${currentUser.employeeId}`)
      ]);

      if (offboardRes.ok) {
        const data = await offboardRes.json();
        setOffboarding(data.data);
      }
      if (interviewRes.ok) {
        const data = await interviewRes.json();
        if (data.data?.length > 0) {
          setInterview(data.data[0]);
        }
      }
    } catch (error) {
      // Use mock data
      setOffboarding(mockOffboarding);
      setInterview(mockInterview);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const completeTask = async (taskId: string) => {
    try {
      const res = await fetch(`http://localhost:4733/api/offboarding/${offboarding?.instanceId}/task/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });

      if (res.ok) {
        const data = await res.json();
        setOffboarding(data.data);
      }
    } catch (error) {
      // Update locally for demo
      if (offboarding) {
        const updatedTasks = offboarding.tasks.map(t =>
          t.taskId === taskId ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString() } : t
        );
        const completedCount = updatedTasks.filter(t => t.status === 'completed' || t.status === 'skipped').length;
        setOffboarding({
          ...offboarding,
          tasks: updatedTasks,
          progress: Math.round((completedCount / updatedTasks.length) * 100)
        });
      }
    }
    setSelectedTask(null);
  };

  const submitFeedback = async () => {
    if (!feedback.trim() || !interview) return;

    try {
      await fetch(`http://localhost:4733/api/exit/${interview.interviewId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'other',
          feedbackType: 'comment',
          content: feedback,
          isAnonymous: false
        })
      });
    } catch (error) {
      logger.info('Feedback submitted (demo mode)');
    }
    setFeedback('');
    setShowInterviewModal(false);
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      knowledge_transfer: '📚',
      equipment_return: '💻',
      access_revocation: '🔐',
      documentation: '📄',
      clearance: '✅',
      final_payroll: '💰',
      other: '📋'
    };
    return icons[category] || '📋';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#F59E0B',
      in_progress: '#3B82F6',
      completed: '#22C55E',
      skipped: '#6B7280',
      blocked: '#EF4444'
    };
    return colors[status] || '#9CA3AF';
  };

  const getDaysRemaining = () => {
    if (!offboarding) return 0;
    const days = Math.ceil((new Date(offboarding.targetEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading your exit process...</Text>
      </View>
    );
  }

  if (!offboarding && !interview) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>👋</Text>
        <Text style={styles.emptyTitle}>No Active Exit Process</Text>
        <Text style={styles.emptyText}>
          You don't have any active exit process.
          This section will show your offboarding tasks when you resign.
        </Text>
      </View>
    );
  }

  const pendingTasks = offboarding?.tasks.filter(t => t.status !== 'completed') || [];
  const completedTasks = offboarding?.tasks.filter(t => t.status === 'completed') || [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8B5CF6']} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Exit Process</Text>
        <Text style={styles.subtitle}>
          {offboarding?.status === 'completed'
            ? 'All done! Thank you for your time.'
            : `${getDaysRemaining()} days until your last working day`}
        </Text>
      </View>

      {/* Progress Card */}
      {offboarding && (
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Offboarding Progress</Text>
            <Text style={styles.progressPercent}>{offboarding.progress}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${offboarding.progress}%` }]} />
          </View>
          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{completedTasks.length}</Text>
              <Text style={styles.progressStatLabel}>Done</Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{pendingTasks.length}</Text>
              <Text style={styles.progressStatLabel}>Remaining</Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{getDaysRemaining()}</Text>
              <Text style={styles.progressStatLabel}>Days Left</Text>
            </View>
          </View>
        </View>
      )}

      {/* Interview Status */}
      {interview && (
        <View style={styles.interviewCard}>
          <View style={styles.interviewHeader}>
            <View>
              <Text style={styles.interviewTitle}>Exit Interview</Text>
              <View style={[styles.statusBadge, { background: `${getStatusColor(interview.status)}20` }]}>
                <Text style={[styles.statusText, { color: getStatusColor(interview.status) }]}>
                  {interview.status.replace('_', ' ')}
                </Text>
              </View>
            </View>
            {interview.status !== 'completed' && (
              <TouchableOpacity
                style={styles.interviewBtn}
                onPress={() => setShowInterviewModal(true)}
              >
                <Text style={styles.interviewBtnText}>
                  {interview.status === 'scheduled' ? 'View Details' : 'Complete Interview'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {interview.overallRating && (
            <View style={styles.ratingRow}>
              <Text style={styles.ratingLabel}>Your Rating:</Text>
              <Text style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map(i => (
                  <Text key={i} style={{ color: i <= interview.overallRating! ? '#F59E0B' : '#E5E7EB' }}>★</Text>
                ))}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Tab Navigation */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tasks' && styles.activeTab]}
          onPress={() => setActiveTab('tasks')}
        >
          <Text style={[styles.tabText, activeTab === 'tasks' && styles.activeTabText]}>Tasks</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'clearance' && styles.activeTab]}
          onPress={() => setActiveTab('clearance')}
        >
          <Text style={[styles.tabText, activeTab === 'clearance' && styles.activeTabText]}>Clearance</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <View style={styles.content}>
          <View style={styles.overviewSection}>
            <Text style={styles.sectionTitle}>Your Tasks</Text>
            <View style={styles.overviewTasks}>
              {pendingTasks.slice(0, 3).map(task => (
                <View key={task.taskId} style={styles.overviewTask}>
                  <Text style={styles.overviewTaskIcon}>{getCategoryIcon(task.category)}</Text>
                  <Text style={styles.overviewTaskTitle}>{task.title}</Text>
                  <Text style={styles.overviewTaskDue}>
                    {new Date(task.dueDate).toLocaleDateString()}
                  </Text>
                </View>
              ))}
              {pendingTasks.length === 0 && (
                <Text style={styles.allDoneText}>All tasks completed!</Text>
              )}
            </View>
          </View>

          <View style={styles.overviewSection}>
            <Text style={styles.sectionTitle}>Clearance Status</Text>
            <View style={styles.clearanceList}>
              {offboarding?.clearanceChecklist.map(item => (
                <View key={item.category} style={styles.clearanceItem}>
                  <Text style={[styles.clearanceIcon, item.cleared && styles.clearedIcon]}>
                    {item.cleared ? '✓' : '○'}
                  </Text>
                  <Text style={[styles.clearanceText, item.cleared && styles.clearedText]}>
                    {item.category}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {activeTab === 'tasks' && (
        <View style={styles.content}>
          {pendingTasks.length > 0 && (
            <View style={styles.taskSection}>
              <Text style={styles.sectionTitle}>Pending Tasks</Text>
              {pendingTasks.sort((a, b) => a.order - b.order).map(task => (
                <TouchableOpacity
                  key={task.taskId}
                  style={styles.taskCard}
                  onPress={() => setSelectedTask(task)}
                >
                  <Text style={styles.taskIcon}>{getCategoryIcon(task.category)}</Text>
                  <View style={styles.taskContent}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskDue}>
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {completedTasks.length > 0 && (
            <View style={styles.taskSection}>
              <Text style={styles.sectionTitle}>Completed</Text>
              {completedTasks.sort((a, b) => a.order - b.order).map(task => (
                <View key={task.taskId} style={[styles.taskCard, styles.completedCard]}>
                  <Text style={styles.completedIcon}>✓</Text>
                  <View style={styles.taskContent}>
                    <Text style={[styles.taskTitle, styles.completedTitle]}>{task.title}</Text>
                    <Text style={styles.completedDate}>
                      {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : ''}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {activeTab === 'clearance' && (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Clearance Checklist</Text>
          <Text style={styles.clearanceDesc}>
            These clearances need to be completed before your last working day.
          </Text>
          {offboarding?.clearanceChecklist.map(item => (
            <View key={item.category} style={[styles.clearanceCard, item.cleared && styles.clearedCard]}>
              <View style={styles.clearanceHeader}>
                <Text style={[styles.clearanceIcon, item.cleared && styles.clearedIcon]}>
                  {item.cleared ? '✓' : '○'}
                </Text>
                <Text style={[styles.clearanceTitle, item.cleared && styles.clearedText]}>
                  {item.category}
                </Text>
              </View>
              {item.cleared && item.clearedAt && (
                <Text style={styles.clearanceDate}>
                  Cleared on {new Date(item.clearedAt).toLocaleDateString()}
                </Text>
              )}
              {!item.cleared && (
                <Text style={styles.clearancePending}>
                  Pending - will be completed by HR/Manager
                </Text>
              )}
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

            {selectedTask.assigneeType === 'employee' && selectedTask.status !== 'completed' && (
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

      {/* Interview Modal */}
      {showInterviewModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalIcon}>📋</Text>
              <Text style={styles.modalTitle}>Exit Interview</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowInterviewModal(false)}>
                <Text style={styles.closeBtnText}>×</Text>
              </TouchableOpacity>
            </View>

            {interview && (
              <>
                <Text style={styles.interviewInfo}>
                  Status: {interview.status.replace('_', ' ')}
                </Text>
                {interview.scheduledDate && (
                  <Text style={styles.interviewInfo}>
                    Scheduled: {new Date(interview.scheduledDate).toLocaleDateString()}
                  </Text>
                )}

                {interview.status !== 'completed' && (
                  <View style={styles.feedbackSection}>
                    <Text style={styles.feedbackLabel}>Share Your Feedback</Text>
                    <View style={styles.feedbackInput}>
                      <Text style={styles.feedbackPlaceholder}>
                        Help us improve by sharing your experience...
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.submitBtn}
                      onPress={submitFeedback}
                    >
                      <Text style={styles.submitBtnText}>Submit Feedback</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {interview.responses.length > 0 && (
                  <View style={styles.responsesSection}>
                    <Text style={styles.responsesTitle}>Your Responses</Text>
                    {interview.responses.map((r, i) => (
                      <View key={i} style={styles.responseItem}>
                        <Text style={styles.responseQ}>{r.question}</Text>
                        <Text style={styles.responseA}>{r.answer}</Text>
                        {r.rating && (
                          <Text style={styles.responseRating}>
                            {[1, 2, 3, 4, 5].map(i => (
                              <Text key={i} style={{ color: i <= r.rating! ? '#F59E0B' : '#E5E7EB' }}>★</Text>
                            ))}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

// Mock data for demo
const mockOffboarding: OffboardingInstance = {
  instanceId: 'OFB_1',
  employeeId: 'EMP-201',
  employeeName: 'Rahul Verma',
  startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  targetEndDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'in_progress',
  progress: 25,
  tasks: [
    {
      taskId: 'OT1',
      title: 'Knowledge transfer - documentation',
      assigneeType: 'employee',
      category: 'knowledge_transfer',
      status: 'completed',
      dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      order: 0,
      isRequired: true
    },
    {
      taskId: 'OT2',
      title: 'Return company equipment',
      assigneeType: 'employee',
      category: 'equipment_return',
      status: 'in_progress',
      dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      order: 1,
      isRequired: true
    },
    {
      taskId: 'OT3',
      title: 'Revoke system access',
      assigneeType: 'it',
      category: 'access_revocation',
      status: 'pending',
      dueDate: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000).toISOString(),
      order: 2,
      isRequired: true
    },
    {
      taskId: 'OT4',
      title: 'Final payroll processing',
      assigneeType: 'finance',
      category: 'final_payroll',
      status: 'pending',
      dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
      order: 3,
      isRequired: true
    },
    {
      taskId: 'OT5',
      title: 'Manager clearance',
      assigneeType: 'manager',
      category: 'clearance',
      status: 'pending',
      dueDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
      order: 4,
      isRequired: true
    }
  ],
  clearanceChecklist: [
    { category: 'Manager Clearance', cleared: true, clearedBy: 'admin-001', clearedAt: new Date().toISOString() },
    { category: 'IT Clearance', cleared: false },
    { category: 'Finance Clearance', cleared: false },
    { category: 'HR Clearance', cleared: false }
  ],
  notes: []
};

const mockInterview: ExitInterview = {
  interviewId: 'EXT_1',
  employeeName: 'Rahul Verma',
  type: 'resignation',
  scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'scheduled',
  responses: [],
  overallRating: undefined
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#8B5CF6'
  },
  progressCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  progressTitle: {
    fontSize: 14,
    color: '#6b7280'
  },
  progressPercent: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8B5CF6'
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  progressStat: {
    alignItems: 'center'
  },
  progressStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937'
  },
  progressStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2
  },
  interviewCard: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16
  },
  interviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  interviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start'
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize'
  },
  interviewBtn: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  interviewBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500'
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  ratingLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8
  },
  ratingStars: {
    fontSize: 16
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8
  },
  activeTab: {
    backgroundColor: '#8B5CF6'
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280'
  },
  activeTabText: {
    color: '#fff'
  },
  content: {
    paddingHorizontal: 16
  },
  overviewSection: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12
  },
  overviewTasks: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12
  },
  overviewTask: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  overviewTaskIcon: {
    fontSize: 18,
    marginRight: 10
  },
  overviewTaskTitle: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937'
  },
  overviewTaskDue: {
    fontSize: 12,
    color: '#6b7280'
  },
  allDoneText: {
    fontSize: 14,
    color: '#22C55E',
    textAlign: 'center',
    padding: 16
  },
  clearanceList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12
  },
  clearanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10
  },
  clearanceIcon: {
    fontSize: 18,
    color: '#6b7280',
    marginRight: 10
  },
  clearedIcon: {
    color: '#22C55E'
  },
  clearanceText: {
    fontSize: 14,
    color: '#1f2937'
  },
  clearedText: {
    color: '#6b7280'
  },
  taskSection: {
    marginBottom: 20
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  completedCard: {
    backgroundColor: '#f9fafb'
  },
  taskIcon: {
    fontSize: 24,
    marginRight: 12
  },
  completedIcon: {
    fontSize: 20,
    color: '#22C55E',
    marginRight: 12
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
    color: '#9ca3af'
  },
  taskDue: {
    fontSize: 12,
    color: '#6b7280'
  },
  completedDate: {
    fontSize: 12,
    color: '#22C55E'
  },
  chevron: {
    fontSize: 24,
    color: '#9ca3af'
  },
  clearanceDesc: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16
  },
  clearanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  clearedCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0'
  },
  clearanceHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  clearanceTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937'
  },
  clearanceDate: {
    fontSize: 12,
    color: '#22C55E',
    marginTop: 8,
    marginLeft: 28
  },
  clearancePending: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 4,
    marginLeft: 28
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
  modalDetails: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
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
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center'
  },
  completeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  interviewInfo: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4
  },
  feedbackSection: {
    marginTop: 20
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8
  },
  feedbackInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    justifyContent: 'center'
  },
  feedbackPlaceholder: {
    fontSize: 14,
    color: '#9ca3af'
  },
  submitBtn: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 12
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600'
  },
  responsesSection: {
    marginTop: 20
  },
  responsesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 12
  },
  responseItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8
  },
  responseQ: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4
  },
  responseA: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 4
  },
  responseRating: {
    fontSize: 14
  },
  bottomPadding: {
    height: 32
  }
});
