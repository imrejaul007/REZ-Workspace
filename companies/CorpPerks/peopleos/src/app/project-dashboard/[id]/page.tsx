'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

// Mock project data
const mockProject = {
  projectId: 'PROJ-00001',
  name: 'CorpHR Platform Upgrade',
  description: 'Major upgrade of the HR platform with new performance management features, employee self-service portal, and analytics dashboard.',
  status: 'active',
  priority: 'high',
  health: 72,
  completionPercentage: 35,
  budget: 2500000,
  spentAmount: 875000,
  startDate: '2026-04-30',
  endDate: '2026-07-28',
  managerId: 'EMP001',
  managerName: 'Rahul Sharma',
  teamMembers: [
    { id: 'EMP001', name: 'Rahul Sharma', role: 'Project Manager', avatar: '👨‍💼', tasksAssigned: 5 },
    { id: 'EMP002', name: 'Priya Patel', role: 'Senior Developer', avatar: '👩‍💻', tasksAssigned: 8 },
    { id: 'EMP003', name: 'Amit Kumar', role: 'UI/UX Designer', avatar: '👨‍🎨', tasksAssigned: 6 },
    { id: 'EMP004', name: 'Sneha Reddy', role: 'Backend Developer', avatar: '👩‍🔧', tasksAssigned: 7 },
    { id: 'EMP005', name: 'Vikram Singh', role: 'QA Engineer', avatar: '👨‍🔬', tasksAssigned: 4 }
  ],
  milestones: [
    { id: 'MS-00001', name: 'Phase 1: Core Infrastructure', status: 'completed', dueDate: '2026-05-20', completion: 100 },
    { id: 'MS-00002', name: 'Phase 2: Employee Management', status: 'in_progress', dueDate: '2026-06-15', completion: 60 },
    { id: 'MS-00003', name: 'Phase 3: Performance Reviews', status: 'pending', dueDate: '2026-07-28', completion: 0 }
  ],
  sprints: [
    { id: 'SPRINT-00001', name: 'Sprint 1 - Foundation', status: 'completed', plannedPoints: 21, completedPoints: 21 },
    { id: 'SPRINT-00002', name: 'Sprint 2 - Core Features', status: 'completed', plannedPoints: 34, completedPoints: 29 },
    { id: 'SPRINT-00003', name: 'Sprint 3 - Integration', status: 'active', plannedPoints: 28, completedPoints: 8 }
  ],
  aiRisks: [
    { type: 'blocked_tasks', severity: 'high', description: '3 tasks blocked by dependencies', suggestedAction: 'Review and unblock tasks' },
    { type: 'overtime_burnout', severity: 'medium', description: '2 team members logging >45 hours/week', suggestedAction: 'Redistribute workload' }
  ]
};

const mockTasks = [
  { taskId: 'TASK-00001', title: 'Setup project repository', status: 'done', assignee: 'Priya Patel', assigneeAvatar: '👩‍💻', priority: 'medium', dueDate: '2026-05-05', estimatedHours: 4, actualHours: 4, storyPoints: 2 },
  { taskId: 'TASK-00002', title: 'Configure CI/CD pipeline', status: 'done', assignee: 'Sneha Reddy', assigneeAvatar: '👩‍🔧', priority: 'high', dueDate: '2026-05-08', estimatedHours: 8, actualHours: 10, storyPoints: 3 },
  { taskId: 'TASK-00003', title: 'Design database schema', status: 'done', assignee: 'Sneha Reddy', assigneeAvatar: '👩‍🔧', priority: 'high', dueDate: '2026-05-12', estimatedHours: 6, actualHours: 7, storyPoints: 3 },
  { taskId: 'TASK-00004', title: 'Implement authentication', status: 'done', assignee: 'Priya Patel', assigneeAvatar: '👩‍💻', priority: 'critical', dueDate: '2026-05-18', estimatedHours: 16, actualHours: 20, storyPoints: 8 },
  { taskId: 'TASK-00005', title: 'Create API endpoints', status: 'in_progress', assignee: 'Priya Patel', assigneeAvatar: '👩‍💻', priority: 'high', dueDate: '2026-05-25', estimatedHours: 12, actualHours: 8, storyPoints: 5 },
  { taskId: 'TASK-00006', title: 'Build user dashboard', status: 'in_progress', assignee: 'Amit Kumar', assigneeAvatar: '👨‍🎨', priority: 'medium', dueDate: '2026-05-28', estimatedHours: 20, actualHours: 12, storyPoints: 8 },
  { taskId: 'TASK-00007', title: 'Implement search functionality', status: 'todo', assignee: 'Sneha Reddy', assigneeAvatar: '👩‍🔧', priority: 'medium', dueDate: '2026-06-02', estimatedHours: 8, actualHours: 0, storyPoints: 3 },
  { taskId: 'TASK-00008', title: 'Add notification system', status: 'todo', assignee: 'Priya Patel', assigneeAvatar: '👩‍💻', priority: 'low', dueDate: '2026-06-05', estimatedHours: 12, actualHours: 0, storyPoints: 5 },
  { taskId: 'TASK-00009', title: 'Write unit tests', status: 'todo', assignee: 'Vikram Singh', assigneeAvatar: '👨‍🔬', priority: 'high', dueDate: '2026-06-10', estimatedHours: 16, actualHours: 0, storyPoints: 5 },
  { taskId: 'TASK-00010', title: 'Performance optimization', status: 'blocked', assignee: 'Sneha Reddy', assigneeAvatar: '👩‍🔧', priority: 'medium', dueDate: '2026-06-15', estimatedHours: 8, actualHours: 0, storyPoints: 3 }
];

