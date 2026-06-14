'use client';

import { useState, useEffect, useCallback } from 'react';

// Types
interface ReviewCycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  description?: string;
  participantCount: number;
  completionRate: number;
}

interface CreateCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<ReviewCycle>) => void;
}

// API base URL
const API_BASE = process.env.NEXT_PUBLIC_PERFORMANCE_API || 'http://localhost:4729';

export default function CyclesPage() {
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch cycles
  const fetchCycles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/reviews/cycles`);
      const data = await res.json();

      if (data.success) {
        setCycles(data.data?.data || []);
      } else {
        setError(data.error || 'Failed to fetch cycles');
      }
    } catch (err) {
      setError('Failed to connect to performance service');
      // Use mock data as fallback
      setCycles(mockCycles);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCycles();
  }, [fetchCycles]);

  // Filter cycles
  const filteredCycles = cycles.filter(cycle => {
    if (activeTab === 'active' && cycle.status !== 'active') return false;
    if (activeTab === 'completed' && cycle.status !== 'completed') return false;
    if (statusFilter !== 'all' && cycle.status !== statusFilter) return false;
    return true;
  });

  // Get stats
  const stats = {
    total: cycles.length,
    active: cycles.filter(c => c.status === 'active').length,
    completed: cycles.filter(c => c.status === 'completed').length,
    draft: cycles.filter(c => c.status === 'draft').length,
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Review Cycles</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0' }}>
            Manage performance review cycles for your organization
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '12px 24px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          + Create Cycle
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Cycles" value={stats.total} color="#6366f1" />
        <StatCard label="Active" value={stats.active} color="#10b981" />
        <StatCard label="Completed" value={stats.completed} color="#8b5cf6" />
        <StatCard label="Drafts" value={stats.draft} color="#f59e0b" />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {(['all', 'active', 'completed'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 500,
              textTransform: 'capitalize',
              background: activeTab === tab ? '#10b981' : '#e5e7eb',
              color: activeTab === tab ? 'white' : '#6b7280',
            }}
          >
            {tab}
          </button>
        ))}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '8px 16px',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            background: 'white',
            marginLeft: 'auto',
          }}
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Cycles Table */}
      <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#6b7280' }}>
            Loading cycles...
          </div>
        ) : error ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#ef4444' }}>
            {error}
          </div>
        ) : filteredCycles.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#6b7280' }}>
            No cycles found. Create your first cycle to get started.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Duration</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Participants</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Completion</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCycles.map(cycle => (
                <tr key={cycle.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 600 }}>{cycle.name}</div>
                    {cycle.description && (
                      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                        {cycle.description.substring(0, 60)}...
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px', color: '#6b7280', fontSize: 14 }}>
                    {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <StatusBadge status={cycle.status} />
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    {cycle.participantCount}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 8, background: '#e5e7eb', borderRadius: 4 }}>
                        <div
                          style={{
                            width: `${cycle.completionRate}%`,
                            height: '100%',
                            background: cycle.completionRate === 100 ? '#10b981' : '#6366f1',
                            borderRadius: 4,
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 13, color: '#6b7280', minWidth: 40 }}>{cycle.completionRate}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <ActionButton
                        onClick={() => {/* View details */}}
                        variant="secondary"
                      >
                        View
                      </ActionButton>
                      {cycle.status === 'draft' && (
                        <ActionButton
                          onClick={() => {/* Activate */}}
                          variant="primary"
                        >
                          Activate
                        </ActionButton>
                      )}
                      {cycle.status === 'active' && (
                        <ActionButton
                          onClick={() => {/* Complete */}}
                          variant="success"
                        >
                          Complete
                        </ActionButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateCycleModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={async (data) => {
            try {
              const res = await fetch(`${API_BASE}/api/reviews/cycles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
              });
              const result = await res.json();
              if (result.success) {
                fetchCycles();
                setShowCreateModal(false);
              }
            } catch {
              // Fallback to mock
              setCycles([...cycles, { ...data, id: Date.now().toString() } as ReviewCycle]);
              setShowCreateModal(false);
            }
          }}
        />
      )}
    </div>
  );
}

// Components
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: 'white', padding: 20, borderRadius: 12 }}>
      <p style={{ fontSize: 28, fontWeight: 700, color, margin: 0 }}>{value}</p>
      <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    draft: { bg: '#fef3c7', text: '#b45309' },
    active: { bg: '#dcfce7', text: '#15803d' },
    completed: { bg: '#dbeafe', text: '#1d4ed8' },
    cancelled: { bg: '#fee2e2', text: '#dc2626' },
  };
  const { bg, text } = colors[status] || { bg: '#f3f4f6', text: '#6b7280' };

  return (
    <span
      style={{
        padding: '4px 12px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 500,
        background: bg,
        color: text,
        textTransform: 'capitalize',
      }}
    >
      {status}
    </span>
  );
}

function ActionButton({ children, onClick, variant = 'secondary' }: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'success';
}) {
  const colors = {
    primary: { bg: '#6366f1', color: 'white' },
    secondary: { bg: '#f3f4f6', color: '#374151' },
    success: { bg: '#10b981', color: 'white' },
  };
  const { bg, color } = colors[variant];

  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        fontWeight: 500,
        fontSize: 13,
        background: bg,
        color,
      }}
    >
      {children}
    </button>
  );
}

function CreateCycleModal({ isOpen, onClose, onSubmit }: CreateCycleModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      status: 'draft',
      participantCount: 0,
      completionRate: 0,
    });
    setFormData({ name: '', startDate: '', endDate: '', description: '' });
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 12,
          padding: 24,
          width: '100%',
          maxWidth: 500,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 24px' }}>Create Review Cycle</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 14,
                boxSizing: 'border-box',
              }}
              placeholder="Q2 2026 Performance Review"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 14,
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
              placeholder="Describe the review cycle..."
            />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                cursor: 'pointer',
                background: 'white',
                fontWeight: 500,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Create Cycle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Mock data
const mockCycles: ReviewCycle[] = [
  {
    id: '1',
    name: 'Q1 2026 Performance Review',
    startDate: '2026-01-01',
    endDate: '2026-03-31',
    status: 'completed',
    description: 'Quarterly performance review for Q1 2026',
    participantCount: 45,
    completionRate: 100,
  },
  {
    id: '2',
    name: 'Q2 2026 Mid-Year Review',
    startDate: '2026-04-01',
    endDate: '2026-06-30',
    status: 'active',
    description: 'Mid-year performance review for Q2 2026',
    participantCount: 52,
    completionRate: 45,
  },
  {
    id: '3',
    name: 'Annual Review 2026',
    startDate: '2026-07-01',
    endDate: '2026-12-31',
    status: 'draft',
    description: 'Annual performance review cycle',
    participantCount: 0,
    completionRate: 0,
  },
];
