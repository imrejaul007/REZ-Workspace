'use client';

import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';

// Types
interface KeyResult {
  id: string;
  title: string;
  metric?: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
}

interface Goal {
  id: string;
  title: string;
  description?: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  timeframe: 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'project';
  dueDate?: string;
  startDate?: string;
  keyResults: KeyResult[];
  weight?: number;
}

interface GoalStats {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  avgProgress: number;
}

// API base URL
const API_BASE = process.env.NEXT_PUBLIC_PERFORMANCE_API || 'http://localhost:4729';

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showUpdateProgress, setShowUpdateProgress] = useState(false);
  const [progressValue, setProgressValue] = useState(0);

  // New goal form
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    timeframe: 'quarterly' as const,
    dueDate: '',
    keyResults: [{ title: '', targetValue: '', unit: '' }],
  });

  // Fetch goals
  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      const userId = 'current-user'; // In real app, get from auth
      const res = await fetch(`${API_BASE}/api/goals?employeeId=${userId}`);
      const data = await res.json();

      if (data.success) {
        setGoals(data.data || []);
      }
    } catch {
      // Use mock data as fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Mock goals data
  const mockGoals: Goal[] = [
    {
      id: '1',
      title: 'Complete AWS Solutions Architect Certification',
      description: 'Obtain AWS Solutions Architect Professional certification to demonstrate cloud expertise',
      progress: 70,
      status: 'in_progress',
      timeframe: 'quarterly',
      dueDate: '2026-06-30',
      keyResults: [
        { id: 'kr1', title: 'Complete video course', targetValue: 100, currentValue: 80, unit: '%' },
        { id: 'kr2', title: 'Practice exams score', targetValue: 85, currentValue: 65, unit: '%' },
        { id: 'kr3', title: 'Hands-on labs completed', targetValue: 10, currentValue: 7, unit: 'labs' },
      ],
    },
    {
      id: '2',
      title: 'Launch New Product Dashboard',
      description: 'Design and develop a comprehensive product analytics dashboard',
      progress: 90,
      status: 'in_progress',
      timeframe: 'project',
      dueDate: '2026-05-30',
      keyResults: [
        { id: 'kr1', title: 'UI design completed', targetValue: 1, currentValue: 1, unit: 'design' },
        { id: 'kr2', title: 'Backend API endpoints', targetValue: 15, currentValue: 14, unit: 'endpoints' },
        { id: 'kr3', title: 'Test coverage', targetValue: 80, currentValue: 75, unit: '%' },
      ],
    },
    {
      id: '3',
      title: 'Improve Team Collaboration',
      description: 'Enhance cross-team communication and collaboration processes',
      progress: 50,
      status: 'in_progress',
      timeframe: 'quarterly',
      keyResults: [
        { id: 'kr1', title: 'Team sync meetings', targetValue: 12, currentValue: 6, unit: 'meetings' },
        { id: 'kr2', title: 'Documentation updates', targetValue: 5, currentValue: 3, unit: 'docs' },
      ],
    },
    {
      id: '4',
      title: 'Complete React Native Project',
      progress: 100,
      status: 'completed',
      timeframe: 'project',
      dueDate: '2026-04-15',
      keyResults: [],
    },
  ];

  const displayGoals = goals.length > 0 ? goals : mockGoals;

  // Filter goals
  const filteredGoals = displayGoals.filter(goal => {
    if (filter === 'active') return goal.status === 'in_progress' || goal.status === 'not_started';
    if (filter === 'completed') return goal.status === 'completed';
    return true;
  });

  // Calculate stats
  const stats: GoalStats = {
    total: displayGoals.length,
    completed: displayGoals.filter(g => g.status === 'completed').length,
    inProgress: displayGoals.filter(g => g.status === 'in_progress').length,
    overdue: displayGoals.filter(g =>
      g.dueDate && new Date(g.dueDate) < new Date() && g.status !== 'completed'
    ).length,
    avgProgress: Math.round(
      displayGoals.reduce((acc, g) => acc + g.progress, 0) / displayGoals.length
    ),
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return '#10b981';
    if (progress >= 50) return '#8b5cf6';
    if (progress >= 25) return '#f59e0b';
    return '#ef4444';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      not_started: 'Not Started',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  const getTimeframeLabel = (timeframe: string) => {
    const labels: Record<string, string> = {
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      annual: 'Annual',
      project: 'Project',
    };
    return labels[timeframe] || timeframe;
  };

  const handleAddKeyResult = () => {
    setNewGoal({
      ...newGoal,
      keyResults: [...newGoal.keyResults, { title: '', targetValue: '', unit: '' }],
    });
  };

  const handleRemoveKeyResult = (index: number) => {
    setNewGoal({
      ...newGoal,
      keyResults: newGoal.keyResults.filter((_, i) => i !== index),
    });
  };

  const handleUpdateKeyResult = (index: number, field: string, value: string) => {
    const updated = [...newGoal.keyResults];
    updated[index] = { ...updated[index], [field]: value };
    setNewGoal({ ...newGoal, keyResults: updated });
  };

  const handleSubmitGoal = () => {
    if (!newGoal.title.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }

    Alert.alert('Success', 'Goal created successfully!');
    setShowAddGoal(false);
    setNewGoal({
      title: '',
      description: '',
      timeframe: 'quarterly',
      dueDate: '',
      keyResults: [{ title: '', targetValue: '', unit: '' }],
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Goals</Text>
        <Text style={styles.subtitle}>Set, track and achieve your goals</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#f3e8ff' }]}>
          <Text style={[styles.statValue, { color: '#8b5cf6' }]}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#dcfce7' }]}>
          <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats.inProgress}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#fee2e2' }]}>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>{stats.avgProgress}%</Text>
          <Text style={styles.statLabel}>Avg Progress</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {(['all', 'active', 'completed'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Completed'}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddGoal(true)}
        >
          <Text style={styles.addButtonText}>+ Add Goal</Text>
        </TouchableOpacity>
      </View>

      {/* Goals List */}
      <View style={styles.goalsList}>
        {filteredGoals.map(goal => (
          <TouchableOpacity
            key={goal.id}
            style={styles.goalCard}
            onPress={() => {
              setSelectedGoal(goal);
              setProgressValue(goal.progress);
            }}
          >
            <View style={styles.goalHeader}>
              <View style={styles.goalInfo}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <View style={styles.goalMeta}>
                  <View style={[styles.timeframeBadge, { backgroundColor: '#f3e8ff' }]}>
                    <Text style={styles.timeframeText}>{getTimeframeLabel(goal.timeframe)}</Text>
                  </View>
                  {goal.dueDate && (
                    <Text style={styles.dueDate}>Due: {new Date(goal.dueDate).toLocaleDateString()}</Text>
                  )}
                </View>
              </View>
              <View style={[styles.statusBadge, {
                backgroundColor: goal.status === 'completed' ? '#dcfce7' :
                               goal.status === 'in_progress' ? '#fef3c7' : '#f3f4f6'
              }]}>
                <Text style={[styles.statusText, {
                  color: goal.status === 'completed' ? '#15803d' :
                         goal.status === 'in_progress' ? '#b45309' : '#6b7280'
                }]}>
                  {getStatusLabel(goal.status)}
                </Text>
              </View>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={[styles.progressValue, { color: getProgressColor(goal.progress) }]}>
                  {goal.progress}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, {
                  width: `${goal.progress}%`,
                  backgroundColor: getProgressColor(goal.progress),
                }]} />
              </View>
            </View>

            {goal.keyResults.length > 0 && (
              <View style={styles.keyResultsPreview}>
                <Text style={styles.keyResultsTitle}>
                  Key Results ({goal.keyResults.filter(kr => (kr.currentValue || 0) >= (kr.targetValue || 0)).length}/{goal.keyResults.length})
                </Text>
                <View style={styles.keyResultsList}>
                  {goal.keyResults.slice(0, 2).map(kr => (
                    <View key={kr.id} style={styles.keyResultChip}>
                      <Text style={styles.keyResultText} numberOfLines={1}>
                        {kr.title}
                      </Text>
                      <Text style={styles.keyResultValue}>
                        {kr.currentValue || 0}/{kr.targetValue} {kr.unit}
                      </Text>
                    </View>
                  ))}
                  {goal.keyResults.length > 2 && (
                    <Text style={styles.moreText}>+{goal.keyResults.length - 2} more</Text>
                  )}
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Goal Detail Modal */}
      <Modal
        visible={!!selectedGoal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedGoal(null)}
      >
        {selectedGoal && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Goal Details</Text>
              <TouchableOpacity onPress={() => setSelectedGoal(null)}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.goalDetailTitle}>{selectedGoal.title}</Text>
              {selectedGoal.description && (
                <Text style={styles.goalDetailDesc}>{selectedGoal.description}</Text>
              )}

              <View style={styles.goalMetaRow}>
                <View style={[styles.badge, { backgroundColor: '#f3e8ff' }]}>
                  <Text style={[styles.badgeText, { color: '#8b5cf6' }]}>
                    {getTimeframeLabel(selectedGoal.timeframe)}
                  </Text>
                </View>
                <View style={[styles.badge, {
                  backgroundColor: selectedGoal.status === 'completed' ? '#dcfce7' : '#fef3c7'
                }]}>
                  <Text style={[styles.badgeText, {
                    color: selectedGoal.status === 'completed' ? '#15803d' : '#b45309'
                  }]}>
                    {getStatusLabel(selectedGoal.status)}
                  </Text>
                </View>
              </View>

              {selectedGoal.dueDate && (
                <Text style={styles.dateText}>
                  Due: {new Date(selectedGoal.dueDate).toLocaleDateString()}
                </Text>
              )}

              {/* Progress Update */}
              <TouchableOpacity
                style={styles.updateButton}
                onPress={() => setShowUpdateProgress(true)}
              >
                <Text style={styles.updateButtonText}>Update Progress</Text>
              </TouchableOpacity>

              {/* Key Results */}
              {selectedGoal.keyResults.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Key Results</Text>
                  {selectedGoal.keyResults.map(kr => {
                    const progress = kr.targetValue
                      ? Math.round(((kr.currentValue || 0) / kr.targetValue) * 100)
                      : 0;
                    return (
                      <View key={kr.id} style={styles.keyResultCard}>
                        <View style={styles.keyResultHeader}>
                          <Text style={styles.keyResultTitle}>{kr.title}</Text>
                          <Text style={styles.keyResultMetric}>
                            {kr.currentValue || 0} / {kr.targetValue || '-'} {kr.unit}
                          </Text>
                        </View>
                        <View style={styles.keyResultProgress}>
                          <View style={[styles.keyResultFill, {
                            width: `${Math.min(progress, 100)}%`,
                            backgroundColor: progress >= 100 ? '#10b981' : '#8b5cf6',
                          }]} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* Update Progress Modal */}
      <Modal
        visible={showUpdateProgress}
        animationType="fade"
        transparent
        onRequestClose={() => setShowUpdateProgress(false)}
      >
        <View style={styles.updateModalOverlay}>
          <View style={styles.updateModalContent}>
            <Text style={styles.updateModalTitle}>Update Progress</Text>
            <Text style={styles.updateModalValue}>{progressValue}%</Text>
            <View style={styles.progressSlider}>
              {[0, 25, 50, 75, 100].map(val => (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.progressOption,
                    progressValue === val && styles.progressOptionActive
                  ]}
                  onPress={() => setProgressValue(val)}
                >
                  <Text style={[
                    styles.progressOptionText,
                    progressValue === val && styles.progressOptionTextActive
                  ]}>{val}%</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.updateModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowUpdateProgress(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => {
                  Alert.alert('Success', 'Progress updated successfully!');
                  setShowUpdateProgress(false);
                  setSelectedGoal(null);
                }}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Goal Modal */}
      <Modal
        visible={showAddGoal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddGoal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Goal</Text>
            <TouchableOpacity onPress={() => setShowAddGoal(false)}>
              <Text style={styles.closeButton}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Goal Title *</Text>
              <TextInput
                style={styles.input}
                value={newGoal.title}
                onChangeText={(text) => setNewGoal({ ...newGoal, title: text })}
                placeholder="What do you want to achieve?"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                value={newGoal.description}
                onChangeText={(text) => setNewGoal({ ...newGoal, description: text })}
                placeholder="Describe your goal in detail..."
                multiline
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Timeframe</Text>
                <View style={styles.timeframeOptions}>
                  {(['weekly', 'monthly', 'quarterly', 'annual', 'project'] as const).map(tf => (
                    <TouchableOpacity
                      key={tf}
                      style={[styles.timeframeOption, newGoal.timeframe === tf && styles.timeframeOptionActive]}
                      onPress={() => setNewGoal({ ...newGoal, timeframe: tf })}
                    >
                      <Text style={[styles.timeframeOptionText, newGoal.timeframe === tf && styles.timeframeOptionTextActive]}>
                        {getTimeframeLabel(tf)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Due Date</Text>
              <TextInput
                style={styles.input}
                value={newGoal.dueDate}
                onChangeText={(text) => setNewGoal({ ...newGoal, dueDate: text })}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View style={styles.formGroup}>
              <View style={styles.krHeader}>
                <Text style={styles.formLabel}>Key Results</Text>
                <TouchableOpacity onPress={handleAddKeyResult}>
                  <Text style={styles.addKrText}>+ Add</Text>
                </TouchableOpacity>
              </View>
              {newGoal.keyResults.map((kr, index) => (
                <View key={index} style={styles.krRow}>
                  <TextInput
                    style={[styles.krInput, { flex: 2 }]}
                    value={kr.title}
                    onChangeText={(text) => handleUpdateKeyResult(index, 'title', text)}
                    placeholder="Key result title"
                  />
                  <TextInput
                    style={[styles.krInput, { flex: 1 }]}
                    value={kr.targetValue}
                    onChangeText={(text) => handleUpdateKeyResult(index, 'targetValue', text)}
                    placeholder="Target"
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.krInput, { flex: 1 }]}
                    value={kr.unit}
                    onChangeText={(text) => handleUpdateKeyResult(index, 'unit', text)}
                    placeholder="Unit"
                  />
                  {newGoal.keyResults.length > 1 && (
                    <TouchableOpacity onPress={() => handleRemoveKeyResult(index)}>
                      <Text style={styles.removeKr}>X</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmitGoal}
            >
              <Text style={styles.submitButtonText}>Create Goal</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    backgroundColor: '#8b5cf6',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: '#ddd6fe',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  filterText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: 'white',
  },
  addButton: {
    marginLeft: 'auto',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#10b981',
  },
  addButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  goalsList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  goalCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  goalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  timeframeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  timeframeText: {
    fontSize: 11,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  dueDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  keyResultsPreview: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  keyResultsTitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  keyResultsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  keyResultChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    maxWidth: '100%',
  },
  keyResultText: {
    fontSize: 12,
    color: '#374151',
    maxWidth: 100,
  },
  keyResultValue: {
    fontSize: 11,
    color: '#8b5cf6',
    marginLeft: 4,
    fontWeight: '600',
  },
  moreText: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 16,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  goalDetailTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  goalDetailDesc: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
    marginBottom: 16,
  },
  goalMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  updateButton: {
    backgroundColor: '#8b5cf6',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  keyResultCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  keyResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  keyResultTitle: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  keyResultMetric: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  keyResultProgress: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  keyResultFill: {
    height: '100%',
    borderRadius: 3,
  },
  updateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  updateModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  updateModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  updateModalValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#8b5cf6',
    textAlign: 'center',
    marginBottom: 20,
  },
  progressSlider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  progressOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  progressOptionActive: {
    backgroundColor: '#8b5cf6',
  },
  progressOptionText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  progressOptionTextActive: {
    color: 'white',
  },
  updateModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  timeframeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeframeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  timeframeOptionActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  timeframeOptionText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  timeframeOptionTextActive: {
    color: 'white',
  },
  krHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addKrText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  krRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  krInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 8,
    fontSize: 13,
  },
  removeKr: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
    padding: 4,
  },
  submitButton: {
    backgroundColor: '#8b5cf6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 40,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
