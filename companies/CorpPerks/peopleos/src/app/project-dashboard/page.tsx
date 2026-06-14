'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

// Mock data for demonstration
const mockProjects = [
  {
    projectId: 'PROJ-00001',
    name: 'CorpHR Platform Upgrade',
    status: 'active',
    priority: 'high',
    health: 72,
    completionPercentage: 35,
    budget: 2500000,
    spentAmount: 875000,
    endDate: '2026-07-28',
    managerName: 'Rahul Sharma',
    teamSize: 5
  },
  {
    projectId: 'PROJ-00002',
    name: 'Mobile App v2.0',
    status: 'active',
    priority: 'critical',
    health: 58,
    completionPercentage: 64,
    budget: 5000000,
    spentAmount: 3200000,
    endDate: '2026-06-29',
    managerName: 'Rajesh Verma',
    teamSize: 4
  },
  {
    projectId: 'PROJ-00003',
    name: 'Data Analytics Dashboard',
    status: 'active',
    priority: 'medium',
    health: 85,
    completionPercentage: 52,
    budget: 1800000,
    spentAmount: 950000,
    endDate: '2026-07-13',
    managerName: 'Kavita Nair',
    teamSize: 3
  },
  {
    projectId: 'PROJ-00004',
    name: 'Security Audit & Compliance',
    status: 'planning',
    priority: 'high',
    health: 100,
    completionPercentage: 0,
    budget: 1200000,
    spentAmount: 0,
    endDate: '2026-08-28',
    managerName: 'Rahul Sharma',
    teamSize: 3
  },
  {
    projectId: 'PROJ-00005',
    name: 'Customer Portal Redesign',
    status: 'active',
    priority: 'medium',
    health: 68,
    completionPercentage: 30,
    budget: 1500000,
    spentAmount: 450000,
    endDate: '2026-07-09',
    managerName: 'Amit Kumar',
    teamSize: 3
  }
];

const mockDashboardStats = {
  activeProjects: 4,
  delayedProjects: 1,
  atRiskProjects: 1,
  completedThisMonth: 2,
  totalTeamMembers: 15,
  averageProjectHealth: 76,
  totalBudget: 12000000,
  totalSpent: 5675000
};

const mockAIAlerts = [
  { severity: 'high', message: 'Mobile App v2.0: 3 tasks blocked for 5+ days', projectId: 'PROJ-00002' },
  { severity: 'medium', message: 'CorpHR Platform: Team member inactive for 4 days', projectId: 'PROJ-00001' },
  { severity: 'high', message: 'Customer Portal: 8 hours overtime logged this week', projectId: 'PROJ-00005' }
];

const mockUpcomingDeadlines = [
  { projectId: 'PROJ-00002', projectName: 'Mobile App v2.0', daysRemaining: 30 },
  { projectId: 'PROJ-00005', projectName: 'Customer Portal Redesign', daysRemaining: 40 },
  { projectId: 'PROJ-00003', projectName: 'Data Analytics Dashboard', daysRemaining: 45 }
];

