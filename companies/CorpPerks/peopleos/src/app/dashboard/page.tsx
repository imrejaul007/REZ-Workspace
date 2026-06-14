import Link from 'next/link';
import styles from './page.module.css';

// Mock data
const mockStats = {
  totalEmployees: 45,
  presentToday: 42,
  pendingLeave: 8,
  openPositions: 12,
  applications: 156,
  interviews: 5,
};

const mockPipeline = [
  { stage: 'Applied', count: 45 },
  { stage: 'Screening', count: 23 },
  { stage: 'Interview', count: 12 },
  { stage: 'Offer', count: 4 },
];

const recentHires = [
  { id: '1', name: 'Priya Sharma', role: 'Frontend Developer', avatar: '👩‍💻', status: 'Joining Monday' },
  { id: '2', name: 'Rahul Verma', role: 'Backend Engineer', avatar: '👨‍💻', status: 'Offer Accepted' },
  { id: '3', name: 'Sneha Patel', role: 'Product Designer', avatar: '👩‍🎨', status: 'Background Check' },
];

const quickActions = [
  { icon: '👤', label: 'Add Employee', href: '/team/add' },
  { icon: '💼', label: 'Post Role', href: '/hiring/post' },
  { icon: '✅', label: 'Review Requests', href: '/leaves/approvals' },
  { icon: '📊', label: 'Insights', href: '/reports' },
];

export default function DashboardPage() {
  const attendanceRate = Math.round((mockStats.presentToday / mockStats.totalEmployees) * 100);

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <h1>Dashboard</h1>
          <p className={styles.subtitle}>Workforce Intelligence Platform</p>
        </div>
        <div className={styles.aiBadge}>
          <span>🧠</span> AI Insights Active
        </div>
      </header>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>👥</span>
          <div>
            <span className={styles.statValue}>{mockStats.totalEmployees}</span>
            <span className={styles.statLabel}>Total Employees</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>⏰</span>
          <div>
            <span className={styles.statValue}>{attendanceRate}%</span>
            <span className={styles.statLabel}>Attendance Today</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>💼</span>
          <div>
            <span className={styles.statValue}>{mockStats.openPositions}</span>
            <span className={styles.statLabel}>Open Positions</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>📨</span>
          <div>
            <span className={styles.statValue}>{mockStats.applications}</span>
            <span className={styles.statLabel}>New Applications</span>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Hiring Pipeline */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Hiring Pipeline</h2>
            <Link href="/hiring" className={styles.viewAll}>View All →</Link>
          </div>
          <div className={styles.pipeline}>
            {mockPipeline.map((stage) => (
              <div key={stage.stage} className={styles.pipelineStage}>
                <div className={styles.pipelineBar}>
                  <div
                    className={styles.pipelineFill}
                    style={{ width: `${(stage.count / mockPipeline[0].count) * 100}%` }}
                  />
                </div>
                <div className={styles.pipelineInfo}>
                  <span className={styles.pipelineCount}>{stage.count}</span>
                  <span className={styles.pipelineLabel}>{stage.stage}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Hires */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Recent Hires</h2>
            <Link href="/hiring" className={styles.viewAll}>View All →</Link>
          </div>
          <div className={styles.hires}>
            {recentHires.map((hire) => (
              <div key={hire.id} className={styles.hire}>
                <span className={styles.avatar}>{hire.avatar}</span>
                <div className={styles.hireInfo}>
                  <span className={styles.hireName}>{hire.name}</span>
                  <span className={styles.hireRole}>{hire.role}</span>
                </div>
                <span className={styles.hireStatus}>{hire.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.card}>
          <h2>Quick Actions</h2>
          <div className={styles.quickActions}>
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href} className={styles.quickAction}>
                <span className={styles.quickIcon}>{action.icon}</span>
                <span>{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Pending Approvals */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Pending Approvals</h2>
          </div>
          <div className={styles.approvals}>
            <div className={styles.approval}>
              <span className={styles.approvalIcon}>🏖️</span>
              <div className={styles.approvalInfo}>
                <span className={styles.approvalName}>Amit Kumar</span>
                <span className={styles.approvalType}>Leave Request - 3 days</span>
              </div>
              <div className={styles.approvalActions}>
                <button className={styles.approveBtn}>✓</button>
                <button className={styles.rejectBtn}>✗</button>
              </div>
            </div>
            <div className={styles.approval}>
              <span className={styles.approvalIcon}>💰</span>
              <div className={styles.approvalInfo}>
                <span className={styles.approvalName}>Neha Singh</span>
                <span className={styles.approvalType}>Expense Claim - ₹5,000</span>
              </div>
              <div className={styles.approvalActions}>
                <button className={styles.approveBtn}>✓</button>
                <button className={styles.rejectBtn}>✗</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
