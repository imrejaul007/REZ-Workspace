'use client';

import { useState, useEffect } from 'react';
import {
  listWorkflows,
  listInstances,
  createWorkflow,
  type Workflow,
  type WorkflowInstance,
  type CreateWorkflowInput
} from '@/services/workflowApi';

// Mock data for demo/fallback
const mockWorkflows: Workflow[] = [
  {
    _id: '1',
    name: 'Leave Request Approval',
    description: 'Standard leave request workflow',
    category: 'HR',
    type: 'Leave',
    version: 1,
    status: 'active',
    ownerId: 'admin-001',
    ownerName: 'HR Admin',
    steps: [
      { _id: 's1', name: 'Manager Approval', order: 1, action: 'approve' },
      { _id: 's2', name: 'HR Review', order: 2, action: 'approve' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '2',
    name: 'Expense Reimbursement',
    description: 'Process expense claims',
    category: 'Finance',
    type: 'Expense',
    version: 2,
    status: 'active',
    ownerId: 'finance-001',
    ownerName: 'Finance Team',
    steps: [
      { _id: 's3', name: 'Manager Approval', order: 1, action: 'approve' },
      { _id: 's4', name: 'Finance Review', order: 2, action: 'approve' },
      { _id: 's5', name: 'Payment Processing', order: 3, action: 'complete' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '3',
    name: 'Equipment Request',
    description: 'Request new equipment',
    category: 'IT',
    type: 'Equipment',
    version: 1,
    status: 'active',
    ownerId: 'it-001',
    ownerName: 'IT Admin',
    steps: [
      { _id: 's6', name: 'Manager Approval', order: 1, action: 'approve' },
      { _id: 's7', name: 'IT Review', order: 2, action: 'approve' },
      { _id: 's8', name: 'Procurement', order: 3, action: 'complete' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const mockInstances: WorkflowInstance[] = [
  {
    _id: 'inst-1',
    workflowId: '1',
    workflowName: 'Leave Request Approval',
    workflowVersion: 1,
    initiatorId: 'emp-001',
    initiatorName: 'John Doe',
    currentStepIndex: 0,
    status: 'in_progress',
    data: { leaveType: 'Sick', days: 2, reason: 'Medical appointment' },
    stepHistory: [
      { stepId: 's1', stepName: 'Manager Approval', action: 'approve', status: 'pending' },
      { stepId: 's2', stepName: 'HR Review', action: 'approve', status: 'pending' }
    ],
    createdAt: new Date().toISOString(),
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
    data: { amount: 5000, category: 'Travel', description: 'Client meeting expenses' },
    stepHistory: [
      { stepId: 's3', stepName: 'Manager Approval', action: 'approve', status: 'approved', actionBy: 'mgr-001', actionAt: new Date().toISOString() },
      { stepId: 's4', stepName: 'Finance Review', action: 'approve', status: 'pending' }
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export default function WorkflowTemplatesPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'instances'>('templates');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [newWorkflow, setNewWorkflow] = useState<CreateWorkflowInput>({
    name: '',
    description: '',
    category: 'HR',
    type: 'General',
    ownerId: 'current-user',
    ownerName: 'Current User',
    steps: []
  });

  useEffect(() => {
    loadData();
  }, [filterCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [workflowsRes, instancesRes] = await Promise.all([
        listWorkflows(filterCategory !== 'all' ? { category: filterCategory } : undefined),
        listInstances()
      ]);

      if (workflowsRes) {
        setWorkflows(workflowsRes.workflows);
      } else {
        setWorkflows(mockWorkflows);
      }

      if (instancesRes) {
        setInstances(instancesRes.instances);
      } else {
        setInstances(mockInstances);
      }
    } catch (error) {
      logger.error('Failed to load workflow data:', error);
      setWorkflows(mockWorkflows);
      setInstances(mockInstances);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async () => {
    if (!newWorkflow.name || newWorkflow.steps.length === 0) return;

    try {
      const created = await createWorkflow(newWorkflow);
      if (created) {
        setWorkflows([created, ...workflows]);
        setShowModal(false);
        setNewWorkflow({
          name: '',
          description: '',
          category: 'HR',
          type: 'General',
          ownerId: 'current-user',
          ownerName: 'Current User',
          steps: []
        });
      }
    } catch (error) {
      logger.error('Failed to create workflow:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      draft: { bg: '#f3f4f6', text: '#6b7280' },
      active: { bg: '#dcfce7', text: '#15803d' },
      paused: { bg: '#fef3c7', text: '#d97706' },
      completed: { bg: '#dbeafe', text: '#1d4ed8' },
      cancelled: { bg: '#fee2e2', text: '#dc2626' },
      pending: { bg: '#fef3c7', text: '#d97706' },
      in_progress: { bg: '#dbeafe', text: '#1d4ed8' },
      approved: { bg: '#dcfce7', text: '#15803d' },
      rejected: { bg: '#fee2e2', text: '#dc2626' }
    };
    return colors[status] || { bg: '#f3f4f6', text: '#6b7280' };
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      HR: { bg: '#fce7f3', text: '#be185d' },
      Finance: { bg: '#dbeafe', text: '#1d4ed8' },
      IT: { bg: '#dcfce7', text: '#15803d' },
      Operations: { bg: '#fef3c7', text: '#d97706' }
    };
    return colors[category] || { bg: '#f3f4f6', text: '#6b7280' };
  };

  const filteredWorkflows = filterCategory === 'all'
    ? workflows
    : workflows.filter(w => w.category === filterCategory);

  const getStatusText = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

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
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Workflow Automation</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0' }}>
            Manage approval workflows and automation rules
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '10px 20px',
            background: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 14
          }}
        >
          + Create Workflow
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
        marginBottom: 24
      }}>
        <div style={{
          background: 'white',
          padding: 20,
          borderRadius: 12,
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>Total Templates</p>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#8b5cf6', margin: '8px 0 0' }}>
            {workflows.length}
          </p>
        </div>
        <div style={{
          background: 'white',
          padding: 20,
          borderRadius: 12,
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>Active Instances</p>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#10b981', margin: '8px 0 0' }}>
            {instances.filter(i => i.status === 'in_progress').length}
          </p>
        </div>
        <div style={{
          background: 'white',
          padding: 20,
          borderRadius: 12,
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>Pending Approval</p>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b', margin: '8px 0 0' }}>
            {instances.filter(i => i.status === 'pending').length}
          </p>
        </div>
        <div style={{
          background: 'white',
          padding: 20,
          borderRadius: 12,
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>Completed</p>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#3b82f6', margin: '8px 0 0' }}>
            {instances.filter(i => i.status === 'approved').length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 24,
        background: '#f3f4f6',
        padding: 4,
        borderRadius: 10
      }}>
        <button
          onClick={() => setActiveTab('templates')}
          style={{
            padding: '8px 20px',
            border: 'none',
            borderRadius: 8,
            background: activeTab === 'templates' ? 'white' : 'transparent',
            color: activeTab === 'templates' ? '#8b5cf6' : '#6b7280',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: activeTab === 'templates' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          Templates ({workflows.length})
        </button>
        <button
          onClick={() => setActiveTab('instances')}
          style={{
            padding: '8px 20px',
            border: 'none',
            borderRadius: 8,
            background: activeTab === 'instances' ? 'white' : 'transparent',
            color: activeTab === 'instances' ? '#8b5cf6' : '#6b7280',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: activeTab === 'instances' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          Instances ({instances.length})
        </button>
      </div>

      {/* Filter */}
      {activeTab === 'templates' && (
        <div style={{
          display: 'flex',
          gap: 12,
          marginBottom: 16
        }}>
          <button
            onClick={() => setFilterCategory('all')}
            style={{
              padding: '6px 16px',
              border: 'none',
              borderRadius: 20,
              background: filterCategory === 'all' ? '#8b5cf6' : '#e5e7eb',
              color: filterCategory === 'all' ? 'white' : '#6b7280',
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            All
          </button>
          {['HR', 'Finance', 'IT', 'Operations'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              style={{
                padding: '6px 16px',
                border: 'none',
                borderRadius: 20,
                background: filterCategory === cat ? '#8b5cf6' : '#e5e7eb',
                color: filterCategory === cat ? 'white' : '#6b7280',
                fontWeight: 500,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 200
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
      ) : (
        <>
          {activeTab === 'templates' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filteredWorkflows.map(workflow => (
                <div
                  key={workflow._id}
                  style={{
                    background: 'white',
                    padding: 24,
                    borderRadius: 12,
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{
                          padding: '2px 8px',
                          background: getCategoryBadge(workflow.category).bg,
                          color: getCategoryBadge(workflow.category).text,
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600
                        }}>
                          {workflow.category}
                        </span>
                        <span style={{
                          padding: '2px 8px',
                          background: getStatusBadge(workflow.status).bg,
                          color: getStatusBadge(workflow.status).text,
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 500
                        }}>
                          {workflow.status}
                        </span>
                        <span style={{ color: '#6b7280', fontSize: 12 }}>
                          v{workflow.version}
                        </span>
                      </div>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{workflow.name}</h3>
                      {workflow.description && (
                        <p style={{ color: '#6b7280', fontSize: 13, margin: '8px 0 0' }}>
                          {workflow.description}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{
                        padding: '6px 16px',
                        background: '#f3f4f6',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 500
                      }}>
                        Edit
                      </button>
                      <button style={{
                        padding: '6px 16px',
                        background: '#8b5cf6',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 500
                      }}>
                        Start
                      </button>
                    </div>
                  </div>

                  {/* Steps */}
                  <div style={{ marginTop: 16 }}>
                    <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 8px' }}>
                      Workflow Steps:
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {workflow.steps.map((step, idx) => (
                        <div key={step._id} style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            background: '#f9fafb',
                            borderRadius: 6,
                            border: '1px solid #e5e7eb'
                          }}>
                            <span style={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: '#8b5cf6',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 11,
                              fontWeight: 600
                            }}>
                              {idx + 1}
                            </span>
                            <span style={{ fontSize: 13 }}>{step.name}</span>
                            <span style={{
                              padding: '2px 6px',
                              background: step.action === 'approve' ? '#dbeafe' : '#dcfce7',
                              color: step.action === 'approve' ? '#1d4ed8' : '#15803d',
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 500
                            }}>
                              {step.action}
                            </span>
                          </div>
                          {idx < workflow.steps.length - 1 && (
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ margin: '0 -4px' }}>
                              <path d="M5 10h10" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
                              <path d="M11 6l4 4-4 4" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {filteredWorkflows.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: 48,
                  background: 'white',
                  borderRadius: 12,
                  border: '1px solid #e5e7eb'
                }}>
                  <p style={{ color: '#6b7280', margin: 0 }}>No workflows found</p>
                  <button
                    onClick={() => setShowModal(true)}
                    style={{
                      marginTop: 16,
                      padding: '8px 16px',
                      background: '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Create First Workflow
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'instances' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {instances.map(instance => (
                <div
                  key={instance._id}
                  style={{
                    background: 'white',
                    padding: 24,
                    borderRadius: 12,
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{
                          padding: '2px 8px',
                          background: getStatusBadge(instance.status).bg,
                          color: getStatusBadge(instance.status).text,
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 500
                        }}>
                          {getStatusText(instance.status)}
                        </span>
                        <span style={{ color: '#6b7280', fontSize: 12 }}>
                          {new Date(instance.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{instance.workflowName}</h3>
                      <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>
                        Initiated by: {instance.initiatorName || instance.initiatorId}
                      </p>
                    </div>
                    <div style={{
                      padding: '8px 16px',
                      background: '#f9fafb',
                      borderRadius: 8,
                      fontSize: 13
                    }}>
                      <span style={{ color: '#6b7280' }}>Step </span>
                      <span style={{ fontWeight: 600 }}>{instance.currentStepIndex + 1}</span>
                      <span style={{ color: '#6b7280' }}> of {instance.stepHistory.length}</span>
                    </div>
                  </div>

                  {/* Data Summary */}
                  <div style={{
                    marginTop: 16,
                    padding: 12,
                    background: '#f9fafb',
                    borderRadius: 8
                  }}>
                    <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 8px' }}>Request Data:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {Object.entries(instance.data).slice(0, 4).map(([key, value]) => (
                        <span key={key} style={{
                          padding: '4px 8px',
                          background: 'white',
                          borderRadius: 4,
                          fontSize: 12
                        }}>
                          <strong>{key}:</strong> {String(value)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {instances.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: 48,
                  background: 'white',
                  borderRadius: 12,
                  border: '1px solid #e5e7eb'
                }}>
                  <p style={{ color: '#6b7280', margin: 0 }}>No workflow instances found</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      {showModal && (
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
            maxWidth: 600,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 700 }}>
              Create Workflow Template
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14
                  }}
                  placeholder="e.g., Leave Request Approval"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                  Description
                </label>
                <textarea
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14,
                    minHeight: 60,
                    resize: 'vertical'
                  }}
                  placeholder="Describe the workflow..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                    Category *
                  </label>
                  <select
                    value={newWorkflow.category}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 14
                    }}
                  >
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="IT">IT</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                    Type *
                  </label>
                  <input
                    type="text"
                    value={newWorkflow.type}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 14
                    }}
                    placeholder="e.g., Leave"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                  Steps *
                </label>
                <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 8px' }}>
                  Add at least one step for approval workflow
                </p>
                {newWorkflow.steps.map((step, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    gap: 8,
                    marginBottom: 8,
                    padding: 12,
                    background: '#f9fafb',
                    borderRadius: 8
                  }}>
                    <input
                      type="text"
                      value={step.name}
                      onChange={(e) => {
                        const steps = [...newWorkflow.steps];
                        steps[idx].name = e.target.value;
                        setNewWorkflow({ ...newWorkflow, steps });
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: 6,
                        fontSize: 13
                      }}
                      placeholder="Step name"
                    />
                    <select
                      value={step.action}
                      onChange={(e) => {
                        const steps = [...newWorkflow.steps];
                        steps[idx].action = e.target.value as 'approve' | 'reject' | 'notify' | 'complete';
                        setNewWorkflow({ ...newWorkflow, steps });
                      }}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: 6,
                        fontSize: 13
                      }}
                    >
                      <option value="approve">Approve</option>
                      <option value="reject">Reject</option>
                      <option value="notify">Notify</option>
                      <option value="complete">Complete</option>
                    </select>
                    <button
                      onClick={() => {
                        const steps = newWorkflow.steps.filter((_, i) => i !== idx);
                        setNewWorkflow({ ...newWorkflow, steps });
                      }}
                      style={{
                        padding: '8px 12px',
                        background: '#fee2e2',
                        border: 'none',
                        borderRadius: 6,
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontSize: 13
                      }}
                    >
                      X
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    setNewWorkflow({
                      ...newWorkflow,
                      steps: [...newWorkflow.steps, { name: '', action: 'approve' }]
                    });
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500
                  }}
                >
                  + Add Step
                </button>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
              marginTop: 24
            }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
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
                onClick={handleCreateWorkflow}
                disabled={!newWorkflow.name || newWorkflow.steps.length === 0}
                style={{
                  padding: '10px 20px',
                  background: newWorkflow.name && newWorkflow.steps.length > 0 ? '#8b5cf6' : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: newWorkflow.name && newWorkflow.steps.length > 0 ? 'pointer' : 'not-allowed',
                  fontWeight: 500
                }}
              >
                Create Workflow
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
