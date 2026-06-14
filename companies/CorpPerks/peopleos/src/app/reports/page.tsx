'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

// Types
interface ReportTemplate {
  _id: string;
  name: string;
  description: string;
  type: 'attendance' | 'performance' | 'financial' | 'custom' | 'lms';
  category: string;
  widgets: any[];
  isPublic: boolean;
  isDefault: boolean;
}

interface ReportInstance {
  _id: string;
  templateId: ReportTemplate;
  generatedAt: string;
  generatedBy: string;
  params: any[];
}

interface ReportStats {
  totalTemplates: number;
  totalReports: number;
  generatedThisWeek: number;
}

export default function ReportsPage() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [recentReports, setRecentReports] = useState<ReportInstance[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'templates' | 'recent'>('templates');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Try fetching from reports service
      const [templatesRes, reportsRes] = await Promise.allSettled([
        fetch(`${process.env.NEXT_PUBLIC_REPORTS_URL || 'http://localhost:4735'}/api/reports/templates`, {
          headers: { 'X-Tenant-Id': localStorage.getItem('tenantId') || 'default' },
        }),
        fetch(`${process.env.NEXT_PUBLIC_REPORTS_URL || 'http://localhost:4735'}/api/reports`, {
          headers: { 'X-Tenant-Id': localStorage.getItem('tenantId') || 'default' },
        }),
      ]);

      if (templatesRes.status === 'fulfilled') {
        const data = await templatesRes.value.json();
        setTemplates(data.data || []);
      }
      if (reportsRes.status === 'fulfilled') {
        const data = await reportsRes.value.json();
        setRecentReports(data.data || []);
      }
    } catch (error) {
      logger.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
      // Use mock data
      setTemplates(mockTemplates);
      setRecentReports(mockRecentReports);
      setStats({
        totalTemplates: 12,
        totalReports: 48,
        generatedThisWeek: 15,
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'attendance': return '📅';
      case 'performance': return '📈';
      case 'financial': return '💰';
      case 'lms': return '📚';
      default: return '📊';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'attendance': return styles.typeAttendance;
      case 'performance': return styles.typePerformance;
      case 'financial': return styles.typeFinancial;
      case 'lms': return styles.typeLms;
      default: return styles.typeCustom;
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading reports...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Reports Dashboard</h1>
          <p className={styles.subtitle}>Generate and manage custom reports</p>
        </div>
        <Link href="/reports/builder" className={styles.primaryBtn}>
          + Create Report
        </Link>
      </header>

      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📋</span>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.totalTemplates}</span>
              <span className={styles.statLabel}>Report Templates</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📄</span>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.totalReports}</span>
              <span className={styles.statLabel}>Total Reports</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📅</span>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.generatedThisWeek}</span>
              <span className={styles.statLabel}>This Week</span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'templates' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          Templates
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'recent' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('recent')}
        >
          Recent Reports
        </button>
      </div>

      {activeTab === 'templates' && (
        <div className={styles.templateGrid}>
          {templates.map((template) => (
            <div key={template._id} className={styles.templateCard}>
              <div className={styles.templateIcon}>
                {getTypeIcon(template.type)}
              </div>
              <div className={styles.templateContent}>
                <div className={styles.templateHeader}>
                  <h3>{template.name}</h3>
                  <span className={`${styles.typeBadge} ${getTypeColor(template.type)}`}>
                    {template.type}
                  </span>
                </div>
                <p className={styles.templateDescription}>{template.description}</p>
                <div className={styles.templateMeta}>
                  <span>{template.widgets?.length || 0} widgets</span>
                  <span>{template.category}</span>
                </div>
              </div>
              <div className={styles.templateActions}>
                <button className={styles.generateBtn}>
                  Generate Report
                </button>
                <button className={styles.viewBtn}>View</button>
              </div>
            </div>
          ))}

          {templates.length === 0 && (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>📊</span>
              <h3>No templates found</h3>
              <p>Create your first report template</p>
              <Link href="/reports/builder" className={styles.primaryBtn}>
                Create Template
              </Link>
            </div>
          )}
        </div>
      )}

      {activeTab === 'recent' && (
        <div className={styles.recentList}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Report</th>
                <th>Generated</th>
                <th>By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentReports.map((report) => (
                <tr key={report._id}>
                  <td>
                    <div className={styles.reportCell}>
                      <span className={styles.reportIcon}>
                        {getTypeIcon(report.templateId?.type || 'custom')}
                      </span>
                      <span className={styles.reportName}>
                        {report.templateId?.name || 'Custom Report'}
                      </span>
                    </div>
                  </td>
                  <td>{new Date(report.generatedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}</td>
                  <td>{report.generatedBy}</td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.actionBtn}>View</button>
                      <button className={styles.actionBtn}>Download</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {recentReports.length === 0 && (
            <div className={styles.emptyTable}>
              <p>No reports generated yet</p>
            </div>
          )}
        </div>
      )}

      <div className={styles.analyticsSection}>
        <h2>Quick Analytics</h2>
        <div className={styles.analyticsGrid}>
          <Link href="/reports/analytics/attendance" className={styles.analyticsCard}>
            <span className={styles.analyticsIcon}>📅</span>
            <div>
              <h3>Attendance Report</h3>
              <p>Track attendance patterns and trends</p>
            </div>
          </Link>
          <Link href="/reports/analytics/performance" className={styles.analyticsCard}>
            <span className={styles.analyticsIcon}>📈</span>
            <div>
              <h3>Performance Report</h3>
              <p>Employee performance metrics</p>
            </div>
          </Link>
          <Link href="/reports/analytics/financial" className={styles.analyticsCard}>
            <span className={styles.analyticsIcon}>💰</span>
            <div>
              <h3>Financial Report</h3>
              <p>Payroll and expense analytics</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Mock data
const mockTemplates: ReportTemplate[] = [
  {
    _id: '1',
    name: 'Monthly Attendance Summary',
    description: 'Comprehensive attendance report with daily breakdown and trends',
    type: 'attendance',
    category: 'HR',
    widgets: [{ id: '1' }, { id: '2' }],
    isPublic: true,
    isDefault: true,
  },
  {
    _id: '2',
    name: 'Employee Performance Overview',
    description: 'KPI tracking and performance metrics dashboard',
    type: 'performance',
    category: 'HR',
    widgets: [{ id: '1' }, { id: '2' }, { id: '3' }],
    isPublic: true,
    isDefault: false,
  },
  {
    _id: '3',
    name: 'Payroll Cost Analysis',
    description: 'Detailed payroll breakdown by department and employee',
    type: 'financial',
    category: 'Finance',
    widgets: [{ id: '1' }, { id: '2' }],
    isPublic: false,
    isDefault: false,
  },
  {
    _id: '4',
    name: 'Learning Progress Report',
    description: 'Track employee course completions and certifications',
    type: 'lms',
    category: 'Training',
    widgets: [{ id: '1' }],
    isPublic: true,
    isDefault: false,
  },
];

const mockRecentReports: ReportInstance[] = [
  {
    _id: '1',
    templateId: mockTemplates[0],
    generatedAt: new Date().toISOString(),
    generatedBy: 'Admin',
    params: [],
  },
  {
    _id: '2',
    templateId: mockTemplates[1],
    generatedAt: new Date(Date.now() - 86400000).toISOString(),
    generatedBy: 'HR Manager',
    params: [],
  },
  {
    _id: '3',
    templateId: mockTemplates[2],
    generatedAt: new Date(Date.now() - 172800000).toISOString(),
    generatedBy: 'Finance Team',
    params: [],
  },
];
