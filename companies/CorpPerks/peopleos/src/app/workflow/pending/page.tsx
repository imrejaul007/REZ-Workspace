'use client';

import { useState, useEffect } from 'react';
import {
  getPendingApprovals,
  approveInstance,
  rejectInstance,
  type WorkflowInstance
} from '@/services/workflowApi';

// Mock data for demo/fallback
const mockPendingApprovals: WorkflowInstance[] = [
  {
    _id: 'inst-1',
    workflowId: '1',
    workflowName: 'Leave Request Approval',
    workflowVersion: 1,
    initiatorId: 'emp-001',
    initiatorName: 'John Doe',
    currentStepIndex: 0,
    status: 'in_progress',
    data: {
      leaveType: 'Sick Leave',
      startDate: '2026-06-01',
      endDate: '2026-06-02',
      days: 2,
      reason: 'Medical appointment and recovery'
    },
    stepHistory: [
      { stepId: 's1', stepName: 'Manager Approval', action: 'approve', status: 'pending' },
      { stepId: 's2', stepName: 'HR Review', action: 'approve', status: 'pending' }
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'inst-2',
    workflowId: '2',
    workflowName: 'Expense Reimbursement',
    workflowVersion: 2,
    initiatorId: 'emp-002',
    initiatorName: 'Jane Smith',
    currentStepIndex: 1,
    status: 'in_progress',
    data: {
      amount: 5000,
      currency: 'INR',
      category: 'Travel',
      description: 'Client meeting expenses - Uber, meals',
      receipts: ['receipt_1.pdf', 'receipt_2.pdf']
    },
    stepHistory: [
      { stepId: 's3', stepName: 'Manager Approval', action: 'approve', status: 'approved', actionBy: 'mgr-001', actionAt: new Date(Date.now() - 172800000).toISOString() },
      { stepId: 's4', stepName: 'Finance Review', action: 'approve', status: 'pending' }
    ],
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'inst-3',
    workflowId: '3',
    workflowName: 'Equipment Request',
    workflowVersion: 1,
    initiatorId: 'emp-003',
    initiatorName: 'Mike Johnson',
    currentStepIndex: 0,
    status: 'in_progress',
    data: {
      equipment: 'MacBook Pro 16"',
      quantity: 1,
      estimatedCost: 250000,
      reason: 'Current laptop is 5 years old and slow'
    },
    stepHistory: [
      { stepId: 's5', stepName: 'Manager Approval', action: 'approve', status: 'pending' },
      { stepId: 's6', stepName: 'IT Review', action: 'approve', status: 'pending' },
      { stepId: 's7', stepName: 'Procurement', action: 'complete', status: 'pending' }
    ],
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export default function PendingApprovalsPage() {
  const [approvals, setApprovals] = useState<WorkflowInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<WorkflowInstance | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('pending');

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    setLoading(true);
    try {
      // In production, use actual user ID
      const result = await getPendingApprovals('current-user');
      if (result) {
        setApprovals(result.instances);
      } else {
        setApprovals(mockPendingApprovals);
      }
    } catch (error) {
      logger.error('Failed to load pending approvals:', error);
      setApprovals(mockPendingApprovals);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      const success = await approveInstance(id, { comments: 'Approved' });
      if (success) {
        setApprovals(prev => prev.filter(a => a._id !== id));
        if (selectedApproval?._id === id) {
          setSelectedApproval(null);
        }
      }
    } catch (error) {
      logger.error('Failed to approve:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!selectedApproval || !rejectReason) return;

    setProcessing(selectedApproval._id);
    try {
      const success = await rejectInstance(selectedApproval._id, rejectReason);
      if (success) {
        setApprovals(prev => prev.filter(a => a._id !== selectedApproval._id));
        setShowRejectModal(false);
        setRejectReason('');
        setSelectedApproval(null);
      }
    } catch (error) {
      logger.error('Failed to reject:', error);
    } finally {
      setProcessing(null);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  const getPriorityColor = (createdAt: string) => {
    const daysSince = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > 3) return '#dc2626';
    if (daysSince > 1) return '#f59e0b';
    return '#10b981';
  };

  const getStepProgress = (instance: WorkflowInstance) => {
    const completedSteps = instance.stepHistory.filter(s => s.status === 'approved').length;
    return {
      current: instance.currentStepIndex + 1,
      total: instance.stepHistory.length,
      completed: completedSteps
    };
  };

  const filteredApprovals = approvals.filter(a => {
    if (filterStatus === 'all') return true;
    return a.status === filterStatus;
  });

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24
      }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Pending Approvals</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0' }}>
            Review and take action on pending requests
          </p>
        </div>
        <div style={{
          padding: '8px 16px',
          background: '#fef3c7',
          borderRadius: 8,
          fontWeight: 600
        }}>
          {filteredApprovals.length} pending
        </div>
      </div>

      {/* Filter */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 24
      }}>
        {['pending', 'in_progress', 'all'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            style={{
              padding: '6px 16px',
              border: 'none',
              borderRadius: 20,
              background: filterStatus === status ? '#8b5cf6' : '#e5e7eb',
              color: filterStatus === status ? 'white' : '#6b7280',
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 300
        }}>
          <div style={{
            width: 40,
            height: 40,
            border: '3px solid #e5e7eb',
            borderTopColor: '#8b5cf6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      ) : filteredApprovals.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 48,
          background: 'white',
          borderRadius: 12,
          border: '1px solid #e5e7eb'
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 16px' }}>
            <path d="M9 12l2 2 4-4" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="10" stroke="#e5e7eb" strokeWidth="2"/>
          </svg>
          <p style={{ color: '#6b7280', margin: 0 }}>No pending approvals</p>
          <p style={{ color: '#9ca3af', fontSize: 13, margin: '8px 0 0' }}>
            You&apos;re all caught up!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 24 }}>
          {/* List */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            {filteredApprovals.map(approval => {
              const progress = getStepProgress(approval);
              return (
                <div
                  key={approval._id}
                  onClick={() => setSelectedApproval(approval)}
                  style={{
                    background: 'white',
                    padding: 20,
                    borderRadius: 12,
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    borderLeft: `4px solid ${getPriorityColor(approval.createdAt)}`,
                    backgroundColor: selectedApproval?._id === approval._id ? '#f9fafb' : 'white'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{
                          padding: '2px 8px',
                          background: approval.status === 'in_progress' ? '#dbeafe' : '#fef3c7',
                          color: approval.status === 'in_progress' ? '#1d4ed8' : '#d97706',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 500
                        }}>
                          {approval.status.replace('_', ' ')}
                        </span>
                        <span style={{ color: '#6b7280', fontSize: 12 }}>
                          {getTimeAgo(approval.createdAt)}
                        </span>
                      </div>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{approval.workflowName}</h3>
                      <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>
                        by {approval.initiatorName || approval.initiatorId}
                      </p>
                    </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: 4
                    }}>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>
                        Step {progress.current} of {progress.total}
                      </span>
                      <div style={{
                        display: 'flex',
                        gap: 4
                      }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(approval._id);
                          }}
                          disabled={processing === approval._id}
                          style={{
                            padding: '6px 12px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 500,
                            opacity: processing === approval._id ? 0.5 : 1
                          }}
                        >
                          {processing === approval._id ? '...' : 'Approve'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApproval(approval);
                            setShowRejectModal(true);
                          }}
                          disabled={processing === approval._id}
                          style={{
                            padding: '6px 12px',
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 500,
                            opacity: processing === approval._id ? 0.5 : 1
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Step Progress */}
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {approval.stepHistory.map((step, idx) => (
                        <div
                          key={idx}
                          style={{
                            flex: 1,
                            height: 4,
                            borderRadius: 2,
                            background: step.status === 'approved' ? '#10b981' :
                                       step.status === 'rejected' ? '#dc2626' :
                                       idx === approval.currentStepIndex ? '#8b5cf6' : '#e5e7eb'
                          }}
                        />
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                      {approval.stepHistory.map((step, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: 10,
                            color: step.status === 'approved' ? '#10b981' :
                                   step.status === 'rejected' ? '#dc2626' :
                                   idx === approval.currentStepIndex ? '#8b5cf6' : '#9ca3af',
                            fontWeight: step.status !== 'pending' ? 600 : 400
                          }}
                        >
                          {step.stepName}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail Panel */}
          {selectedApproval && (
            <div style={{
              width: 400,
              background: 'white',
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              padding: 24,
              position: 'sticky',
              top: 24,
              alignSelf: 'flex-start'
            }}>
              <div style={{ marginBottom: 24 }}>
                <span style={{
                  padding: '4px 8px',
                  background: '#f3f4f6',
                  color: '#6b7280',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 500
                }}>
                  Request Details
                </span>
                <h2 style={{ margin: '12px 0 0', fontSize: 20, fontWeight: 600 }}>
                  {selectedApproval.workflowName}
                </h2>
                <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>
                  Submitted by {selectedApproval.initiatorName || selectedApproval.initiatorId}
                </p>
                <p style={{ color: '#9ca3af', fontSize: 12, margin: '4px 0 0' }}>
                  {new Date(selectedApproval.createdAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              {/* Data Fields */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Request Data</h4>
                <div style={{
                  background: '#f9fafb',
                  borderRadius: 8,
                  padding: 16
                }}>
                  {Object.entries(selectedApproval.data).map(([key, value]) => (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        borderBottom: '1px solid #e5e7eb'
                      }}
                    >
                      <span style={{ color: '#6b7280', fontSize: 13 }}>
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                      </span>
                      <span style={{ fontWeight: 500, fontSize: 13 }}>
                        {typeof value === 'number' && key.toLowerCase().includes('cost') || key.toLowerCase().includes('amount')
                          ? `$${value.toLocaleString()}`
                          : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step History */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Approval History</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {selectedApproval.stepHistory.map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 12 }}>
                      <div style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: step.status === 'approved' ? '#10b981' :
                                   step.status === 'rejected' ? '#dc2626' :
                                   step.status === 'skipped' ? '#9ca3af' : '#e5e7eb',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 600,
                        flexShrink: 0
                      }}>
                        {step.status === 'approved' ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : step.status === 'rejected' ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                          </svg>
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>{step.stepName}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b7280' }}>
                          {step.status === 'approved' && step.actionByName
                            ? `Approved by ${step.actionByName}`
                            : step.status === 'approved'
                            ? 'Auto-approved'
                            : step.status === 'rejected'
                            ? 'Rejected'
                            : 'Pending'}
                        </p>
                        {step.actionAt && (
                          <p style={{ margin: '2px 0 0', fontSize: 10, color: '#9ca3af' }}>
                            {new Date(step.actionAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => handleApprove(selectedApproval._id)}
                  disabled={processing === selectedApproval._id}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 600,
                    opacity: processing === selectedApproval._id ? 0.5 : 1
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={processing === selectedApproval._id}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 600,
                    opacity: processing === selectedApproval._id ? 0.5 : 1
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedApproval && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 24,
            width: '90%',
            maxWidth: 400
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 600 }}>
              Reject Request
            </h3>
            <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 16px' }}>
              Please provide a reason for rejecting this request.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              style={{
                width: '100%',
                padding: 12,
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 14,
                minHeight: 100,
                resize: 'vertical'
              }}
            />
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  background: rejectReason ? '#dc2626' : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: rejectReason ? 'pointer' : 'not-allowed',
                  fontWeight: 500
                }}
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
