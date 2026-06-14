'use client';

import { useState, useEffect } from 'react';
import {
  getOKRDashboard,
  getCompanyOKRs,
  listObjectives,
  type Objective,
  type OKRDashboard
} from '@/services/okrApi';

// Mock data for demo/fallback
const mockDashboard: OKRDashboard = {
  summary: {
    totalObjectives: 12,
    companyObjectives: 3,
    departmentObjectives: 5,
    individualObjectives: 4,
    currentQuarter: 2,
    currentYear: 2026
  },
  progress: {
    overallProgress: 68,
    onTrack: 6,
    atRisk: 4,
    behind: 1,
    completed: 1
  },
  keyResults: {
    total: 28,
    onTrack: 18,
    atRisk: 7,
    behind: 3
  },
  recentObjectives: []
};

const mockObjectives: Objective[] = [
  {
    _id: '1',
    title: 'Increase customer satisfaction',
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
  }
];

export default function OKRPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'objectives'>('dashboard');
  const [dashboard, setDashboard] = useState<OKRDashboard | null>(null);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuarter, setSelectedQuarter] = useState('Q2 2026');

  useEffect(() => {
    loadData();
  }, [selectedQuarter]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Try to load from API, fall back to mock data
      const [dashboardRes, objectivesRes] = await Promise.all([
        getOKRDashboard(),
        listObjectives({ status: 'active', limit: 50 })
      ]);

      if (dashboardRes) {
        setDashboard(dashboardRes);
      } else {
        setDashboard(mockDashboard);
      }

      if (objectivesRes) {
        setObjectives(objectivesRes.objectives);
      } else {
        setObjectives(mockObjectives);
      }
    } catch (error) {
      logger.error('Failed to load OKR data:', error);
      setDashboard(mockDashboard);
      setObjectives(mockObjectives);
    } finally {
      setLoading(false);
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
      completed: { bg: '#dbeafe', text: '#1d4ed8' }
    };
    return colors[status] || { bg: '#f3f4f6', text: '#6b7280' };
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px'
      }}>
        <div style={{
          width: 48,
          height: 48,
          border: '4px solid #e5e7eb',
          borderTopColor: '#8b5cf6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

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
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>OKRs</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0' }}>
            Objectives & Key Results for {selectedQuarter}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            style={{
              padding: '8px 16px',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              background: 'white'
            }}
          >
            <option>Q2 2026</option>
            <option>Q1 2026</option>
            <option>Q4 2025</option>
            <option>Q3 2025</option>
          </select>
          <button style={{
            padding: '8px 16px',
            background: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600
          }}>
            + New Objective
          </button>
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
          onClick={() => setActiveTab('dashboard')}
          style={{
            padding: '8px 20px',
            border: 'none',
            borderRadius: 8,
            background: activeTab === 'dashboard' ? 'white' : 'transparent',
            color: activeTab === 'dashboard' ? '#8b5cf6' : '#6b7280',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: activeTab === 'dashboard' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('objectives')}
          style={{
            padding: '8px 20px',
            border: 'none',
            borderRadius: 8,
            background: activeTab === 'objectives' ? 'white' : 'transparent',
            color: activeTab === 'objectives' ? '#8b5cf6' : '#6b7280',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: activeTab === 'objectives' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          Objectives
        </button>
      </div>

      {activeTab === 'dashboard' && dashboard && (
        <>
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
              <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>Overall Progress</p>
              <p style={{
                fontSize: 36,
                fontWeight: 700,
                color: getProgressColor(dashboard.progress.overallProgress),
                margin: '8px 0 0'
              }}>
                {dashboard.progress.overallProgress}%
              </p>
            </div>
            <div style={{
              background: 'white',
              padding: 20,
              borderRadius: 12,
              border: '1px solid #e5e7eb'
            }}>
              <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>Total Objectives</p>
              <p style={{ fontSize: 36, fontWeight: 700, color: '#8b5cf6', margin: '8px 0 0' }}>
                {dashboard.summary.totalObjectives}
              </p>
            </div>
            <div style={{
              background: 'white',
              padding: 20,
              borderRadius: 12,
              border: '1px solid #e5e7eb'
            }}>
              <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>On Track</p>
              <p style={{ fontSize: 36, fontWeight: 700, color: '#10b981', margin: '8px 0 0' }}>
                {dashboard.progress.onTrack}
              </p>
            </div>
            <div style={{
              background: 'white',
              padding: 20,
              borderRadius: 12,
              border: '1px solid #e5e7eb'
            }}>
              <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>At Risk</p>
              <p style={{ fontSize: 36, fontWeight: 700, color: '#f59e0b', margin: '8px 0 0' }}>
                {dashboard.progress.atRisk}
              </p>
            </div>
          </div>

          {/* Progress Overview */}
          <div style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
            padding: 24,
            borderRadius: 16,
            color: 'white',
            marginBottom: 24
          }}>
            <h2 style={{ margin: '0 0 16px' }}>Progress Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: 16, borderRadius: 12 }}>
                <p style={{ margin: 0, fontSize: 13 }}>Company OKRs</p>
                <p style={{ margin: '8px 0 0', fontSize: 24, fontWeight: 700 }}>
                  {dashboard.summary.companyObjectives}
                </p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: 16, borderRadius: 12 }}>
                <p style={{ margin: 0, fontSize: 13 }}>Department OKRs</p>
                <p style={{ margin: '8px 0 0', fontSize: 24, fontWeight: 700 }}>
                  {dashboard.summary.departmentObjectives}
                </p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: 16, borderRadius: 12 }}>
                <p style={{ margin: 0, fontSize: 13 }}>Individual OKRs</p>
                <p style={{ margin: '8px 0 0', fontSize: 24, fontWeight: 700 }}>
                  {dashboard.summary.individualObjectives}
                </p>
              </div>
            </div>
          </div>

          {/* Key Results Summary */}
          <div style={{
            background: 'white',
            padding: 24,
            borderRadius: 12,
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ margin: '0 0 16px' }}>Key Results Status</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { label: 'Total KRs', value: dashboard.keyResults.total, color: '#6b7280' },
                { label: 'On Track', value: dashboard.keyResults.onTrack, color: '#10b981' },
                { label: 'At Risk', value: dashboard.keyResults.atRisk, color: '#f59e0b' },
                { label: 'Behind', value: dashboard.keyResults.behind, color: '#ef4444' }
              ].map((item) => (
                <div key={item.label} style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    background: `${item.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 8px'
                  }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: item.color }}>
                      {item.value}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'objectives' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {objectives.map((objective) => (
            <div
              key={objective._id}
              style={{
                background: 'white',
                padding: 24,
                borderRadius: 12,
                border: '1px solid #e5e7eb'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 16
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      padding: '2px 8px',
                      background: objective.type === 'company' ? '#dbeafe' : objective.type === 'department' ? '#dcfce7' : '#fef3c7',
                      color: objective.type === 'company' ? '#1d4ed8' : objective.type === 'department' ? '#15803d' : '#d97706',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase'
                    }}>
                      {objective.type}
                    </span>
                    <span style={{ color: '#6b7280', fontSize: 13 }}>
                      Q{objective.quarter} {objective.year}
                    </span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{objective.title}</h3>
                  {objective.ownerName && (
                    <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>
                      Owner: {objective.ownerName}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{
                    fontSize: 28,
                    fontWeight: 700,
                    margin: 0,
                    color: getProgressColor(objective.progress)
                  }}>
                    {objective.progress}%
                  </p>
                  <p style={{ color: '#6b7280', fontSize: 12, margin: '4px 0 0' }}>Complete</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{
                height: 8,
                background: '#e5e7eb',
                borderRadius: 4,
                marginBottom: 16,
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${objective.progress}%`,
                  height: '100%',
                  background: getProgressColor(objective.progress),
                  borderRadius: 4,
                  transition: 'width 0.3s ease'
                }} />
              </div>

              {/* Key Results */}
              {objective.keyResults.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Key Results</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {objective.keyResults.map((kr) => {
                      const krProgress = kr.target > 0
                        ? Math.min(100, ((kr.current - kr.startValue) / (kr.target - kr.startValue)) * 100)
                        : 0;
                      return (
                        <div
                          key={kr._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: 12,
                            background: '#f9fafb',
                            borderRadius: 8
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              marginBottom: 4
                            }}>
                              <span style={{ fontSize: 13, fontWeight: 500 }}>{kr.title}</span>
                              <span style={{ fontSize: 13, color: '#6b7280' }}>
                                {kr.current} / {kr.target} {kr.unit}
                              </span>
                            </div>
                            <div style={{
                              height: 4,
                              background: '#e5e7eb',
                              borderRadius: 2
                            }}>
                              <div style={{
                                width: `${krProgress}%`,
                                height: '100%',
                                background: getStatusBadge(kr.status).text,
                                borderRadius: 2
                              }} />
                            </div>
                          </div>
                          <span style={{
                            padding: '2px 8px',
                            background: getStatusBadge(kr.status).bg,
                            color: getStatusBadge(kr.status).text,
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 500
                          }}>
                            {kr.status.replace('_', ' ')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}

          {objectives.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: 48,
              background: 'white',
              borderRadius: 12,
              border: '1px solid #e5e7eb'
            }}>
              <p style={{ color: '#6b7280', margin: 0 }}>No objectives found</p>
              <button style={{
                marginTop: 16,
                padding: '8px 16px',
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600
              }}>
                Create First Objective
              </button>
            </div>
          )}
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
