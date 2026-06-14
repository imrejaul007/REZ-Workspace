'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './page.module.css';

// Types
interface OnboardingTemplate {
  templateId: string;
  name: string;
  description: string;
  department?: string;
  role?: string;
  defaultDuration: number;
  steps: { stepId: string; name: string; order: number }[];
  tasks: { taskId: string; title: string; assigneeType: string; category: string }[];
  isActive: boolean;
  createdAt: string;
}

interface OnboardingInstance {
  instanceId: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  templateId: string;
  templateName: string;
  startDate: string;
  targetEndDate: string;
  status: 'not_started' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
  progress: number;
  tasks: Task[];
  department?: string;
  role?: string;
  managerId?: string;
}

interface Task {
  taskId: string;
  title: string;
  description: string;
  assigneeType: 'employee' | 'manager' | 'hr' | 'it' | 'finance';
  category: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  dueDate: string;
  completedAt?: string;
  order: number;
  isRequired: boolean;
}

// Mock current user
const currentUser = {
  userId: 'admin-001',
  role: 'hr',
  name: 'HR Admin'
};

export default function OnboardingPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'instances' | 'create'>('instances');
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
  const [instances, setInstances] = useState<OnboardingInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedInstance, setSelectedInstance] = useState<OnboardingInstance | null>(null);

  // Form state for creating instance
  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    employeeEmail: '',
    templateId: '',
    startDate: new Date().toISOString().split('T')[0],
    department: '',
    role: '',
    managerId: ''
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [templatesRes, instancesRes] = await Promise.all([
        fetch('http://localhost:4732/api/templates?limit=100'),
        fetch('http://localhost:4732/api/onboarding?limit=100')
      ]);

      if (templatesRes.ok) {
        const tData = await templatesRes.json();
        setTemplates(tData.items || []);
      }
      if (instancesRes.ok) {
        const iData = await instancesRes.json();
        setInstances(iData.items || []);
      }
    } catch (error) {
      // Use mock data for demo
      setTemplates(mockTemplates);
      setInstances(mockInstances);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create new onboarding instance
  const handleCreate = async () => {
    try {
      const res = await fetch('http://localhost:4732/api/onboarding/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const data = await res.json();
        setInstances(prev => [data.data, ...prev]);
        setShowCreateModal(false);
        setFormData({
          employeeId: '',
          employeeName: '',
          employeeEmail: '',
          templateId: '',
          startDate: new Date().toISOString().split('T')[0],
          department: '',
          role: '',
          managerId: ''
        });
        setActiveTab('instances');
      }
    } catch (error) {
      alert('Failed to create onboarding. Please try again.');
    }
  };

  // Complete task
  const handleCompleteTask = async (instanceId: string, taskId: string) => {
    try {
      const res = await fetch(`http://localhost:4732/api/onboarding/${instanceId}/task/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.userId },
        body: JSON.stringify({ status: 'completed' })
      });

      if (res.ok) {
        const data = await res.json();
        setInstances(prev => prev.map(i => i.instanceId === instanceId ? data.data : i));
        if (selectedInstance?.instanceId === instanceId) {
          setSelectedInstance(data.data);
        }
      }
    } catch (error) {
      // Update locally for demo
      setInstances(prev => prev.map(i => {
        if (i.instanceId === instanceId) {
          const updatedTasks = i.tasks.map(t =>
            t.taskId === taskId ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString() } : t
          );
          const completedCount = updatedTasks.filter(t => t.status === 'completed' || t.status === 'skipped').length;
          return { ...i, tasks: updatedTasks, progress: Math.round((completedCount / updatedTasks.length) * 100) };
        }
        return i;
      }));
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      not_started: '#9CA3AF',
      pending: '#F59E0B',
      in_progress: '#3B82F6',
      blocked: '#EF4444',
      completed: '#22C55E',
      skipped: '#6B7280',
      cancelled: '#991B1B'
    };
    return colors[status] || '#9CA3AF';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      documentation: '📄',
      training: '📚',
      equipment: '💻',
      introduction: '🤝',
      compliance: '✅',
      other: '📋'
    };
    return icons[category] || '📋';
  };

  // Stats
  const stats = {
    total: instances.length,
    active: instances.filter(i => i.status === 'in_progress').length,
    completed: instances.filter(i => i.status === 'completed').length,
    avgProgress: instances.length > 0
      ? Math.round(instances.reduce((sum, i) => sum + i.progress, 0) / instances.length)
      : 0
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading onboarding data...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Employee Onboarding</h1>
          <p className={styles.subtitle}>Manage onboarding templates and track new employee progress</p>
        </div>
        <button className={styles.primaryBtn} onClick={() => setShowCreateModal(true)}>
          + Start Onboarding
        </button>
      </header>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.total}</span>
          <span className={styles.statLabel}>Total Onboardings</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: '#3B82F6' }}>{stats.active}</span>
          <span className={styles.statLabel}>In Progress</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: '#22C55E' }}>{stats.completed}</span>
          <span className={styles.statLabel}>Completed</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.avgProgress}%</span>
          <span className={styles.statLabel}>Avg Progress</span>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'instances' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('instances')}
        >
          Active Onboardings
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'templates' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          Templates
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'create' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create Template
        </button>
      </div>

      {/* Content */}
      {activeTab === 'instances' && (
        <div className={styles.content}>
          {instances.length === 0 ? (
            <div className={styles.emptyState}>
              <span style={{ fontSize: 48 }}>👋</span>
              <h3>No active onboardings</h3>
              <p>Start onboarding a new employee to see them here</p>
              <button className={styles.primaryBtn} onClick={() => setShowCreateModal(true)}>
                Start Onboarding
              </button>
            </div>
          ) : (
            <div className={styles.instancesGrid}>
              {instances.map(instance => (
                <div
                  key={instance.instanceId}
                  className={styles.instanceCard}
                  onClick={() => setSelectedInstance(instance)}
                >
                  <div className={styles.instanceHeader}>
                    <div className={styles.avatar}>
                      {instance.employeeName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className={styles.instanceInfo}>
                      <h3>{instance.employeeName}</h3>
                      <p>{instance.role || instance.templateName}</p>
                    </div>
                    <span
                      className={styles.statusBadge}
                      style={{ background: `${getStatusColor(instance.status)}20`, color: getStatusColor(instance.status) }}
                    >
                      {instance.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className={styles.progressSection}>
                    <div className={styles.progressHeader}>
                      <span>Progress</span>
                      <span>{instance.progress}%</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${instance.progress}%`, background: getStatusColor(instance.status) }}
                      ></div>
                    </div>
                  </div>

                  <div className={styles.instanceFooter}>
                    <span>Started: {new Date(instance.startDate).toLocaleDateString()}</span>
                    <span>Due: {new Date(instance.targetEndDate).toLocaleDateString()}</span>
                  </div>

                  <div className={styles.taskPreview}>
                    <span className={styles.taskCount}>
                      {instance.tasks.filter(t => t.status === 'completed').length}/{instance.tasks.length} tasks
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'templates' && (
        <div className={styles.content}>
          <div className={styles.templatesGrid}>
            {templates.map(template => (
              <div key={template.templateId} className={styles.templateCard}>
                <div className={styles.templateHeader}>
                  <h3>{template.name}</h3>
                  <span className={styles.duration}>{template.defaultDuration} days</span>
                </div>
                <p className={styles.templateDesc}>{template.description}</p>
                <div className={styles.templateMeta}>
                  <span>{template.steps.length} steps</span>
                  <span>{template.tasks.length} tasks</span>
                  {template.department && <span>{template.department}</span>}
                </div>
                <div className={styles.templateFooter}>
                  <button
                    className={styles.secondaryBtn}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, templateId: template.templateId }));
                      setSelectedTemplate(template.templateId);
                      setShowCreateModal(true);
                    }}
                  >
                    Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'create' && (
        <div className={styles.content}>
          <div className={styles.formSection}>
            <h3>Create Onboarding Template</h3>
            <p className={styles.formDesc}>Build custom onboarding flows for different roles</p>
            <div className={styles.mockForm}>
              <div className={styles.mockField}>
                <label>Template Name</label>
                <input type="text" placeholder="e.g., Engineering Onboarding" />
              </div>
              <div className={styles.mockField}>
                <label>Department</label>
                <select>
                  <option>Engineering</option>
                  <option>Marketing</option>
                  <option>Sales</option>
                  <option>HR</option>
                  <option>Finance</option>
                </select>
              </div>
              <div className={styles.mockField}>
                <label>Duration (days)</label>
                <input type="number" defaultValue={30} />
              </div>
              <div className={styles.mockField}>
                <label>Steps</label>
                <div className={styles.stepsBuilder}>
                  {['Pre-Arrival', 'Day 1', 'Week 1', 'Month 1'].map((step, i) => (
                    <div key={i} className={styles.stepItem}>
                      <span>{i + 1}.</span>
                      <input type="text" defaultValue={step} />
                    </div>
                  ))}
                </div>
              </div>
              <button className={styles.primaryBtn} style={{ marginTop: 16 }}>Save Template</button>
            </div>
          </div>
        </div>
      )}

      {/* Instance Detail Modal */}
      {selectedInstance && (
        <div className={styles.modal} onClick={() => setSelectedInstance(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2>{selectedInstance.employeeName}</h2>
                <p>{selectedInstance.role || selectedInstance.templateName} - {selectedInstance.department}</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelectedInstance(null)}>×</button>
            </div>

            <div className={styles.modalProgress}>
              <div className={styles.progressHeader}>
                <span>Overall Progress</span>
                <span>{selectedInstance.progress}%</span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${selectedInstance.progress}%` }}
                ></div>
              </div>
            </div>

            <div className={styles.tasksList}>
              <h4>Tasks ({selectedInstance.tasks.filter(t => t.status === 'completed').length}/{selectedInstance.tasks.length})</h4>
              {selectedInstance.tasks
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
                    {task.status !== 'completed' && task.assigneeType !== 'employee' && currentUser.role === 'hr' && (
                      <button
                        className={styles.completeBtn}
                        onClick={() => handleCompleteTask(selectedInstance.instanceId, task.taskId)}
                      >
                        Complete
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className={styles.modal} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Start New Onboarding</h2>
              <button className={styles.closeBtn} onClick={() => setShowCreateModal(false)}>×</button>
            </div>

            <div className={styles.form}>
              <div className={styles.formField}>
                <label>Employee Name *</label>
                <input
                  type="text"
                  value={formData.employeeName}
                  onChange={e => setFormData(prev => ({ ...prev, employeeName: e.target.value }))}
                  placeholder="Enter employee name"
                />
              </div>

              <div className={styles.formField}>
                <label>Employee Email *</label>
                <input
                  type="email"
                  value={formData.employeeEmail}
                  onChange={e => setFormData(prev => ({ ...prev, employeeEmail: e.target.value }))}
                  placeholder="employee@company.com"
                />
              </div>

              <div className={styles.formField}>
                <label>Employee ID *</label>
                <input
                  type="text"
                  value={formData.employeeId}
                  onChange={e => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                  placeholder="EMP-001"
                />
              </div>

              <div className={styles.formField}>
                <label>Template *</label>
                <select
                  value={formData.templateId}
                  onChange={e => setFormData(prev => ({ ...prev, templateId: e.target.value }))}
                >
                  <option value="">Select a template</option>
                  {templates.map(t => (
                    <option key={t.templateId} value={t.templateId}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label>Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={e => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="e.g., Engineering"
                  />
                </div>
                <div className={styles.formField}>
                  <label>Role</label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="e.g., Software Engineer"
                  />
                </div>
              </div>

              <div className={styles.formField}>
                <label>Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div className={styles.formActions}>
                <button className={styles.secondaryBtn} onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button
                  className={styles.primaryBtn}
                  onClick={handleCreate}
                  disabled={!formData.employeeName || !formData.employeeEmail || !formData.templateId}
                >
                  Start Onboarding
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Mock data for demo
const mockTemplates: OnboardingTemplate[] = [
  {
    templateId: 'TPL_1',
    name: 'Standard Employee Onboarding',
    description: 'Complete onboarding process for all new employees including orientation, training, and setup',
    defaultDuration: 30,
    steps: [
      { stepId: 'S1', name: 'Pre-Arrival', order: 0 },
      { stepId: 'S2', name: 'Day 1', order: 1 },
      { stepId: 'S3', name: 'Week 1', order: 2 },
      { stepId: 'S4', name: 'Month 1', order: 3 }
    ],
    tasks: [
      { taskId: 'T1', title: 'Create employee profile', assigneeType: 'hr', category: 'documentation' },
      { taskId: 'T2', title: 'Set up email accounts', assigneeType: 'it', category: 'equipment' },
      { taskId: 'T3', title: 'Complete compliance training', assigneeType: 'employee', category: 'compliance' }
    ],
    isActive: true,
    createdAt: '2024-01-01'
  },
  {
    templateId: 'TPL_2',
    name: 'Engineering Onboarding',
    description: 'Specialized onboarding for engineering roles with dev environment setup',
    department: 'Engineering',
    defaultDuration: 45,
    steps: [
      { stepId: 'S1', name: 'Dev Environment', order: 0 },
      { stepId: 'S2', name: 'Codebase Introduction', order: 1 },
      { stepId: 'S3', name: 'First Sprint', order: 2 }
    ],
    tasks: [
      { taskId: 'T1', title: 'Clone repositories', assigneeType: 'it', category: 'equipment' },
      { taskId: 'T2', title: 'Architecture walkthrough', assigneeType: 'manager', category: 'training' }
    ],
    isActive: true,
    createdAt: '2024-01-15'
  }
];

const mockInstances: OnboardingInstance[] = [
  {
    instanceId: 'ONB_1',
    employeeId: 'EMP-101',
    employeeName: 'Priya Sharma',
    employeeEmail: 'priya@corpperks.com',
    templateId: 'TPL_1',
    templateName: 'Standard Employee Onboarding',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    targetEndDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'in_progress',
    progress: 35,
    department: 'Engineering',
    role: 'Software Engineer',
    tasks: [
      { taskId: 'T1', title: 'Create employee profile', description: '', assigneeType: 'hr', category: 'documentation', status: 'completed', dueDate: new Date().toISOString(), order: 0, isRequired: true },
      { taskId: 'T2', title: 'Set up email accounts', description: '', assigneeType: 'it', category: 'equipment', status: 'completed', dueDate: new Date().toISOString(), order: 1, isRequired: true },
      { taskId: 'T3', title: 'Complete compliance training', description: '', assigneeType: 'employee', category: 'compliance', status: 'in_progress', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), order: 2, isRequired: true },
      { taskId: 'T4', title: 'Meet with manager', description: '', assigneeType: 'manager', category: 'introduction', status: 'pending', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), order: 3, isRequired: true }
    ]
  },
  {
    instanceId: 'ONB_2',
    employeeId: 'EMP-102',
    employeeName: 'Rahul Verma',
    employeeEmail: 'rahul@corpperks.com',
    templateId: 'TPL_2',
    templateName: 'Engineering Onboarding',
    startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    targetEndDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'in_progress',
    progress: 60,
    department: 'Engineering',
    role: 'Senior Developer',
    tasks: [
      { taskId: 'T1', title: 'Clone repositories', description: '', assigneeType: 'it', category: 'equipment', status: 'completed', dueDate: new Date().toISOString(), order: 0, isRequired: true },
      { taskId: 'T2', title: 'Architecture walkthrough', description: '', assigneeType: 'manager', category: 'training', status: 'completed', dueDate: new Date().toISOString(), order: 1, isRequired: true },
      { taskId: 'T3', title: 'Submit first PR', description: '', assigneeType: 'employee', category: 'other', status: 'completed', dueDate: new Date().toISOString(), order: 2, isRequired: true }
    ]
  }
];
