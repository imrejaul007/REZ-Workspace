'use client';

import { useState, useEffect, useCallback } from 'react';

// Types
interface Feedback {
  id: string;
  cycleId: string;
  cycleName: string;
  fromUser: { id: string; name: string; avatar?: string };
  toUser: { id: string; name: string; avatar?: string };
  type: 'peer' | 'manager' | 'direct_report' | 'self' | 'upward';
  content: string;
  ratings: { category: string; score: number }[];
  isAnonymous: boolean;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  avatar?: string;
  role: string;
}

// API base URL
const API_BASE = process.env.NEXT_PUBLIC_PERFORMANCE_API || 'http://localhost:4729';

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'received' | 'given'>('received');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [showGiveFeedback, setShowGiveFeedback] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<string>('');
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');

  // Mock users
  const mockUsers: User[] = [
    { id: '1', name: 'Priya Sharma', role: 'React Developer' },
    { id: '2', name: 'Rahul Verma', role: 'Designer' },
    { id: '3', name: 'Sneha Patel', role: 'Manager' },
    { id: '4', name: 'Amit Kumar', role: 'Senior Developer' },
    { id: '5', name: 'Neha Gupta', role: 'Product Manager' },
  ];

  // Mock cycles
  const mockCycles = [
    { id: '2', name: 'Q2 2026 Mid-Year Review' },
    { id: '1', name: 'Q1 2026 Performance Review' },
  ];

  // Fetch feedback
  const fetchFeedback = useCallback(async (type: 'received' | 'given') => {
    try {
      setLoading(true);
      const userId = 'current-user'; // In real app, get from auth
      const endpoint = type === 'received' ? '/feedback/received' : '/feedback/given';
      const res = await fetch(`${API_BASE}/api${endpoint}?cycleId=${selectedCycle}`);
      const data = await res.json();

      if (data.success) {
        setFeedbacks(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch feedback');
        setFeedbacks(mockFeedbacks);
      }
    } catch {
      setFeedbacks(mockFeedbacks);
    } finally {
      setLoading(false);
    }
  }, [selectedCycle]);

  useEffect(() => {
    fetchFeedback(activeTab);
  }, [activeTab, fetchFeedback]);

  // Filter feedbacks
  const filteredFeedbacks = feedbacks.filter(f => {
    if (typeFilter !== 'all' && f.type !== typeFilter) return false;
    return true;
  });

  // Group by type for stats
  const feedbackStats = {
    total: feedbacks.length,
    peer: feedbacks.filter(f => f.type === 'peer').length,
    manager: feedbacks.filter(f => f.type === 'manager').length,
    upward: feedbacks.filter(f => f.type === 'upward').length,
    self: feedbacks.filter(f => f.type === 'self').length,
    avgRating: feedbacks.length > 0
      ? (feedbacks.reduce((acc, f) => {
          const avg = f.ratings.length > 0
            ? f.ratings.reduce((a, r) => a + r.score, 0) / f.ratings.length
            : 0;
          return acc + avg;
        }, 0) / feedbacks.length).toFixed(1)
      : 'N/A',
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>360 Feedback</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0' }}>
            View and give feedback across your organization
          </p>
        </div>
        <button
          onClick={() => setShowGiveFeedback(true)}
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
          + Give Feedback
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total" value={feedbackStats.total} color="#6366f1" />
        <StatCard label="Peer" value={feedbackStats.peer} color="#8b5cf6" />
        <StatCard label="Manager" value={feedbackStats.manager} color="#10b981" />
        <StatCard label="Upward" value={feedbackStats.upward} color="#f59e0b" />
        <StatCard label="Avg Rating" value={feedbackStats.avgRating} color="#ef4444" />
      </div>

      {/* Tabs and Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
        {(['received', 'given'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 500,
              background: activeTab === tab ? '#10b981' : '#e5e7eb',
              color: activeTab === tab ? 'white' : '#6b7280',
            }}
          >
            {tab === 'received' ? 'Received' : 'Given'}
          </button>
        ))}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{
            padding: '10px 16px',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            background: 'white',
            marginLeft: 'auto',
          }}
        >
          <option value="all">All Types</option>
          <option value="peer">Peer</option>
          <option value="manager">Manager</option>
          <option value="upward">Upward</option>
          <option value="self">Self</option>
        </select>
        <select
          value={selectedCycle}
          onChange={(e) => setSelectedCycle(e.target.value)}
          style={{
            padding: '10px 16px',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            background: 'white',
          }}
        >
          <option value="">All Cycles</option>
          {mockCycles.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Feedback List */}
      <div style={{ display: 'grid', gap: 16 }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', background: 'white', borderRadius: 12, color: '#6b7280' }}>
            Loading feedback...
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', background: 'white', borderRadius: 12, color: '#6b7280' }}>
            No feedback found. {activeTab === 'given' ? 'Give feedback to your colleagues!' : 'Wait for feedback from your team.'}
          </div>
        ) : (
          filteredFeedbacks.map(feedback => (
            <div
              key={feedback.id}
              style={{
                background: 'white',
                borderRadius: 12,
                padding: 20,
                cursor: 'pointer',
                transition: 'box-shadow 0.2s',
              }}
              onClick={() => setSelectedFeedback(feedback)}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: getTypeColor(feedback.type),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: 18,
                    }}
                  >
                    {feedback.isAnonymous ? '?' : feedback.fromUser.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600 }}>
                        {feedback.isAnonymous ? 'Anonymous' : feedback.fromUser.name}
                      </span>
                      <FeedbackTypeBadge type={feedback.type} />
                    </div>
                    <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
                      {feedback.cycleName}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {feedback.ratings.length > 0 && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} style={{ color: star <= Math.round(Number(feedback.ratings.reduce((a, r) => a + r.score, 0) / feedback.ratings.length)) ? '#fbbf24' : '#e5e7eb' }}>
                          ★
                        </span>
                      ))}
                    </div>
                  )}
                  <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: 12 }}>
                    {new Date(feedback.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p style={{ margin: '16px 0 0', color: '#374151', lineHeight: 1.6 }}>
                {feedback.content.length > 200 ? feedback.content.substring(0, 200) + '...' : feedback.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <FeedbackDetailModal
          feedback={selectedFeedback}
          onClose={() => setSelectedFeedback(null)}
        />
      )}

      {/* Give Feedback Modal */}
      {showGiveFeedback && (
        <GiveFeedbackModal
          cycles={mockCycles}
          users={mockUsers}
          onClose={() => setShowGiveFeedback(false)}
          onSubmit={async (data) => {
            try {
              const res = await fetch(`${API_BASE}/api/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
              });
              const result = await res.json();
              if (result.success) {
                fetchFeedback('given');
                setShowGiveFeedback(false);
              }
            } catch {
              // Fallback to mock
              setShowGiveFeedback(false);
            }
          }}
        />
      )}
    </div>
  );
}

// Components
function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ background: 'white', padding: 16, borderRadius: 12, textAlign: 'center' }}>
      <p style={{ fontSize: 24, fontWeight: 700, color, margin: 0 }}>{value}</p>
      <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>{label}</p>
    </div>
  );
}

function FeedbackTypeBadge({ type }: { type: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    peer: { bg: '#dbeafe', text: '#1d4ed8' },
    manager: { bg: '#dcfce7', text: '#15803d' },
    direct_report: { bg: '#fef3c7', text: '#b45309' },
    upward: { bg: '#f3e8ff', text: '#7c3aed' },
    self: { bg: '#f3f4f6', text: '#6b7280' },
  };
  const { bg, text } = colors[type] || { bg: '#f3f4f6', text: '#6b7280' };

  const labels: Record<string, string> = {
    peer: 'Peer',
    manager: 'Manager',
    direct_report: 'Direct Report',
    upward: 'Upward',
    self: 'Self',
  };

  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 500,
        background: bg,
        color: text,
      }}
    >
      {labels[type] || type}
    </span>
  );
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    peer: '#6366f1',
    manager: '#10b981',
    direct_report: '#f59e0b',
    upward: '#8b5cf6',
    self: '#6b7280',
  };
  return colors[type] || '#6b7280';
}

function FeedbackDetailModal({ feedback, onClose }: { feedback: Feedback; onClose: () => void }) {
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
          borderRadius: 16,
          padding: 24,
          width: '100%',
          maxWidth: 600,
          maxHeight: '80vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>Feedback Details</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: getTypeColor(feedback.type),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 600,
              fontSize: 20,
            }}
          >
            {feedback.isAnonymous ? '?' : feedback.fromUser.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 18 }}>
                {feedback.isAnonymous ? 'Anonymous' : feedback.fromUser.name}
              </span>
              <FeedbackTypeBadge type={feedback.type} />
            </div>
            <p style={{ margin: '4px 0 0', color: '#6b7280' }}>{feedback.cycleName}</p>
          </div>
        </div>
        {feedback.ratings.length > 0 && (
          <div style={{ marginBottom: 20, padding: 16, background: '#f9fafb', borderRadius: 12 }}>
            <h4 style={{ margin: '0 0 12px' }}>Ratings</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {feedback.ratings.map((rating, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280', textTransform: 'capitalize' }}>{rating.category}</span>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} style={{ color: star <= rating.score ? '#fbbf24' : '#e5e7eb', fontSize: 16 }}>★</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ margin: '0 0 12px' }}>Feedback</h4>
          <p style={{ lineHeight: 1.7, color: '#374151' }}>{feedback.content}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function GiveFeedbackModal({
  cycles,
  users,
  onClose,
  onSubmit,
}: {
  cycles: { id: string; name: string }[];
  users: User[];
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
}) {
  const [formData, setFormData] = useState({
    cycleId: cycles[0]?.id || '',
    toUserId: '',
    type: 'peer' as const,
    content: '',
    isAnonymous: false,
    ratings: [] as { category: string; score: number }[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      fromUserId: 'current-user',
    });
  };

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
          borderRadius: 16,
          padding: 24,
          width: '100%',
          maxWidth: 600,
          maxHeight: '80vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 24px' }}>Give 360 Feedback</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Review Cycle</label>
            <select
              value={formData.cycleId}
              onChange={(e) => setFormData({ ...formData, cycleId: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 14,
              }}
            >
              {cycles.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Give Feedback To</label>
            <select
              value={formData.toUserId}
              onChange={(e) => setFormData({ ...formData, toUserId: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 14,
              }}
            >
              <option value="">Select a colleague...</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} - {u.role}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Feedback Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'peer' })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 14,
              }}
            >
              <option value="peer">Peer</option>
              <option value="upward">Upward (to manager)</option>
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Your Feedback</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              rows={6}
              placeholder="Share constructive feedback about their performance, collaboration, and growth..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 14,
                resize: 'vertical',
              }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.isAnonymous}
                onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
              />
              <span style={{ fontSize: 14 }}>Submit anonymously</span>
            </label>
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
              Submit Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Mock data
const mockFeedbacks: Feedback[] = [
  {
    id: '1',
    cycleId: '2',
    cycleName: 'Q2 2026 Mid-Year Review',
    fromUser: { id: '2', name: 'Rahul Verma' },
    toUser: { id: '1', name: 'Priya Sharma' },
    type: 'peer',
    content: 'Priya has been an excellent collaborator on the frontend team. Her attention to detail and problem-solving skills have significantly improved our codebase. She consistently delivers high-quality work and is always willing to help others.',
    ratings: [
      { category: 'collaboration', score: 5 },
      { category: 'technical', score: 4 },
    ],
    isAnonymous: false,
    createdAt: '2026-05-15',
  },
  {
    id: '2',
    cycleId: '2',
    cycleName: 'Q2 2026 Mid-Year Review',
    fromUser: { id: '3', name: 'Sneha Patel' },
    toUser: { id: '1', name: 'Priya Sharma' },
    type: 'manager',
    content: 'Priya has shown tremendous growth this quarter. She took ownership of the new dashboard feature and delivered it ahead of schedule. Her communication with stakeholders has improved significantly. Keep up the great work!',
    ratings: [
      { category: 'performance', score: 5 },
      { category: 'leadership', score: 4 },
    ],
    isAnonymous: false,
    createdAt: '2026-05-20',
  },
  {
    id: '3',
    cycleId: '2',
    cycleName: 'Q2 2026 Mid-Year Review',
    fromUser: { id: '4', name: 'Amit Kumar' },
    toUser: { id: '1', name: 'Priya Sharma' },
    type: 'peer',
    content: 'Great mentor and team player. Always available to explain complex concepts and help juniors. Would love to see more leadership initiatives from her.',
    ratings: [
      { category: 'teamwork', score: 5 },
      { category: 'communication', score: 4 },
    ],
    isAnonymous: true,
    createdAt: '2026-05-18',
  },
];
