'use client';

import {
  Users,
  TrendingUp,
  UserPlus,
  UserMinus,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Activity,
  HeartPulse,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Settings,
  Shield,
  BarChart3,
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, StatCard, Badge, Avatar, Button, ProgressBar } from '@/components/ui';
import { StatCard as StatCardComponent } from '@/components/StatCard';
import {
  analyticsOverview,
  moduleMetrics,
  systemHealth,
  quickActions,
  auditLogs,
  employeeGrowthData,
  attendanceTrend,
  leaveDistribution,
  employees,
} from '@/lib/mock-data';
import { formatRelativeTime, getStatusColor, cn } from '@/lib/utils';
import type { AuditLog, QuickAction } from '@/types';

export default function DashboardPage() {
  const { attendance, leave, payroll, performance, training } = moduleMetrics;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, Kavya. Here&apos;s what&apos;s happening today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            Download Report
          </Button>
          <Button size="sm" icon={<UserPlus className="h-4 w-4" />}>
            Add Employee
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {quickActions.slice(0, 6).map((action) => (
          <QuickActionCard key={action.id} action={action} />
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <StatCardComponent
          title="Total Employees"
          value={analyticsOverview.totalEmployees}
          subtitle={`${analyticsOverview.activeEmployees} active`}
          change={analyticsOverview.employeeGrowth}
          changeLabel="vs last month"
          trend="up"
          icon={<Users className="h-6 w-6 text-primary-500" />}
        />
        <StatCardComponent
          title="New Hires"
          value={analyticsOverview.newHires}
          subtitle="This month"
          change={12.5}
          changeLabel="vs last month"
          trend="up"
          icon={<UserPlus className="h-6 w-6 text-success-500" />}
        />
        <StatCardComponent
          title="Attendance Rate"
          value={`${attendance.rate}%`}
          subtitle={`${attendance.present} present today`}
          change={2.1}
          changeLabel="vs last week"
          trend="up"
          icon={<CheckCircle2 className="h-6 w-6 text-warning-500" />}
        />
        <StatCardComponent
          title="Pending Leaves"
          value={leave.pending}
          subtitle="Awaiting approval"
          change={-8.3}
          changeLabel="vs last week"
          trend="down"
          icon={<Clock className="h-6 w-6 text-danger-500" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Employee Growth Chart */}
        <Card className="lg:col-span-2" title="Employee Growth" subtitle="Last 5 months">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={employeeGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Attendance Trend */}
        <Card title="Attendance" subtitle="This week">
          <div className="space-y-4">
            {attendanceTrend.map((day, index) => (
              <div key={day.day} className="flex items-center gap-3">
                <span className="w-8 text-xs font-medium text-gray-500">{day.day}</span>
                <div className="flex-1">
                  <ProgressBar
                    value={day.rate}
                    max={100}
                    size="md"
                    color={day.rate >= 95 ? 'success' : day.rate >= 90 ? 'warning' : 'danger'}
                  />
                </div>
                <span className="w-10 text-right text-xs font-medium text-gray-700">
                  {day.rate}%
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Today&apos;s Rate</span>
              <span className="font-semibold text-gray-900">{attendance.rate}%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Module Status Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Leave Distribution */}
        <Card title="Leave Distribution" subtitle="By type">
          <div className="flex items-center gap-6">
            <div className="h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leaveDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {leaveDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              {leaveDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* System Health */}
        <Card title="System Health" subtitle="Services status">
          <div className="space-y-3">
            {systemHealth.services.slice(0, 6).map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'h-2.5 w-2.5 rounded-full',
                      service.status === 'up'
                        ? 'bg-success-500'
                        : service.status === 'degraded'
                          ? 'bg-warning-500'
                          : 'bg-danger-500'
                    )}
                  />
                  <span className="text-sm font-medium text-gray-700">{service.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-400">{service.latency}ms</span>
                  <Badge
                    variant={
                      service.status === 'up'
                        ? 'success'
                        : service.status === 'degraded'
                          ? 'warning'
                          : 'danger'
                    }
                    size="sm"
                  >
                    {service.status === 'up' ? 'Healthy' : service.status === 'degraded' ? 'Degraded' : 'Down'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-success-500" />
              <span className="text-sm text-gray-600">System Uptime</span>
            </div>
            <span className="text-sm font-semibold text-success-600">{systemHealth.uptime}%</span>
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2" title="Recent Activity" subtitle="Latest system events">
          <div className="divide-y divide-gray-100">
            {auditLogs.slice(0, 5).map((log) => (
              <ActivityItem key={log.id} log={log} />
            ))}
          </div>
          <div className="mt-4 border-t border-gray-100 pt-4">
            <a
              href="/audit"
              className="flex items-center justify-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View all activity
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        </Card>

        {/* Top Performers */}
        <Card title="Active Employees" subtitle="Currently at work">
          <div className="space-y-4">
            {employees
              .filter((e) => e.status === 'active')
              .slice(0, 5)
              .map((employee) => (
                <div key={employee.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={`${employee.firstName} ${employee.lastName}`} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {employee.firstName} {employee.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{employee.designation}</p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">
                    Active
                  </Badge>
                </div>
              ))}
          </div>
          <div className="mt-4 border-t border-gray-100 pt-4">
            <a
              href="/employees"
              className="flex items-center justify-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View all employees
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        </Card>
      </div>

      {/* Payroll Summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-50">
              <DollarSign className="h-5 w-5 text-success-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Payroll</p>
              <p className="text-xl font-semibold text-gray-900">
                ₹{(payroll.totalAmount / 100000).toFixed(1)}L
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
              <CheckCircle2 className="h-5 w-5 text-primary-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Processed</p>
              <p className="text-xl font-semibold text-gray-900">{payroll.processed}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-50">
              <Clock className="h-5 w-5 text-warning-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-xl font-semibold text-gray-900">{payroll.pending}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger-50">
              <AlertCircle className="h-5 w-5 text-danger-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Failed</p>
              <p className="text-xl font-semibold text-gray-900">{payroll.failed}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Quick Action Card Component
function QuickActionCard({ action }: { action: QuickAction }) {
  const icons: Record<string, React.ReactNode> = {
    UserPlus: <UserPlus className="h-5 w-5" />,
    Wallet: <DollarSign className="h-5 w-5" />,
    CalendarCheck: <CheckCircle2 className="h-5 w-5" />,
    FileBarChart: <BarChart3 className="h-5 w-5" />,
    Settings: <Settings className="h-5 w-5" />,
    Shield: <Shield className="h-5 w-5" />,
  };

  const badgeColors: Record<string, string> = {
    warning: 'bg-warning-100 text-warning-700',
    danger: 'bg-danger-100 text-danger-700',
    success: 'bg-success-100 text-success-700',
  };

  return (
    <a
      href={action.href}
      className="group flex flex-col items-center rounded-xl border border-gray-200 bg-white p-4 text-center transition-all hover:border-primary-200 hover:shadow-md"
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 text-gray-600 transition-colors group-hover:bg-primary-50 group-hover:text-primary-600">
        {icons[action.icon] || <Activity className="h-5 w-5" />}
      </div>
      <p className="text-sm font-medium text-gray-900">{action.title}</p>
      <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{action.description}</p>
      {action.badge && (
        <span
          className={cn(
            'absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium',
            badgeColors[action.badgeColor || 'default']
          )}
        >
          {action.badge}
        </span>
      )}
    </a>
  );
}

// Activity Item Component
function ActivityItem({ log }: { log: AuditLog }) {
  const actionColors: Record<string, string> = {
    create: 'text-success-600 bg-success-50',
    update: 'text-primary-600 bg-primary-50',
    delete: 'text-danger-600 bg-danger-50',
    login: 'text-gray-600 bg-gray-50',
    logout: 'text-gray-600 bg-gray-50',
    approve: 'text-success-600 bg-success-50',
    reject: 'text-danger-600 bg-danger-50',
    submit: 'text-primary-600 bg-primary-50',
    export: 'text-warning-600 bg-warning-50',
  };

  return (
    <div className="flex items-start gap-4 py-3">
      <div
        className={cn(
          'mt-0.5 rounded-full px-2 py-1 text-xs font-medium capitalize',
          actionColors[log.action] || 'text-gray-600 bg-gray-50'
        )}
      >
        {log.action}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">{log.details}</p>
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
          <span>{log.user}</span>
          <span>•</span>
          <span>{formatRelativeTime(log.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}
