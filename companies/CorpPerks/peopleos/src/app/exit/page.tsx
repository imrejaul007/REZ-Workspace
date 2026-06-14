'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './page.module.css';

// Types
interface ExitInterview {
  interviewId: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  department?: string;
  role?: string;
  managerId?: string;
  managerName?: string;
  type: 'resignation' | 'termination' | 'retirement' | 'contract_end';
  resignationDate?: string;
  lastWorkingDay?: string;
  scheduledDate?: string;
  status: 'scheduled' | 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  responses: ExitResponse[];
  overallRating?: number;
  createdAt: string;
}

interface ExitResponse {
  questionId: string;
  question: string;
  answer: string;
  rating?: number;
}

interface ExitFeedback {
  feedbackId: string;
  category: string;
  feedbackType: 'reason' | 'comment' | 'suggestion' | 'compliment';
  content: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  createdAt: string;
}

interface OffboardingInstance {
  instanceId: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  interviewId?: string;
  department?: string;
  role?: string;
  startDate: string;
  targetEndDate: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  progress: number;
  tasks: OffboardingTask[];
  clearanceChecklist: ClearanceItem[];
  notes: string[];
}

interface OffboardingTask {
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

// Mock current user
const currentUser = {
  userId: 'admin-001',
  role: 'hr'
};

export default function ExitPage() {
  const [activeTab, setActiveTab] = useState<'interviews' | 'offboarding' | 'analytics'>('interviews');
  const [interviews, setInterviews] = useState<ExitInterview[]>([]);
  const [offboardings, setOffboardings] = useState<OffboardingInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showOffboardingModal, setShowOffboardingModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<ExitInterview | null>(null);
  const [selectedOffboarding, setSelectedOffboarding] = useState<OffboardingInstance | null>(null);

  // Interview form
  const [interviewForm, setInterviewForm] = useState({
    employeeId: '',
    employeeName: '',
    employeeEmail: '',
    department: '',
    role: '',
    managerId: '',
    type: 'resignation' as ExitInterview['type'],
    lastWorkingDay: '',
    scheduledDate: ''
  });

  // Offboarding form
  const [offboardingForm, setOffboardingForm] = useState({
    employeeId: '',
    employeeName: '',
    employeeEmail: '',
    lastWorkingDay: '',
    interviewId: ''
  });

  const fetchData = useCallback(async () => {
    try {
      const [exitRes, offboardRes] = await Promise.all([
        fetch('http://localhost:4733/api/exit?limit=100'),
        fetch('http://localhost:4733/api/offboarding?limit=100')
      ]);

      if (exitRes.ok) {
        const data = await exitRes.json();
        setInterviews(data.items || []);
      }
      if (offboardRes.ok) {
        const data = await offboardRes.json();
        setOffboardings(data.items || []);
      }
    } catch (error) {
      setInterviews(mockInterviews);
      setOffboardings(mockOffboardings);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleScheduleInterview = async () => {
    try {
      const res = await fetch('http://localhost:4733/api/exit/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interviewForm)
      });

      if (res.ok) {
        const data = await res.json();
        setInterviews(prev => [data.data, ...prev]);
        setShowInterviewModal(false);
        setInterviewForm({
          employeeId: '',
          employeeName: '',
          employeeEmail: '',
          department: '',
          role: '',
          managerId: '',
          type: 'resignation',
          lastWorkingDay: '',
          scheduledDate: ''
        });
      }
    } catch (error) {
      // Mock add
      const newInterview: ExitInterview = {
        interviewId: `EXT_${Date.now()}`,
        ...interviewForm,
        status: 'scheduled',
        responses: [],
        createdAt: new Date().toISOString()
      };
      setInterviews(prev => [newInterview, ...prev]);
      setShowInterviewModal(false);
    }
  };

  const handleStartOffboarding = async () => {
    try {
      const res = await fetch('http://localhost:4733/api/offboarding/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offboardingForm)
      });

      if (res.ok) {
        const data = await res.json();
        setOffboardings(prev => [data.data, ...prev]);
        setShowOffboardingModal(false);
      }
    } catch (error) {
      // Mock add
      const newOffboarding: OffboardingInstance = {
        instanceId: `OFB_${Date.now()}`,
        ...offboardingForm,
        startDate: new Date().toISOString(),
        targetEndDate: offboardingForm.lastWorkingDay,
        status: 'not_started',
        progress: 0,
        tasks: mockOffboardings[0]?.tasks || [],
        clearanceChecklist: [
          { category: 'Manager Clearance', cleared: false },
          { category: 'IT Clearance', cleared: false },
          { category: 'Finance Clearance', cleared: false },
          { category: 'HR Clearance', cleared: false }
        ],
        notes: []
      };
      setOffboardings(prev => [newOffboarding, ...prev]);
      setShowOffboardingModal(false);
    }
  };

  const handleCompleteTask = async (instanceId: string, taskId: string) => {
    setOffboardings(prev => prev.map(i => {
      if (i.instanceId === instanceId) {
        const updatedTasks = i.tasks.map(t =>
          t.taskId === taskId ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString() } : t
        );
        const completedCount = updatedTasks.filter(t => t.status === 'completed' || t.status === 'skipped').length;
        return { ...i, tasks: updatedTasks, progress: Math.round((completedCount / updatedTasks.length) * 100) };
      }
      return i;
    }));
  };

  const handleUpdateClearance = (instanceId: string, category: string, cleared: boolean) => {
    setOffboardings(prev => prev.map(i => {
      if (i.instanceId === instanceId) {
        const updated = i.clearanceChecklist.map(c =>
          c.category === category ? { ...c, cleared, clearedAt: new Date().toISOString() } : c
        );
        return { ...i, clearanceChecklist: updated };
      }
      return i;
    }));
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: '#3B82F6',
      pending: '#F59E0B',
      in_progress: '#8B5CF6',
      completed: '#22C55E',
      cancelled: '#6B7280',
      no_show: '#EF4444',
      not_started: '#9CA3AF',
      blocked: '#EF4444'
    };
    return colors[status] || '#9CA3AF';
  };

