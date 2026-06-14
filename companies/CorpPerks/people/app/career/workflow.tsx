'use client';

import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator, RefreshControl } from 'react-native';

// Types matching Workflow service
interface WorkflowStep {
  _id: string;
  name: string;
  order: number;
  approverId?: string;
  approverName?: string;
  action: 'approve' | 'reject' | 'notify' | 'complete';
}

interface StepHistory {
  stepId: string;
  stepName: string;
  action: 'approve' | 'reject' | 'notify' | 'complete';
  actionBy?: string;
  actionByName?: string;
  actionAt?: string;
  comments?: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
}

interface WorkflowInstance {
  _id: string;
  workflowId: string;
  workflowName?: string;
  workflowVersion: number;
  initiatorId: string;
  initiatorName?: string;
  currentStepIndex: number;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'cancelled';
  data: Record<string, unknown>;
  stepHistory: StepHistory[];
  createdAt: string;
  updatedAt: string;
}

// API base URL
const WORKFLOW_API = process.env.WORKFLOW_SERVICE_URL || 'http://localhost:4731';

export default function WorkflowPage() {
  const [myInstances, setMyInstances] = useState<WorkflowInstance[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<WorkflowInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'my' | 'pending'>('my');
  const [selectedInstance, setSelectedInstance] = useState<WorkflowInstance | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const userId = 'current-user';

      // Fetch my initiated workflows
      const myRes = await fetch(
        `${WORKFLOW_API}/api/workflows/instances?initiatorId=${userId}&limit=50`,
        {
          headers: {
            'X-Internal-Token': process.env.WORKFLOW_SERVICE_TOKEN || '',
          },
        }
      );

      // Fetch pending approvals for me
      const pendingRes = await fetch(
        `${WORKFLOW_API}/api/workflows/pending/${userId}`,
        {
          headers: {
            'X-Internal-Token': process.env.WORKFLOW_SERVICE_TOKEN || '',
          },
        }
      );

      if (myRes.ok) {
        const myData = await myRes.json();
        if (myData.success) {
          setMyInstances(myData.data);
        }
      }

      if (pendingRes.ok) {
        const pendingData = await pendingRes.json();
        if (pendingData.success) {
          setPendingApprovals(pendingData.data);
        }
      }

      // If no API data, use mock
      if ((!myRes.ok || !pendingRes.ok) && myInstances.length === 0) {
        setMyInstances(mockMyInstances);
        setPendingApprovals(mockPendingApprovals);
      }
    } catch {
      // Use mock data as fallback
      setMyInstances(mockMyInstances);
      setPendingApprovals(mockPendingApprovals);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      pending: { bg: '#fef3c7', text: '#d97706' },
      in_progress: { bg: '#dbeafe', text: '#1d4ed8' },
      approved: { bg: '#dcfce7', text: '#15803d' },
      rejected: { bg: '#fee2e2', text: '#dc2626' },
      cancelled: { bg: '#f3f4f6', text: '#6b7280' },
    };
    return colors[status] || { bg: '#f3f4f6', text: '#6b7280' };
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approved':
        return '✓';
      case 'rejected':
        return '✗';
      case 'pending':
        return '○';
      case 'skipped':
        return '—';
      default:
        return '○';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getStepProgress = (instance: WorkflowInstance) => {
    const completedSteps = instance.stepHistory.filter(s => s.status === 'approved').length;
    return {
      current: instance.currentStepIndex + 1,
      total: instance.stepHistory.length,
      completed: completedSteps
    };
  };

  // Mock data
  const mockMyInstances: WorkflowInstance[] = [
    {
      _id: 'my-1',
      workflowId: 'wf-1',
      workflowName: 'Leave Request',
      workflowVersion: 1,
      initiatorId: 'current-user',
      initiatorName: 'You',
      currentStepIndex: 1,
      status: 'in_progress',
      data: {
        leaveType: 'Sick Leave',
        startDate: '2026-06-01',
        endDate: '2026-06-02',
        days: 2,
        reason: 'Medical appointment'
      },
      stepHistory: [
        { stepId: 's1', stepName: 'Manager Approval', action: 'approve', status: 'approved', actionBy: 'mgr-001', actionByName: 'Sarah Chen', actionAt: new Date(Date.now() - 86400000).toISOString() },
        { stepId: 's2', stepName: 'HR Review', action: 'approve', status: 'pending' }
      ],
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'my-2',
      workflowId: 'wf-2',
      workflowName: 'Expense Reimbursement',
      workflowVersion: 1,
      initiatorId: 'current-user',
      initiatorName: 'You',
      currentStepIndex: 2,
      status: 'approved',
      data: {
        amount: 2500,
        category: 'Travel',
        description: 'Client meeting expenses'
      },
      stepHistory: [
        { stepId: 's3', stepName: 'Manager Approval', action: 'approve', status: 'approved', actionBy: 'mgr-001', actionByName: 'Sarah Chen', actionAt: new Date(Date.now() - 604800000).toISOString() },
        { stepId: 's4', stepName: 'Finance Review', action: 'approve', status: 'approved', actionBy: 'fin-001', actionByName: 'Finance Team', actionAt: new Date(Date.now() - 432000000).toISOString() }
      ],
      createdAt: new Date(Date.now() - 691200000).toISOString(),
      updatedAt: new Date(Date.now() - 432000000).toISOString()
    },
    {
      _id: 'my-3',
      workflowId: 'wf-3',
      workflowName: 'Equipment Request',
      workflowVersion: 1,
      initiatorId: 'current-user',
      initiatorName: 'You',
      currentStepIndex: 0,
      status: 'rejected',
      data: {
        equipment: 'External Monitor',
        estimatedCost: 25000,
        reason: 'Need second screen for productivity'
      },
      stepHistory: [
        { stepId: 's5', stepName: 'Manager Approval', action: 'approve', status: 'rejected', actionBy: 'mgr-001', actionByName: 'Sarah Chen', actionAt: new Date(Date.now() - 259200000).toISOString(), comments: 'Budget constraints this quarter' }
      ],
      createdAt: new Date(Date.now() - 345600000).toISOString(),
      updatedAt: new Date(Date.now() - 259200000).toISOString()
    }
  ];

  const mockPendingApprovals: WorkflowInstance[] = [
    {
      _id: 'pending-1',
      workflowId: 'wf-4',
      workflowName: 'Team Leave Request',
      workflowVersion: 1,
      initiatorId: 'emp-001',
      initiatorName: 'John Doe',
      currentStepIndex: 0,
      status: 'in_progress',
      data: {
        leaveType: 'Annual Leave',
        startDate: '2026-06-15',
        endDate: '2026-06-20',
        days: 4,
        reason: 'Family vacation'
      },
      stepHistory: [
        { stepId: 's6', stepName: 'Manager Approval', action: 'approve', status: 'pending' }
      ],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'pending-2',
      workflowId: 'wf-5',
      workflowName: 'Overtime Approval',
      workflowVersion: 1,
      initiatorId: 'emp-002',
      initiatorName: 'Jane Smith',
      currentStepIndex: 0,
      status: 'in_progress',
      data: {
        date: '2026-05-28',
        hours: 4,
        reason: 'Project deadline'
      },
      stepHistory: [
        { stepId: 's7', stepName: 'Manager Approval', action: 'approve', status: 'pending' }
      ],
      createdAt: new Date(Date.now() - 43200000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  const displayInstances = activeTab === 'my' ? myInstances : pendingApprovals;

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Workflows</Text>
          <Text style={styles.subtitle}>Track your requests and approvals</Text>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={() => setActiveTab('my')}
            style={[styles.tab, activeTab === 'my' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>
              My Requests
            </Text>
            {myInstances.filter(i => i.status === 'in_progress' || i.status === 'pending').length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>
                  {myInstances.filter(i => i.status === 'in_progress' || i.status === 'pending').length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('pending')}
            style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
              Pending Approvals
            </Text>
            {pendingApprovals.length > 0 && (
              <View style={[styles.tabBadge, styles.tabBadgeWarning]}>
                <Text style={styles.tabBadgeText}>{pendingApprovals.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#10b981' }]}>
              {displayInstances.filter(i => i.status === 'approved').length}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#dbeafe' }]}>
              {displayInstances.filter(i => i.status === 'in_progress').length}
            </Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>
              {displayInstances.filter(i => i.status === 'pending').length}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* List */}
        <Text style={styles.sectionTitle}>
          {activeTab === 'my' ? 'Your Requests' : 'Awaiting Your Approval'}
        </Text>
        {displayInstances.map((instance) => {
          const progress = getStepProgress(instance);
          return (
            <TouchableOpacity
              key={instance._id}
              onPress={() => {
                setSelectedInstance(instance);
                setShowDetailModal(true);
              }}
              style={styles.instanceCard}
            >
              <View style={styles.instanceHeader}>
                <View style={styles.instanceInfo}>
                  <View style={styles.badgeRow}>
                    <View style={[styles.statusBadge, getStatusBadge(instance.status)]}>
                      <Text style={[styles.statusText, getStatusBadge(instance.status)]}>
                        {instance.status.replace('_', ' ')}
                      </Text>
                    </View>
                    <Text style={styles.dateText}>{formatDate(instance.createdAt)}</Text>
                  </View>
                  <Text style={styles.instanceTitle}>{instance.workflowName}</Text>
                  {activeTab === 'pending' && instance.initiatorName && (
                    <Text style={styles.initiatorText}>by {instance.initiatorName}</Text>
                  )}
                </View>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>
                    {progress.current}/{progress.total}
                  </Text>
                </View>
              </View>

              {/* Step Progress */}
              <View style={styles.progressRow}>
                {instance.stepHistory.map((step, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.progressStep,
                      step.status === 'approved' && styles.progressStepApproved,
                      step.status === 'rejected' && styles.progressStepRejected,
                      step.status === 'pending' && idx === instance.currentStepIndex && styles.progressStepCurrent,
                    ]}
                  />
                ))}
              </View>

              {/* Data Preview */}
              <View style={styles.dataPreview}>
                {Object.entries(instance.data).slice(0, 3).map(([key, value]) => (
                  <View key={key} style={styles.dataItem}>
                    <Text style={styles.dataLabel}>{key}:</Text>
                    <Text style={styles.dataValue}>
                      {typeof value === 'number' && key.toLowerCase().includes('amount')
                        ? `$${value.toLocaleString()}`
                        : String(value)}
                    </Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}

        {displayInstances.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {activeTab === 'my' ? 'No requests yet' : 'No pending approvals'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedInstance?.workflowName}</Text>
                <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                  <Text style={styles.closeButton}>Close</Text>
                </TouchableOpacity>
              </View>

              {selectedInstance && (
                <>
                  {/* Status */}
                  <View style={styles.modalStatus}>
                    <View style={[styles.statusBadge, getStatusBadge(selectedInstance.status)]}>
                      <Text style={[styles.statusText, getStatusBadge(selectedInstance.status)]}>
                        {selectedInstance.status.replace('_', ' ')}
                      </Text>
                    </View>
                    <Text style={styles.dateText}>
                      Submitted {formatDate(selectedInstance.createdAt)}
                    </Text>
                  </View>

                  {/* Request Data */}
                  <Text style={styles.sectionLabel}>Request Details</Text>
                  <View style={styles.dataCard}>
                    {Object.entries(selectedInstance.data).map(([key, value]) => (
                      <View key={key} style={styles.dataRow}>
                        <Text style={styles.dataRowLabel}>
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                        </Text>
                        <Text style={styles.dataRowValue}>
                          {typeof value === 'number' && (key.toLowerCase().includes('amount') || key.toLowerCase().includes('cost'))
                            ? `$${value.toLocaleString()}`
                            : key.toLowerCase().includes('date')
                            ? new Date(String(value)).toLocaleDateString()
                            : String(value)}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Approval Timeline */}
                  <Text style={styles.sectionLabel}>Approval Timeline</Text>
                  <View style={styles.timeline}>
                    {selectedInstance.stepHistory.map((step, idx) => (
                      <View key={idx} style={styles.timelineItem}>
                        <View style={[
                          styles.timelineDot,
                          step.status === 'approved' && styles.timelineDotApproved,
                          step.status === 'rejected' && styles.timelineDotRejected,
                          step.status === 'pending' && styles.timelineDotPending,
                        ]}>
                          <Text style={styles.timelineIcon}>
                            {getActionIcon(step.status)}
                          </Text>
                        </View>
                        <View style={styles.timelineContent}>
                          <View style={styles.timelineHeader}>
                            <Text style={styles.timelineStepName}>{step.stepName}</Text>
                            <View style={[
                              styles.miniStatusBadge,
                              step.status === 'approved' && styles.miniStatusApproved,
                              step.status === 'rejected' && styles.miniStatusRejected,
                              step.status === 'pending' && styles.miniStatusPending,
                            ]}>
                              <Text style={[
                                styles.miniStatusText,
                                step.status === 'approved' && styles.miniStatusTextApproved,
                                step.status === 'rejected' && styles.miniStatusTextRejected,
                                step.status === 'pending' && styles.miniStatusTextPending,
                              ]}>
                                {step.status}
                              </Text>
                            </View>
                          </View>
                          {step.actionByName && (
                            <Text style={styles.timelineActor}>
                              by {step.actionByName}
                            </Text>
                          )}
                          {step.actionAt && (
                            <Text style={styles.timelineDate}>
                              {new Date(step.actionAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Text>
                          )}
                          {step.comments && (
                            <Text style={styles.timelineComments}>
                              &quot;{step.comments}&quot;
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>
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
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#8b5cf6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabBadge: {
    marginLeft: 8,
    backgroundColor: '#dcfce7',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tabBadgeWarning: {
    backgroundColor: '#fef3c7',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
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
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  instanceCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  instanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  instanceInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  instanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  initiatorText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  stepBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  stepBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  progressRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 4,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  progressStepApproved: {
    backgroundColor: '#10b981',
  },
  progressStepRejected: {
    backgroundColor: '#dc2626',
  },
  progressStepCurrent: {
    backgroundColor: '#8b5cf6',
  },
  dataPreview: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  dataItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dataLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 4,
  },
  dataValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1f2937',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyText: {
    color: '#6b7280',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    color: '#8b5cf6',
    fontWeight: '600',
    fontSize: 16,
  },
  modalStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dataCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dataRowLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  dataRowValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  timelineDotApproved: {
    backgroundColor: '#10b981',
  },
  timelineDotRejected: {
    backgroundColor: '#dc2626',
  },
  timelineDotPending: {
    backgroundColor: '#8b5cf6',
  },
  timelineIcon: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  timelineStepName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 8,
  },
  miniStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  miniStatusApproved: {
    backgroundColor: '#dcfce7',
  },
  miniStatusRejected: {
    backgroundColor: '#fee2e2',
  },
  miniStatusPending: {
    backgroundColor: '#fef3c7',
  },
  miniStatusText: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  miniStatusTextApproved: {
    color: '#15803d',
  },
  miniStatusTextRejected: {
    color: '#dc2626',
  },
  miniStatusTextPending: {
    color: '#d97706',
  },
  timelineActor: {
    fontSize: 12,
    color: '#6b7280',
  },
  timelineDate: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  timelineComments: {
    fontSize: 13,
    color: '#4b5563',
    fontStyle: 'italic',
    marginTop: 4,
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 6,
  },
});