const mockActivity = [
  { type: 'task_completed', user: 'Priya Patel', action: 'completed task', target: 'Implement authentication', time: '2 hours ago' },
  { type: 'comment', user: 'Amit Kumar', action: 'commented on', target: 'Build user dashboard', time: '4 hours ago' },
  { type: 'task_started', user: 'Priya Patel', action: 'started', target: 'Create API endpoints', time: '1 day ago' },
  { type: 'task_blocked', user: 'System', action: 'blocked', target: 'Performance optimization', time: '2 days ago' },
  { type: 'milestone_progress', user: 'Rahul Sharma', action: 'updated milestone', target: 'Phase 2: Employee Management to 60%', time: '3 days ago' }
];

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<'tasks' | 'team' | 'milestones' | 'sprints' | 'analytics'>('tasks');
  const [taskFilter, setTaskFilter] = useState<string>('all');

  const filteredTasks = mockTasks.filter(task => {
    return taskFilter === 'all' || task.status === taskFilter;
  });

  const getHealthColor = (health: number) => {
    if (health >= 80) return '#22C55E';
    if (health >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return '#22C55E';
      case 'in_progress': return '#3B82F6';
      case 'review': return '#8B5CF6';
      case 'blocked': return '#EF4444';
      default: return '#64748B';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      default: return '#64748B';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/project-dashboard" className={styles.backLink}>
            ← Back to Dashboard
          </Link>
          <div className={styles.titleRow}>
            <div>
              <div className={styles.projectIdBadge}>{mockProject.projectId}</div>
              <h1 className={styles.title}>{mockProject.name}</h1>
            </div>
            <div className={styles.headerBadges}>
              <span
                className={styles.priorityBadge}
                style={{ backgroundColor: getPriorityColor(mockProject.priority) }}
              >
                {mockProject.priority}
              </span>
              <span className={`${styles.statusBadge} ${styles[mockProject.status]}`}>
                {mockProject.status}
              </span>
            </div>
          </div>
          <p className={styles.description}>{mockProject.description}</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.managerCard}>
            <span className={styles.managerAvatar}>👨‍💼</span>
            <div>
              <span className={styles.managerLabel}>Project Manager</span>
              <span className={styles.managerName}>{mockProject.managerName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Health & Progress Cards */}
      <div className={styles.metricsRow}>
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricIcon}>💚</span>
            <span className={styles.metricLabel}>Project Health</span>
          </div>
          <div className={styles.metricValue} style={{ color: getHealthColor(mockProject.health) }}>
            {mockProject.health}%
          </div>
          <div className={styles.healthBar}>
            <div
              className={styles.healthFill}
              style={{ width: `${mockProject.health}%`, backgroundColor: getHealthColor(mockProject.health) }}
            />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricIcon}>📊</span>
            <span className={styles.metricLabel}>Completion</span>
          </div>
          <div className={styles.metricValue}>{mockProject.completionPercentage}%</div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${mockProject.completionPercentage}%` }} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricIcon}>💰</span>
            <span className={styles.metricLabel}>Budget</span>
          </div>
          <div className={styles.metricValue}>{formatCurrency(mockProject.spentAmount)}</div>
          <span className={styles.metricSubtext}>of {formatCurrency(mockProject.budget)}</span>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricIcon}>📅</span>
            <span className={styles.metricLabel}>Days Remaining</span>
          </div>
          <div className={styles.metricValue}>{getDaysRemaining(mockProject.endDate)}</div>
          <span className={styles.metricSubtext}>Due {mockProject.endDate}</span>
        </div>
      </div>

      {/* AI Risks Alert */}
      {mockProject.aiRisks.length > 0 && (
        <div className={styles.risksBanner}>
          <div className={styles.risksHeader}>
            <span className={styles.risksIcon}>AI</span>
            <span>AI Risk Detection</span>
          </div>
          <div className={styles.risksList}>
            {mockProject.aiRisks.map((risk, idx) => (
              <div key={idx} className={`${styles.riskItem} ${styles[risk.severity]}`}>
                <span className={styles.riskType}>{risk.type.replace('_', ' ')}</span>
                <span className={styles.riskDesc}>{risk.description}</span>
                <span className={styles.riskAction}>→ {risk.suggestedAction}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'tasks' ? styles.active : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          📋 Tasks ({mockTasks.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'team' ? styles.active : ''}`}
          onClick={() => setActiveTab('team')}
        >
          👥 Team ({mockProject.teamMembers.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'milestones' ? styles.active : ''}`}
          onClick={() => setActiveTab('milestones')}
        >
          🎯 Milestones ({mockProject.milestones.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'sprints' ? styles.active : ''}`}
          onClick={() => setActiveTab('sprints')}
        >
          🏃 Sprints ({mockProject.sprints.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'analytics' ? styles.active : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analytics
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'tasks' && (
          <div className={styles.tasksSection}>
            <div className={styles.tasksHeader}>
              <h2>Tasks</h2>
              <div className={styles.taskFilters}>
                <select value={taskFilter} onChange={(e) => setTaskFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="todo">Todo</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                  <option value="blocked">Blocked</option>
                </select>
                <button className={styles.addTaskBtn}>+ Add Task</button>
              </div>
            </div>

            <div className={styles.tasksList}>
              {filteredTasks.map((task) => (
                <div key={task.taskId} className={styles.taskCard}>
                  <div className={styles.taskHeader}>
                    <div className={styles.taskTitle}>
                      <span className={styles.taskId}>{task.taskId}</span>
                      <span className={styles.taskName}>{task.title}</span>
                    </div>
                    <span
                      className={styles.taskStatus}
                      style={{ backgroundColor: getStatusColor(task.status), color: 'white' }}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className={styles.taskMeta}>
                    <span className={styles.assignee}>
                      <span>{task.assigneeAvatar}</span>
                      {task.assignee}
                    </span>
                    <span className={styles.priority} style={{ color: getPriorityColor(task.priority) }}>
                      {task.priority}
                    </span>
                    <span className={styles.dueDate}>Due: {task.dueDate}</span>
                    <span className={styles.hours}>{task.actualHours}h / {task.estimatedHours}h</span>
                    <span className={styles.points}>{task.storyPoints} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className={styles.teamSection}>
            <h2>Team Members</h2>
            <div className={styles.teamGrid}>
              {mockProject.teamMembers.map((member) => (
                <div key={member.id} className={styles.teamCard}>
                  <span className={styles.memberAvatar}>{member.avatar}</span>
                  <div className={styles.memberInfo}>
                    <span className={styles.memberName}>{member.name}</span>
                    <span className={styles.memberRole}>{member.role}</span>
                  </div>
                  <div className={styles.memberStats}>
                    <span className={styles.tasksAssigned}>{member.tasksAssigned} tasks</span>
                    <div className={styles.memberUtilization}>
                      <div className={styles.utilizationBar}>
                        <div
                          className={styles.utilizationFill}
                          style={{
                            width: `${(member.tasksAssigned / 10) * 100}%`,
                            backgroundColor: member.tasksAssigned > 8 ? '#EF4444' : '#22C55E'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'milestones' && (
          <div className={styles.milestonesSection}>
            <h2>Milestones</h2>
            <div className={styles.timeline}>
              {mockProject.milestones.map((milestone, idx) => (
                <div key={milestone.id} className={`${styles.milestone} ${styles[milestone.status]}`}>
                  <div className={styles.milestoneMarker}>
                    {milestone.status === 'completed' ? '✓' : idx + 1}
                  </div>
                  <div className={styles.milestoneContent}>
                    <div className={styles.milestoneHeader}>
                      <span className={styles.milestoneName}>{milestone.name}</span>
                      <span className={`${styles.milestoneStatus} ${styles[milestone.status]}`}>
                        {milestone.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className={styles.milestoneMeta}>
                      <span>Due: {milestone.dueDate}</span>
                      <span>{milestone.completion}% complete</span>
                    </div>
                    <div className={styles.milestoneProgress}>
                      <div
                        className={styles.milestoneFill}
                        style={{ width: `${milestone.completion}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'sprints' && (
          <div className={styles.sprintsSection}>
            <h2>Sprints</h2>
            <div className={styles.sprintsGrid}>
              {mockProject.sprints.map((sprint) => (
                <div key={sprint.id} className={`${styles.sprintCard} ${styles[sprint.status]}`}>
                  <div className={styles.sprintHeader}>
                    <span className={styles.sprintName}>{sprint.name}</span>
                    <span className={`${styles.sprintStatus} ${styles[sprint.status]}`}>
                      {sprint.status}
                    </span>
                  </div>
                  <div className={styles.sprintStats}>
                    <div className={styles.sprintStat}>
                      <span className={styles.statLabel}>Planned</span>
                      <span className={styles.statValue}>{sprint.plannedPoints} pts</span>
                    </div>
                    <div className={styles.sprintStat}>
                      <span className={styles.statLabel}>Completed</span>
                      <span className={styles.statValue}>{sprint.completedPoints} pts</span>
                    </div>
                    <div className={styles.sprintStat}>
                      <span className={styles.statLabel}>Velocity</span>
                      <span className={styles.statValue}>
                        {sprint.status === 'active' ? '—' : `${Math.round((sprint.completedPoints / sprint.plannedPoints) * 100)}%`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className={styles.analyticsSection}>
            <h2>Project Analytics</h2>
            <div className={styles.analyticsGrid}>
              <div className={styles.analyticsCard}>
                <h3>Task Distribution</h3>
                <div className={styles.distribution}>
                  {[
                    { status: 'Done', count: 4, color: '#22C55E' },
                    { status: 'In Progress', count: 2, color: '#3B82F6' },
                    { status: 'Todo', count: 3, color: '#64748B' },
                    { status: 'Blocked', count: 1, color: '#EF4444' }
                  ].map((item) => (
                    <div key={item.status} className={styles.distItem}>
                      <span className={styles.distLabel}>{item.status}</span>
                      <div className={styles.distBar}>
                        <div
                          className={styles.distFill}
                          style={{ width: `${(item.count / 10) * 100}%`, backgroundColor: item.color }}
                        />
                      </div>
                      <span className={styles.distCount}>{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.analyticsCard}>
                <h3>Time Tracked</h3>
                <div className={styles.timeStats}>
                  <div className={styles.timeStat}>
                    <span className={styles.timeValue}>49h</span>
                    <span className={styles.timeLabel}>Estimated</span>
                  </div>
                  <div className={styles.timeStat}>
                    <span className={styles.timeValue}>61h</span>
                    <span className={styles.timeLabel}>Actual</span>
                  </div>
                  <div className={styles.timeStat}>
                    <span className={styles.timeValue}>+24%</span>
                    <span className={styles.timeLabel}>Variance</span>
                  </div>
                </div>
              </div>

              <div className={styles.analyticsCard}>
                <h3>Team Velocity</h3>
                <div className={styles.velocity}>
                  <span className={styles.velocityValue}>75%</span>
                  <span className={styles.velocityLabel}>Average Sprint Completion</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Activity Feed */}
      <div className={styles.activitySection}>
        <h3>Recent Activity</h3>
        <div className={styles.activityList}>
          {mockActivity.map((activity, idx) => (
            <div key={idx} className={styles.activityItem}>
              <span className={styles.activityIcon}>
                {activity.type === 'task_completed' ? '✅' :
                 activity.type === 'comment' ? '💬' :
                 activity.type === 'task_started' ? '▶️' :
                 activity.type === 'task_blocked' ? '🚫' : '📝'}
              </span>
              <div className={styles.activityContent}>
                <span className={styles.activityUser}>{activity.user}</span>
                <span> {activity.action} </span>
                <span className={styles.activityTarget}>{activity.target}</span>
              </div>
              <span className={styles.activityTime}>{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