  const getExitTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      resignation: 'Resignation',
      termination: 'Termination',
      retirement: 'Retirement',
      contract_end: 'Contract End'
    };
    return labels[type] || type;
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

  // Stats
  const stats = {
    total: interviews.length,
    scheduled: interviews.filter(i => i.status === 'scheduled').length,
    inProgress: interviews.filter(i => i.status === 'in_progress').length + offboardings.filter(o => o.status === 'in_progress').length,
    completed: interviews.filter(i => i.status === 'completed').length,
    offboardingActive: offboardings.filter(o => o.status === 'in_progress').length,
    pendingClearance: offboardings.filter(o => o.status === 'in_progress').length -
      offboardings.filter(o => o.status === 'in_progress').reduce((acc, o) =>
        acc + o.clearanceChecklist.filter(c => c.cleared).length, 0
      )
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading exit data...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Exit Management</h1>
          <p className={styles.subtitle}>Handle employee transitions smoothly with exit interviews and offboarding</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.primaryBtn} onClick={() => setShowInterviewModal(true)}>
            + Schedule Interview
          </button>
          <button className={styles.secondaryBtn} onClick={() => setShowOffboardingModal(true)}>
            Start Offboarding
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: '#8B5CF6' }}>{stats.total}</span>
          <span className={styles.statLabel}>Total Exits</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: '#3B82F6' }}>{stats.scheduled}</span>
          <span className={styles.statLabel}>Scheduled</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: '#F59E0B' }}>{stats.inProgress}</span>
          <span className={styles.statLabel}>In Progress</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: '#22C55E' }}>{stats.completed}</span>
          <span className={styles.statLabel}>Completed</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: '#EF4444' }}>{stats.pendingClearance}</span>
          <span className={styles.statLabel}>Pending Clearance</span>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'interviews' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('interviews')}
        >
          Exit Interviews
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'offboarding' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('offboarding')}
        >
          Offboarding
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'analytics' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
      </div>

      {/* Content */}
      {activeTab === 'interviews' && (
        <div className={styles.content}>
          {interviews.length === 0 ? (
            <div className={styles.emptyState}>
              <span style={{ fontSize: 48 }}>📋</span>
              <h3>No exit interviews</h3>
              <p>Schedule an exit interview when an employee resigns</p>
              <button className={styles.primaryBtn} onClick={() => setShowInterviewModal(true)}>
                Schedule Interview
              </button>
            </div>
          ) : (
            <div className={styles.interviewsList}>
              {interviews.map(interview => (
                <div
                  key={interview.interviewId}
                  className={styles.interviewCard}
                  onClick={() => setSelectedInterview(interview)}
                >
                  <div className={styles.interviewHeader}>
                    <div className={styles.avatar}>
                      {interview.employeeName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className={styles.interviewInfo}>
                      <h3>{interview.employeeName}</h3>
                      <p>{interview.role || interview.department}</p>
                    </div>
                    <span
                      className={styles.statusBadge}
                      style={{ background: `${getStatusColor(interview.status)}20`, color: getStatusColor(interview.status) }}
                    >
                      {getExitTypeLabel(interview.type)} - {interview.status}
                    </span>
                  </div>

                  <div className={styles.interviewDetails}>
                    <div className={styles.detail}>
                      <span className={styles.detailLabel}>Last Working Day</span>
                      <span>{interview.lastWorkingDay ? new Date(interview.lastWorkingDay).toLocaleDateString() : 'Not set'}</span>
                    </div>
                    <div className={styles.detail}>
                      <span className={styles.detailLabel}>Scheduled</span>
                      <span>{interview.scheduledDate ? new Date(interview.scheduledDate).toLocaleDateString() : 'Pending'}</span>
                    </div>
                    {interview.overallRating && (
                      <div className={styles.detail}>
                        <span className={styles.detailLabel}>Rating</span>
                        <span>{interview.overallRating}/5</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'offboarding' && (
        <div className={styles.content}>
          {offboardings.length === 0 ? (
            <div className={styles.emptyState}>
              <span style={{ fontSize: 48 }}>📦</span>
              <h3>No active offboarding</h3>
              <p>Start offboarding when an employee's last day is confirmed</p>
              <button className={styles.primaryBtn} onClick={() => setShowOffboardingModal(true)}>
                Start Offboarding
              </button>
            </div>
          ) : (
            <div className={styles.offboardingList}>
              {offboardings.map(offboard => (
                <div
                  key={offboard.instanceId}
                  className={styles.offboardCard}
                  onClick={() => setSelectedOffboarding(offboard)}
                >
                  <div className={styles.offboardHeader}>
                    <div className={styles.avatar}>
                      {offboard.employeeName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className={styles.offboardInfo}>
                      <h3>{offboard.employeeName}</h3>
                      <p>{offboard.role || offboard.department}</p>
                    </div>
                    <span
                      className={styles.statusBadge}
                      style={{ background: `${getStatusColor(offboard.status)}20`, color: getStatusColor(offboard.status) }}
                    >
                      {offboard.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className={styles.progressSection}>
                    <div className={styles.progressHeader}>
                      <span>Progress</span>
                      <span>{offboard.progress}%</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${offboard.progress}%`, background: getStatusColor(offboard.status) }}
                      ></div>
                    </div>
                  </div>

                  <div className={styles.clearanceStatus}>
                    {offboard.clearanceChecklist.map(c => (
                      <span
                        key={c.category}
                        className={`${styles.clearanceBadge} ${c.cleared ? styles.cleared : ''}`}
                      >
                        {c.cleared ? '✓' : '○'} {c.category}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className={styles.content}>
          <div className={styles.analyticsGrid}>
            <div className={styles.analyticsCard}>
              <h3>Exit Reasons</h3>
              <div className={styles.analyticsChart}>
                {['Resignation', 'Termination', 'Retirement', 'Contract End'].map(reason => {
                  const count = interviews.filter(i => i.type === reason.toLowerCase().replace(' ', '_')).length;
                  return (
                    <div key={reason} className={styles.chartRow}>
                      <span>{reason}</span>
                      <div className={styles.chartBar} style={{ width: `${Math.max(count * 10, 5)}%` }}></div>
                      <span>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.analyticsCard}>
              <h3>Exit Interview Rating</h3>
              <div className={styles.ratingDisplay}>
                <span className={styles.bigRating}>
                  {interviews.filter(i => i.overallRating).length > 0
                    ? (interviews.filter(i => i.overallRating).reduce((sum, i) => sum + (i.overallRating || 0), 0) /
                        interviews.filter(i => i.overallRating).length).toFixed(1)
                    : 'N/A'}
                </span>
                <span>/ 5</span>
              </div>
              <div className={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map(star => (
                  <span key={star} style={{ color: '#F59E0B' }}>★</span>
                ))}
              </div>
            </div>

            <div className={styles.analyticsCard}>
              <h3>Clearance Status</h3>
              <div className={styles.clearanceStats}>
                {offboardings.filter(o => o.status === 'in_progress').map(o => (
                  <div key={o.instanceId} className={styles.clearanceRow}>
                    <span>{o.employeeName}</span>
                    <span>{o.clearanceChecklist.filter(c => c.cleared).length}/{o.clearanceChecklist.length} cleared</span>
                  </div>
                ))}
                {offboardings.filter(o => o.status === 'in_progress').length === 0 && (
                  <p className={styles.noData}>No active offboarding</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interview Detail Modal */}
      {selectedInterview && (
        <div className={styles.modal} onClick={() => setSelectedInterview(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2>{selectedInterview.employeeName}</h2>
                <p>{selectedInterview.role || selectedInterview.department} - {getExitTypeLabel(selectedInterview.type)}</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelectedInterview(null)}>×</button>
            </div>

            <div className={styles.modalSection}>
              <h4>Interview Details</h4>
              <div className={styles.detailGrid}>
                <div><span>Employee ID:</span> {selectedInterview.employeeId}</div>
                <div><span>Email:</span> {selectedInterview.employeeEmail}</div>
                <div><span>Last Working Day:</span> {selectedInterview.lastWorkingDay ? new Date(selectedInterview.lastWorkingDay).toLocaleDateString() : 'Not set'}</div>
                <div><span>Scheduled Date:</span> {selectedInterview.scheduledDate ? new Date(selectedInterview.scheduledDate).toLocaleDateString() : 'Pending'}</div>
                <div><span>Status:</span> {selectedInterview.status}</div>
                {selectedInterview.overallRating && <div><span>Rating:</span> {selectedInterview.overallRating}/5</div>}
              </div>
            </div>

            {selectedInterview.responses.length > 0 && (
              <div className={styles.modalSection}>
                <h4>Responses</h4>
                {selectedInterview.responses.map((r, i) => (
                  <div key={i} className={styles.responseItem}>
                    <strong>{r.question}</strong>
                    <p>{r.answer}</p>
                    {r.rating && <span className={styles.rating}>Rating: {r.rating}/5</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Offboarding Detail Modal */}
      {selectedOffboarding && (
        <div className={styles.modal} onClick={() => setSelectedOffboarding(null)}>
          <div className={styles.modalContentLarge} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2>{selectedOffboarding.employeeName}</h2>
                <p>{selectedOffboarding.role || selectedOffboarding.department}</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelectedOffboarding(null)}>×</button>
            </div>

            <div className={styles.modalProgress}>
              <div className={styles.progressHeader}>
                <span>Overall Progress</span>
                <span>{selectedOffboarding.progress}%</span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${selectedOffboarding.progress}%` }}
                ></div>
              </div>
            </div>

            <div className={styles.modalTabs}>
              <button className={`${styles.modalTab} ${styles.activeModalTab}`}>Tasks</button>
              <button className={styles.modalTab}>Clearance</button>
            </div>

            <div className={styles.tasksList}>
              {selectedOffboarding.tasks
                .sort((a, b) => a.order - b.order)
                .map(task => (
                  <div key={task.taskId} className={styles.taskItem}>
                    <span className={styles.taskIcon}>{getCategoryIcon(task.category)}</span>
                    <div className={styles.taskInfo}>
                      <span className={styles.taskTitle}>{task.title}</span>
                      <span className={styles.taskMeta}>
                        {task.assigneeType} • Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <span
                      className={styles.taskStatus}
                      style={{ color: getStatusColor(task.status) }}
                    >
                      {task.status === 'completed' ? '✓' : task.status === 'pending' ? '○' : '◐'}
                    </span>
                    {task.status !== 'completed' && currentUser.role === 'hr' && (
                      <button
                        className={styles.completeBtn}
                        onClick={() => handleCompleteTask(selectedOffboarding.instanceId, task.taskId)}
                      >
                        Complete
                      </button>
                    )}
                  </div>
                ))}
            </div>

            <div className={styles.clearanceSection}>
              <h4>Clearance Checklist</h4>
              {selectedOffboarding.clearanceChecklist.map(c => (
                <div key={c.category} className={styles.clearanceItem}>
                  <span>{c.cleared ? '✓' : '○'}</span>
                  <span className={c.cleared ? styles.clearedText : ''}>{c.category}</span>
                  {c.cleared && <span className={styles.clearedBy}>by {c.clearedBy}</span>}
                  {!c.cleared && currentUser.role === 'hr' && (
                    <button
                      className={styles.clearBtn}
                      onClick={() => handleUpdateClearance(selectedOffboarding.instanceId, c.category, true)}
                    >
                      Mark Cleared
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showInterviewModal && (
        <div className={styles.modal} onClick={() => setShowInterviewModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Schedule Exit Interview</h2>
              <button className={styles.closeBtn} onClick={() => setShowInterviewModal(false)}>×</button>
            </div>

            <div className={styles.form}>
              <div className={styles.formField}>
                <label>Employee Name *</label>
                <input
                  type="text"
                  value={interviewForm.employeeName}
                  onChange={e => setInterviewForm(prev => ({ ...prev, employeeName: e.target.value }))}
                  placeholder="Enter employee name"
                />
              </div>

              <div className={styles.formField}>
                <label>Employee Email *</label>
                <input
                  type="email"
                  value={interviewForm.employeeEmail}
                  onChange={e => setInterviewForm(prev => ({ ...prev, employeeEmail: e.target.value }))}
                  placeholder="employee@company.com"
                />
              </div>

              <div className={styles.formField}>
                <label>Exit Type *</label>
                <select
                  value={interviewForm.type}
                  onChange={e => setInterviewForm(prev => ({ ...prev, type: e.target.value as ExitInterview['type'] }))}
                >
                  <option value="resignation">Resignation</option>
                  <option value="termination">Termination</option>
                  <option value="retirement">Retirement</option>
                  <option value="contract_end">Contract End</option>
                </select>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label>Last Working Day</label>
                  <input
                    type="date"
                    value={interviewForm.lastWorkingDay}
                    onChange={e => setInterviewForm(prev => ({ ...prev, lastWorkingDay: e.target.value }))}
                  />
                </div>
                <div className={styles.formField}>
                  <label>Scheduled Date</label>
                  <input
                    type="date"
                    value={interviewForm.scheduledDate}
                    onChange={e => setInterviewForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className={styles.formField}>
                <label>Department</label>
                <input
                  type="text"
                  value={interviewForm.department}
                  onChange={e => setInterviewForm(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="e.g., Engineering"
                />
              </div>

              <div className={styles.formActions}>
                <button className={styles.secondaryBtn} onClick={() => setShowInterviewModal(false)}>
                  Cancel
                </button>
                <button
                  className={styles.primaryBtn}
                  onClick={handleScheduleInterview}
                  disabled={!interviewForm.employeeName || !interviewForm.employeeEmail}
                >
                  Schedule Interview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Start Offboarding Modal */}
      {showOffboardingModal && (
        <div className={styles.modal} onClick={() => setShowOffboardingModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Start Offboarding</h2>
              <button className={styles.closeBtn} onClick={() => setShowOffboardingModal(false)}>×</button>
            </div>

            <div className={styles.form}>
              <div className={styles.formField}>
                <label>Employee Name *</label>
                <input
                  type="text"
                  value={offboardingForm.employeeName}
                  onChange={e => setOffboardingForm(prev => ({ ...prev, employeeName: e.target.value }))}
                  placeholder="Enter employee name"
                />
              </div>

              <div className={styles.formField}>
                <label>Employee Email *</label>
                <input
                  type="email"
                  value={offboardingForm.employeeEmail}
                  onChange={e => setOffboardingForm(prev => ({ ...prev, employeeEmail: e.target.value }))}
                  placeholder="employee@company.com"
                />
              </div>

              <div className={styles.formField}>
                <label>Last Working Day *</label>
                <input
                  type="date"
                  value={offboardingForm.lastWorkingDay}
                  onChange={e => setOffboardingForm(prev => ({ ...prev, lastWorkingDay: e.target.value }))}
                />
              </div>

              <div className={styles.formActions}>
                <button className={styles.secondaryBtn} onClick={() => setShowOffboardingModal(false)}>
                  Cancel
                </button>
                <button
                  className={styles.primaryBtn}
                  onClick={handleStartOffboarding}
                  disabled={!offboardingForm.employeeName || !offboardingForm.employeeEmail || !offboardingForm.lastWorkingDay}
                >
                  Start Offboarding
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Mock data
const mockInterviews: ExitInterview[] = [
  {
    interviewId: 'EXT_1',
    employeeId: 'EMP-201',
    employeeName: 'Rahul Verma',
    employeeEmail: 'rahul@corpperks.com',
    department: 'Engineering',
    role: 'Senior Developer',
    type: 'resignation',
    lastWorkingDay: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'scheduled',
    responses: [],
    createdAt: new Date().toISOString()
  },
  {
    interviewId: 'EXT_2',
    employeeId: 'EMP-202',
    employeeName: 'Sneha Patel',
    employeeEmail: 'sneha@corpperks.com',
    department: 'Marketing',
    role: 'Marketing Manager',
    type: 'resignation',
    lastWorkingDay: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'in_progress',
    responses: [
      { questionId: 'q1', question: 'Reason for leaving', answer: 'Better opportunity', rating: 4 },
      { questionId: 'q2', question: 'Manager relationship', answer: 'Good overall, could improve 1:1 frequency', rating: 3 }
    ],
    overallRating: 4,
    createdAt: new Date().toISOString()
  }
];

const mockOffboardings: OffboardingInstance[] = [
  {
    instanceId: 'OFB_1',
    employeeId: 'EMP-201',
    employeeName: 'Rahul Verma',
    employeeEmail: 'rahul@corpperks.com',
    department: 'Engineering',
    role: 'Senior Developer',
    startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    targetEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'in_progress',
    progress: 25,
    tasks: [
      { taskId: 'OT1', title: 'Knowledge transfer - documentation', assigneeType: 'employee', category: 'knowledge_transfer', status: 'completed', dueDate: new Date().toISOString(), order: 0, isRequired: true },
      { taskId: 'OT2', title: 'Return company equipment', assigneeType: 'employee', category: 'equipment_return', status: 'in_progress', dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), order: 1, isRequired: true },
      { taskId: 'OT3', title: 'Revoke system access', assigneeType: 'it', category: 'access_revocation', status: 'pending', dueDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(), order: 2, isRequired: true },
      { taskId: 'OT4', title: 'Final payroll processing', assigneeType: 'finance', category: 'final_payroll', status: 'pending', dueDate: new Date(Date.now() + 33 * 24 * 60 * 60 * 1000).toISOString(), order: 3, isRequired: true }
    ],
    clearanceChecklist: [
      { category: 'Manager Clearance', cleared: true, clearedBy: 'admin-001', clearedAt: new Date().toISOString() },
      { category: 'IT Clearance', cleared: false },
      { category: 'Finance Clearance', cleared: false },
      { category: 'HR Clearance', cleared: false }
    ],
    notes: []
  }
];
