'use client';

import { useState, useEffect } from 'react';
import {
  listObjectives,
  createObjective,
  updateProgress,
  type Objective,
  type CreateObjectiveInput
} from '@/services/okrApi';

// Mock data for demo/fallback
const mockObjectives: Objective[] = [
  {
    _id: '1',
    title: 'Increase customer satisfaction',
    description: 'Improve overall customer experience and satisfaction scores',
    quarter: 2,
    year: 2026,
    ownerId: 'ceo-001',
    ownerName: 'John Smith',
    type: 'company',
    status: 'active',
    progress: 75,
    keyResults: [
      { _id: 'kr1', title: 'NPS Score', target: 50, current: 42, unit: 'points', weight: 1, startValue: 0, status: 'on_track' },
      { _id: 'kr2', title: 'Response Time', target: 4, current: 4.5, unit: 'hours', weight: 1, startValue: 8, status: 'at_risk' }
    ],
    milestones: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '2',
    title: 'Launch mobile app v2.0',
    description: 'Release new version with improved UX and features',
    quarter: 2,
    year: 2026,
    ownerId: 'cto-001',
    ownerName: 'Sarah Chen',
    type: 'department',
    status: 'active',
    progress: 45,
    keyResults: [
      { _id: 'kr3', title: 'Feature Completion', target: 100, current: 65, unit: '%', weight: 1, startValue: 0, status: 'at_risk' },
      { _id: 'kr4', title: 'Bug Count', target: 10, current: 45, unit: 'bugs', weight: 1, startValue: 100, status: 'behind' }
    ],
    milestones: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '3',
    title: 'Complete AWS certification',
    description: 'Get AWS Solutions Architect certification',
    quarter: 2,
    year: 2026,
    ownerId: 'dev-001',
    ownerName: 'Mike Johnson',
    type: 'individual',
    status: 'active',
    progress: 60,
    keyResults: [
      { _id: 'kr5', title: 'Study Hours', target: 40, current: 28, unit: 'hours', weight: 1, startValue: 0, status: 'on_track' },
      { _id: 'kr6', title: 'Practice Tests', target: 5, current: 3, unit: 'tests', weight: 1, startValue: 0, status: 'on_track' }
    ],
    milestones: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export default function ObjectivesPage() {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);
  const [newObjective, setNewObjective] = useState<CreateObjectiveInput>({
    title: '',
    description: '',
    quarter: 2,
    year: 2026,
    ownerId: 'current-user',
    ownerName: 'Current User',
    type: 'individual',
    keyResults: []
  });

  useEffect(() => {
    loadObjectives();
  }, [filterType, filterStatus]);

  const loadObjectives = async () => {
    setLoading(true);
    try {
      const params: { type?: string; status?: string } = {};
      if (filterType !== 'all') params.type = filterType;
      if (filterStatus !== 'all') params.status = filterStatus;

      const result = await listObjectives(params);
      if (result) {
        setObjectives(result.objectives);
      } else {
        setObjectives(mockObjectives);
      }
    } catch (error) {
      logger.error('Failed to load objectives:', error);
      setObjectives(mockObjectives);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateObjective = async () => {
    if (!newObjective.title) return;

    try {
      const created = await createObjective(newObjective);
      if (created) {
        setObjectives([created, ...objectives]);
        setShowModal(false);
        setNewObjective({
          title: '',
          description: '',
          quarter: 2,
          year: 2026,
          ownerId: 'current-user',
          ownerName: 'Current User',
          type: 'individual',
          keyResults: []
        });
      }
    } catch (error) {
      logger.error('Failed to create objective:', error);
    }
  };

  const handleUpdateProgress = async (objectiveId: string, keyResultId: string, newValue: number) => {
    try {
      const success = await updateProgress(objectiveId, {
        keyResultId,
        current: newValue
      });
      if (success) {
        loadObjectives();
      }
    } catch (error) {
      logger.error('Failed to update progress:', error);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 70) return '#10b981';
    if (progress >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      company: { bg: '#dbeafe', text: '#1d4ed8' },
      department: { bg: '#dcfce7', text: '#15803d' },
      individual: { bg: '#fef3c7', text: '#d97706' }
    };
    return colors[type] || { bg: '#f3f4f6', text: '#6b7280' };
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      draft: { bg: '#f3f4f6', text: '#6b7280' },
      active: { bg: '#dcfce7', text: '#15803d' },
      completed: { bg: '#dbeafe', text: '#1d4ed8' },
      cancelled: { bg: '#fee2e2', text: '#dc2626' }
    };
    return colors[status] || { bg: '#f3f4f6', text: '#6b7280' };
  };

  const filteredObjectives = objectives.filter(obj => {
    if (filterType !== 'all' && obj.type !== filterType) return false;
    if (filterStatus !== 'all' && obj.status !== filterStatus) return false;
    return true;
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
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Manage Objectives</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0' }}>
            Create and track your organization&apos;s OKRs
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
          + Create Objective
        </button>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 24,
        background: 'white',
        padding: 16,
        borderRadius: 12,
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: '#6b7280' }}>Type:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '6px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: 6,
              background: 'white',
              fontSize: 13
            }}
          >
            <option value="all">All Types</option>
            <option value="company">Company</option>
            <option value="department">Department</option>
            <option value="individual">Individual</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: '#6b7280' }}>Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '6px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: 6,
              background: 'white',
              fontSize: 13
            }}
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div style={{ marginLeft: 'auto', color: '#6b7280', fontSize: 13 }}>
          {filteredObjectives.length} objectives
        </div>
      </div>

      {/* Objectives List */}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredObjectives.map((objective) => (
            <div
              key={objective._id}
              style={{
                background: 'white',
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  padding: 20,
                  cursor: 'pointer',
                  borderBottom: selectedObjective?._id === objective._id ? 'none' : '1px solid #e5e7eb'
                }}
                onClick={() => setSelectedObjective(
                  selectedObjective?._id === objective._id ? null : objective
                )}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{
                        padding: '2px 8px',
                        background: getTypeBadge(objective.type).bg,
                        color: getTypeBadge(objective.type).text,
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        {objective.type}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        background: getStatusBadge(objective.status).bg,
                        color: getStatusBadge(objective.status).text,
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 500
                      }}>
                        {objective.status}
                      </span>
                      <span style={{ color: '#6b7280', fontSize: 12 }}>
                        Q{objective.quarter} {objective.year}
                      </span>
                    </div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{objective.title}</h3>
                    {objective.description && (
                      <p style={{ color: '#6b7280', fontSize: 13, margin: '8px 0 0' }}>
                        {objective.description}
                      </p>
                    )}
                    {objective.ownerName && (
                      <p style={{ color: '#6b7280', fontSize: 12, margin: '4px 0 0' }}>
                        Owner: {objective.ownerName}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: 24 }}>
                    <p style={{
                      fontSize: 32,
                      fontWeight: 700,
                      margin: 0,
                      color: getProgressColor(objective.progress)
                    }}>
                      {objective.progress}%
                    </p>
                    <div style={{
                      width: 100,
                      height: 6,
                      background: '#e5e7eb',
                      borderRadius: 3,
                      marginTop: 8
                    }}>
                      <div style={{
                        width: `${objective.progress}%`,
                        height: '100%',
                        background: getProgressColor(objective.progress),
                        borderRadius: 3
                      }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Key Results */}
              {selectedObjective?._id === objective._id && (
                <div style={{ padding: 20, background: '#f9fafb' }}>
                  <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600 }}>
                    Key Results ({objective.keyResults.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {objective.keyResults.map((kr) => {
                      const krProgress = kr.target > 0
                        ? Math.min(100, ((kr.current - kr.startValue) / (kr.target - kr.startValue)) * 100)
                        : 0;
                      return (
                        <div
                          key={kr._id}
                          style={{
                            background: 'white',
                            padding: 16,
                            borderRadius: 8,
                            border: '1px solid #e5e7eb'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontWeight: 500 }}>{kr.title}</span>
                            <span style={{ color: '#6b7280' }}>
                              {kr.current} / {kr.target} {kr.unit}
                            </span>
                          </div>
                          <div style={{
                            height: 6,
                            background: '#e5e7eb',
                            borderRadius: 3,
                            marginBottom: 12
                          }}>
                            <div style={{
                              width: `${krProgress}%`,
                              height: '100%',
                              background: getProgressColor(krProgress),
                              borderRadius: 3
                            }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{
                              padding: '2px 8px',
                              background: kr.status === 'on_track' ? '#dcfce7' :
                                         kr.status === 'at_risk' ? '#fef3c7' :
                                         kr.status === 'behind' ? '#fee2e2' : '#dbeafe',
                              color: kr.status === 'on_track' ? '#15803d' :
                                     kr.status === 'at_risk' ? '#d97706' :
                                     kr.status === 'behind' ? '#dc2626' : '#1d4ed8',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 500
                            }}>
                              {kr.status.replace('_', ' ')}
                            </span>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <input
                                type="number"
                                placeholder="New value"
                                style={{
                                  padding: '4px 8px',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: 4,
                                  width: 80,
                                  fontSize: 12
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const value = parseFloat((e.target as HTMLInputElement).value);
                                    if (!isNaN(value)) {
                                      handleUpdateProgress(objective._id, kr._id, value);
                                    }
                                  }
                                }}
                              />
                              <button
                                style={{
                                  padding: '4px 12px',
                                  background: '#8b5cf6',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: 4,
                                  fontSize: 12,
                                  cursor: 'pointer'
                                }}
                                onClick={(e) => {
                                  const input = (e.target as HTMLButtonElement).parentElement?.querySelector('input') as HTMLInputElement;
                                  const value = parseFloat(input.value);
                                  if (!isNaN(value)) {
                                    handleUpdateProgress(objective._id, kr._id, value);
                                  }
                                }}
                              >
                                Update
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}

          {filteredObjectives.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: 48,
              background: 'white',
              borderRadius: 12,
              border: '1px solid #e5e7eb'
            }}>
              <p style={{ color: '#6b7280', margin: 0 }}>No objectives found</p>
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
                Create First Objective
              </button>
            </div>
          )}
        </div>
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
              Create New Objective
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={newObjective.title}
                  onChange={(e) => setNewObjective({ ...newObjective, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14
                  }}
                  placeholder="e.g., Increase customer satisfaction"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                  Description
                </label>
                <textarea
                  value={newObjective.description}
                  onChange={(e) => setNewObjective({ ...newObjective, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14,
                    minHeight: 80,
                    resize: 'vertical'
                  }}
                  placeholder="Describe the objective..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                    Type *
                  </label>
                  <select
                    value={newObjective.type}
                    onChange={(e) => setNewObjective({
                      ...newObjective,
                      type: e.target.value as 'company' | 'department' | 'individual'
                    })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 14
                    }}
                  >
                    <option value="individual">Individual</option>
                    <option value="department">Department</option>
                    <option value="company">Company</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                    Quarter *
                  </label>
                  <select
                    value={newObjective.quarter}
                    onChange={(e) => setNewObjective({
                      ...newObjective,
                      quarter: parseInt(e.target.value) as 1 | 2 | 3 | 4
                    })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 14
                    }}
                  >
                    <option value={1}>Q1</option>
                    <option value={2}>Q2</option>
                    <option value={3}>Q3</option>
                    <option value={4}>Q4</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                    Year *
                  </label>
                  <select
                    value={newObjective.year}
                    onChange={(e) => setNewObjective({
                      ...newObjective,
                      year: parseInt(e.target.value)
                    })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 14
                    }}
                  >
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                  </select>
                </div>
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
                onClick={handleCreateObjective}
                disabled={!newObjective.title}
                style={{
                  padding: '10px 20px',
                  background: newObjective.title ? '#8b5cf6' : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: newObjective.title ? 'pointer' : 'not-allowed',
                  fontWeight: 500
                }}
              >
                Create Objective
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