export default function ProjectDashboardPage() {
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = mockProjects.filter(project => {
    const matchesFilter = filter === 'all' || project.status === filter;
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getHealthColor = (health: number) => {
    if (health >= 80) return '#22C55E';
    if (health >= 60) return '#F59E0B';
    return '#EF4444';
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
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <h1>Project Dashboard</h1>
          <p className={styles.subtitle}>ProjectOS - Enterprise Project Management</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.createBtn}>
            <span>+</span> Create Project
          </button>
        </div>
      </header>

      {/* AI Alerts Banner */}
      {mockAIAlerts.length > 0 && (
        <div className={styles.alertsBanner}>
          <span className={styles.alertsIcon}>AI</span>
          <div className={styles.alertsList}>
            {mockAIAlerts.slice(0, 2).map((alert, idx) => (
              <span key={idx} className={`${styles.alertTag} ${styles[alert.severity]}`}>
                {alert.message}
              </span>
            ))}
          </div>
          <Link href="/project-dashboard/risks" className={styles.viewAlerts}>
            View All →
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>📊</span>
          <div>
            <span className={styles.statValue}>{mockDashboardStats.activeProjects}</span>
            <span className={styles.statLabel}>Active Projects</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.warning}`}>
          <span className={styles.statIcon}>⚠️</span>
          <div>
            <span className={styles.statValue}>{mockDashboardStats.delayedProjects}</span>
            <span className={styles.statLabel}>Delayed</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.danger}`}>
          <span className={styles.statIcon}>🚨</span>
          <div>
            <span className={styles.statValue}>{mockDashboardStats.atRiskProjects}</span>
            <span className={styles.statLabel}>At Risk</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>✅</span>
          <div>
            <span className={styles.statValue}>{mockDashboardStats.completedThisMonth}</span>
            <span className={styles.statLabel}>Completed</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>💚</span>
          <div>
            <span className={styles.statValue}>{mockDashboardStats.averageProjectHealth}%</span>
            <span className={styles.statLabel}>Avg Health</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>👥</span>
          <div>
            <span className={styles.statValue}>{mockDashboardStats.totalTeamMembers}</span>
            <span className={styles.statLabel}>Team Members</span>
          </div>
        </div>
      </div>

      {/* Budget Overview */}
      <div className={styles.budgetCard}>
        <h3>Budget Overview</h3>
        <div className={styles.budgetStats}>
          <div>
            <span className={styles.budgetLabel}>Total Budget</span>
            <span className={styles.budgetValue}>{formatCurrency(mockDashboardStats.totalBudget)}</span>
          </div>
          <div>
            <span className={styles.budgetLabel}>Spent</span>
            <span className={styles.budgetValue}>{formatCurrency(mockDashboardStats.totalSpent)}</span>
          </div>
          <div>
            <span className={styles.budgetLabel}>Remaining</span>
            <span className={styles.budgetValue}>
              {formatCurrency(mockDashboardStats.totalBudget - mockDashboardStats.totalSpent)}
            </span>
          </div>
        </div>
        <div className={styles.budgetBar}>
          <div
            className={styles.budgetFill}
            style={{ width: `${(mockDashboardStats.totalSpent / mockDashboardStats.totalBudget) * 100}%` }}
          />
        </div>
        <span className={styles.budgetPercent}>
          {Math.round((mockDashboardStats.totalSpent / mockDashboardStats.totalBudget) * 100)}% utilized
        </span>
      </div>

      <div className={styles.mainContent}>
        {/* Projects Grid */}
        <div className={styles.projectsSection}>
          <div className={styles.sectionHeader}>
            <h2>Projects</h2>
            <div className={styles.filters}>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="planning">Planning</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className={styles.projectsGrid}>
            {filteredProjects.map((project) => (
              <Link
                key={project.projectId}
                href={`/project-dashboard/${project.projectId}`}
                className={styles.projectCard}
              >
                <div className={styles.projectHeader}>
                  <span className={styles.projectId}>{project.projectId}</span>
                  <span
                    className={styles.priorityBadge}
                    style={{ backgroundColor: getPriorityColor(project.priority) }}
                  >
                    {project.priority}
                  </span>
                </div>
                <h3 className={styles.projectName}>{project.name}</h3>
                <div className={styles.projectMeta}>
                  <span>👤 {project.managerName}</span>
                  <span>👥 {project.teamSize}</span>
                </div>

                {/* Health Indicator */}
                <div className={styles.healthSection}>
                  <div className={styles.healthHeader}>
                    <span>Health</span>
                    <span style={{ color: getHealthColor(project.health) }}>{project.health}%</span>
                  </div>
                  <div className={styles.healthBar}>
                    <div
                      className={styles.healthFill}
                      style={{
                        width: `${project.health}%`,
                        backgroundColor: getHealthColor(project.health)
                      }}
                    />
                  </div>
                </div>

                {/* Progress */}
                <div className={styles.progressSection}>
                  <div className={styles.progressHeader}>
                    <span>Progress</span>
                    <span>{project.completionPercentage}%</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${project.completionPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Budget */}
                <div className={styles.budgetRow}>
                  <span className={styles.budgetItem}>
                    Budget: {formatCurrency(project.budget)}
                  </span>
                  <span className={styles.budgetItem}>
                    Spent: {formatCurrency(project.spentAmount)}
                  </span>
                </div>

                {/* Footer */}
                <div className={styles.projectFooter}>
                  <span className={`${styles.statusBadge} ${styles[project.status]}`}>
                    {project.status}
                  </span>
                  <span className={styles.daysRemaining}>
                    {getDaysRemaining(project.endDate)} days left
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className={styles.sidebar}>
          {/* Quick Links */}
          <div className={styles.sideCard}>
            <h3>Quick Actions</h3>
            <div className={styles.quickLinks}>
              <Link href="/project-dashboard/tasks" className={styles.quickLink}>
                📋 All Tasks
              </Link>
              <Link href="/project-dashboard/sprints" className={styles.quickLink}>
                🏃 Sprints
              </Link>
              <Link href="/project-dashboard/resources" className={styles.quickLink}>
                👥 Resources
              </Link>
              <Link href="/project-dashboard/team" className={styles.quickLink}>
                📊 Team Utilization
              </Link>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className={styles.sideCard}>
            <h3>Upcoming Deadlines</h3>
            <div className={styles.deadlines}>
              {mockUpcomingDeadlines.map((deadline) => (
                <div key={deadline.projectId} className={styles.deadline}>
                  <div className={styles.deadlineInfo}>
                    <span className={styles.deadlineName}>{deadline.projectName}</span>
                    <span className={styles.deadlineDays}>
                      {deadline.daysRemaining} days
                    </span>
                  </div>
                  <div
                    className={styles.deadlineBar}
                    style={{
                      backgroundColor: deadline.daysRemaining < 35 ? '#EF4444' :
                        deadline.daysRemaining < 50 ? '#F59E0B' : '#22C55E'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Team Capacity */}
          <div className={styles.sideCard}>
            <h3>Team Capacity</h3>
            <div className={styles.capacityList}>
              {[
                { name: 'Rahul Sharma', utilization: 85 },
                { name: 'Priya Patel', utilization: 72 },
                { name: 'Amit Kumar', utilization: 95 },
                { name: 'Sneha Reddy', utilization: 68 },
                { name: 'Vikram Singh', utilization: 78 }
              ].map((member) => (
                <div key={member.name} className={styles.capacityItem}>
                  <span className={styles.memberName}>{member.name}</span>
                  <div className={styles.utilizationBar}>
                    <div
                      className={styles.utilizationFill}
                      style={{
                        width: `${member.utilization}%`,
                        backgroundColor: member.utilization > 90 ? '#EF4444' :
                          member.utilization > 75 ? '#F59E0B' : '#22C55E'
                      }}
                    />
                  </div>
                  <span className={styles.utilizationPercent}>{member.utilization}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
