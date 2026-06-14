'use client';

import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator, RefreshControl } from 'react-native';

// Types matching OKR service
interface KeyResult {
  _id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  weight: number;
  startValue: number;
  status: 'on_track' | 'at_risk' | 'behind' | 'completed';
}

interface Objective {
  _id: string;
  title: string;
  description?: string;
  quarter: 1 | 2 | 3 | 4;
  year: number;
  ownerId: string;
  ownerName?: string;
  departmentId?: string;
  departmentName?: string;
  type: 'company' | 'department' | 'individual';
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  progress: number;
  keyResults: KeyResult[];
  milestones: Array<{
    _id: string;
    title: string;
    deadline: string;
    completed: boolean;
  }>;
}

// API base URL
const OKR_API = process.env.OKR_SERVICE_URL || 'http://localhost:4730';

export default function OKRPage() {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState('Q2 2026');
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateKRId, setUpdateKRId] = useState<string>('');
  const [updateValue, setUpdateValue] = useState('');

  const fetchObjectives = useCallback(async () => {
    try {
      const userId = 'current-user';
      const response = await fetch(
        `${OKR_API}/api/objectives/owner/${userId}?quarter=2&year=2026`,
        {
          headers: {
            'X-Internal-Token': process.env.OKR_SERVICE_TOKEN || '',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setObjectives(data.data);
          return;
        }
      }
    } catch {
      // Fall through to mock data
    }

    // Mock data fallback
    setObjectives(mockObjectives);
  }, []);

  useEffect(() => {
    fetchObjectives();
  }, [fetchObjectives]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchObjectives();
    setRefreshing(false);
  };

  const handleUpdateProgress = async () => {
    if (!selectedObjective || !updateKRId || !updateValue) return;

    try {
      const response = await fetch(
        `${OKR_API}/api/objectives/${selectedObjective._id}/progress`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': process.env.OKR_SERVICE_TOKEN || '',
          },
          body: JSON.stringify({
            keyResultId: updateKRId,
            current: parseFloat(updateValue),
          }),
        }
      );

      if (response.ok) {
        await fetchObjectives();
        setShowUpdateModal(false);
        setUpdateValue('');
        setUpdateKRId('');
      }
    } catch {
      // Handle error
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 70) return '#10b981';
    if (progress >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      on_track: { bg: '#dcfce7', text: '#15803d' },
      at_risk: { bg: '#fef3c7', text: '#d97706' },
      behind: { bg: '#fee2e2', text: '#dc2626' },
      completed: { bg: '#dbeafe', text: '#1d4ed8' },
    };
    return colors[status] || { bg: '#f3f4f6', text: '#6b7280' };
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      company: { bg: '#dbeafe', text: '#1d4ed8' },
      department: { bg: '#dcfce7', text: '#15803d' },
      individual: { bg: '#fef3c7', text: '#d97706' },
    };
    return colors[type] || { bg: '#f3f4f6', text: '#6b7280' };
  };

  // Mock data
  const mockObjectives: Objective[] = [
    {
      _id: '1',
      title: 'Complete AWS Solutions Architect Certification',
      description: 'Obtain AWS Solutions Architect certification',
      quarter: 2,
      year: 2026,
      ownerId: 'current-user',
      ownerName: 'You',
      type: 'individual',
      status: 'active',
      progress: 70,
      keyResults: [
        { _id: 'kr1', title: 'Study hours completed', target: 40, current: 28, unit: 'hours', weight: 1, startValue: 0, status: 'on_track' },
        { _id: 'kr2', title: 'Practice exams taken', target: 5, current: 3, unit: 'exams', weight: 1, startValue: 0, status: 'on_track' },
        { _id: 'kr3', title: 'Lab exercises completed', target: 20, current: 12, unit: 'labs', weight: 1, startValue: 0, status: 'at_risk' },
      ],
      milestones: [
        { _id: 'm1', title: 'Complete video course', deadline: '2026-05-15', completed: true },
        { _id: 'm2', title: 'Pass practice exam', deadline: '2026-06-01', completed: false },
      ],
    },
    {
      _id: '2',
      title: 'Improve team collaboration',
      quarter: 2,
      year: 2026,
      ownerId: 'current-user',
      ownerName: 'You',
      type: 'individual',
      status: 'active',
      progress: 45,
      keyResults: [
        { _id: 'kr4', title: '1:1 meetings conducted', target: 8, current: 4, unit: 'meetings', weight: 1, startValue: 0, status: 'on_track' },
        { _id: 'kr5', title: 'Knowledge sharing sessions', target: 4, current: 1, unit: 'sessions', weight: 1, startValue: 0, status: 'behind' },
      ],
      milestones: [],
    },
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My OKRs</Text>
          <Text style={styles.subtitle}>Track your objectives for {selectedQuarter}</Text>
        </View>

        {/* Quarter Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quarterSelector}>
          {['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026'].map((q) => (
            <TouchableOpacity
              key={q}
              onPress={() => setSelectedQuarter(q)}
              style={[
                styles.quarterButton,
                selectedQuarter === q && styles.quarterButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.quarterButtonText,
                  selectedQuarter === q && styles.quarterButtonTextActive,
                ]}
              >
                {q}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Stats Summary */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#8b5cf6' }]}>
            <Text style={styles.statValue}>
              {objectives.length > 0
                ? Math.round(objectives.reduce((sum, o) => sum + o.progress, 0) / objectives.length)
                : 0}%
            </Text>
            <Text style={styles.statLabel}>Overall</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#10b981' }]}>{objectives.length}</Text>
            <Text style={styles.statLabel}>Objectives</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>
              {objectives.filter((o) => o.progress < 70 && o.progress >= 40).length}
            </Text>
            <Text style={styles.statLabel}>At Risk</Text>
          </View>
        </View>

        {/* Objectives List */}
        <Text style={styles.sectionTitle}>Your Objectives</Text>
        {objectives.map((objective) => (
          <TouchableOpacity
            key={objective._id}
            onPress={() => setSelectedObjective(objective)}
            style={styles.objectiveCard}
          >
            <View style={styles.objectiveHeader}>
              <View style={styles.objectiveInfo}>
                <View style={styles.badgeRow}>
                  <View style={[styles.badge, getTypeBadge(objective.type)]}>
                    <Text style={[styles.badgeText, getTypeBadge(objective.type)]}>
                      {objective.type}
                    </Text>
                  </View>
                  <Text style={styles.quarterText}>Q{objective.quarter}</Text>
                </View>
                <Text style={styles.objectiveTitle}>{objective.title}</Text>
                {objective.ownerName && (
                  <Text style={styles.ownerText}>Owner: {objective.ownerName}</Text>
                )}
              </View>
              <View style={styles.progressCircle}>
                <Text style={[styles.progressText, { color: getProgressColor(objective.progress) }]}>
                  {objective.progress}%
                </Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${objective.progress}%`,
                    backgroundColor: getProgressColor(objective.progress),
                  },
                ]}
              />
            </View>
          </TouchableOpacity>
        ))}

        {objectives.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No OKRs found for this quarter</Text>
            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.addButtonText}>+ Create OKR</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Objective Detail Modal */}
      <Modal visible={!!selectedObjective} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setSelectedObjective(null)}>
                  <Text style={styles.closeButton}>Close</Text>
                </TouchableOpacity>
              </View>

              {selectedObjective && (
                <>
                  <View style={styles.badgeRow}>
                    <View style={[styles.badge, getTypeBadge(selectedObjective.type)]}>
                      <Text style={[styles.badgeText, getTypeBadge(selectedObjective.type)]}>
                        {selectedObjective.type}
                      </Text>
                    </View>
                    <Text style={styles.quarterText}>Q{selectedObjective.quarter} {selectedObjective.year}</Text>
                  </View>

                  <Text style={styles.modalTitle}>{selectedObjective.title}</Text>
                  {selectedObjective.description && (
                    <Text style={styles.modalDescription}>{selectedObjective.description}</Text>
                  )}

                  <View style={styles.overallProgress}>
                    <Text style={styles.overallProgressLabel}>Overall Progress</Text>
                    <Text style={[styles.overallProgressValue, { color: getProgressColor(selectedObjective.progress) }]}>
                      {selectedObjective.progress}%
                    </Text>
                  </View>

                  <Text style={styles.sectionTitle}>Key Results</Text>
                  {selectedObjective.keyResults.map((kr) => {
                    const krProgress = kr.target > 0
                      ? Math.min(100, ((kr.current - kr.startValue) / (kr.target - kr.startValue)) * 100)
                      : 0;
                    return (
                      <View key={kr._id} style={styles.krCard}>
                        <View style={styles.krHeader}>
                          <Text style={styles.krTitle}>{kr.title}</Text>
                          <View style={[styles.statusBadge, getStatusBadge(kr.status)]}>
                            <Text style={[styles.statusText, getStatusBadge(kr.status)]}>
                              {kr.status.replace('_', ' ')}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.krProgress}>
                          {kr.current} / {kr.target} {kr.unit}
                        </Text>
                        <View style={styles.krProgressBar}>
                          <View
                            style={[
                              styles.krProgressFill,
                              {
                                width: `${krProgress}%`,
                                backgroundColor: getProgressColor(krProgress),
                              },
                            ]}
                          />
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            setUpdateKRId(kr._id);
                            setUpdateValue(String(kr.current));
                            setShowUpdateModal(true);
                          }}
                          style={styles.updateButton}
                        >
                          <Text style={styles.updateButtonText}>Update Progress</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}

                  {selectedObjective.milestones.length > 0 && (
                    <>
                      <Text style={styles.sectionTitle}>Milestones</Text>
                      {selectedObjective.milestones.map((milestone) => (
                        <View key={milestone._id} style={styles.milestoneRow}>
                          <View style={[
                            styles.milestoneCheckbox,
                            milestone.completed && styles.milestoneCheckboxCompleted
                          ]}>
                            {milestone.completed && <Text style={styles.checkmark}>✓</Text>}
                          </View>
                          <View style={styles.milestoneInfo}>
                            <Text style={[
                              styles.milestoneTitle,
                              milestone.completed && styles.milestoneCompleted
                            ]}>
                              {milestone.title}
                            </Text>
                            <Text style={styles.milestoneDate}>
                              Due: {new Date(milestone.deadline).toLocaleDateString()}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Update Progress Modal */}
      <Modal visible={showUpdateModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.updateModalContent}>
            <Text style={styles.updateModalTitle}>Update Key Result</Text>
            <TextInput
              style={styles.input}
              value={updateValue}
              onChangeText={setUpdateValue}
              placeholder="Enter new value"
              keyboardType="numeric"
            />
            <View style={styles.updateModalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setShowUpdateModal(false);
                  setUpdateValue('');
                  setUpdateKRId('');
                }}
                style={[styles.updateModalButton, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdateProgress}
                style={[styles.updateModalButton, styles.submitButton]}
              >
                <Text style={styles.submitButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  quarterSelector: {
    marginBottom: 16,
  },
  quarterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quarterButtonActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  quarterButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  quarterButtonTextActive: {
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  objectiveCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  objectiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  objectiveInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  quarterText: {
    fontSize: 12,
    color: '#6b7280',
  },
  objectiveTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  ownerText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  progressCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyText: {
    color: '#6b7280',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  closeButton: {
    color: '#8b5cf6',
    fontWeight: '600',
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  overallProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  overallProgressLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  overallProgressValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  krCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  krHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  krTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  krProgress: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  krProgressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginBottom: 12,
  },
  krProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  updateButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  milestoneCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneCheckboxCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkmark: {
    color: '#fff',
    fontWeight: '700',
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  milestoneCompleted: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  milestoneDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  updateModalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    width: '85%',
    alignSelf: 'center',
  },
  updateModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1f2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  updateModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  updateModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#8b5cf6',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
