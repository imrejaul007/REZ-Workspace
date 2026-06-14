'use client';

import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Filter,
  Users,
  DollarSign,
  Clock,
  Award,
  GraduationCap,
  Target,
  FileText,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, Badge, Button, Select, Tabs } from '@/components/ui';
import { StatCard } from '@/components/StatCard';
import {
  analyticsOverview,
  moduleMetrics,
  departmentDistribution,
  employees,
} from '@/lib/mock-data';
import { cn, formatCurrency } from '@/lib/utils';

// Chart data
const monthlyTrends = [
  { month: 'Jan', employees: 118, hires: 5, departures: 2, attendance: 94 },
  { month: 'Feb', employees: 120, hires: 4, departures: 2, attendance: 96 },
  { month: 'Mar', employees: 124, hires: 6, departures: 2, attendance: 95 },
  { month: 'Apr', employees: 126, hires: 3, departures: 1, attendance: 93 },
  { month: 'May', employees: 134, hires: 8, departures: 3, attendance: 94 },
];

const performanceData = [
  { rating: '5 - Exceptional', count: 18, percentage: 18 },
  { rating: '4 - Exceeds', count: 42, percentage: 42 },
  { rating: '3 - Meets', count: 32, percentage: 32 },
  { rating: '2 - Needs Improvement', count: 6, percentage: 6 },
  { rating: '1 - Below Expectations', count: 2, percentage: 2 },
];

const trainingCompletion = [
  { month: 'Jan', enrolled: 45, completed: 28 },
  { month: 'Feb', enrolled: 52, completed: 35 },
  { month: 'Mar', enrolled: 48, completed: 30 },
  { month: 'Apr', enrolled: 65, completed: 42 },
  { month: 'May', enrolled: 72, completed: 48 },
];

const payrollTrend = [
  { month: 'Jan', amount: 16200000 },
  { month: 'Feb', amount: 16400000 },
  { month: 'Mar', amount: 16800000 },
  { month: 'Apr', amount: 17200000 },
  { month: 'May', amount: 18500000 },
];

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#6b7280'];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');

  const { attendance, leave, payroll, performance, training } = moduleMetrics;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'workforce', label: 'Workforce' },
    { id: 'performance', label: 'Performance' },
    { id: 'financial', label: 'Financial' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Cross-module insights and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            options={[
              { value: '7d', label: 'Last 7 days' },
              { value: '30d', label: 'Last 30 days' },
              { value: '90d', label: 'Last 90 days' },
              { value: '1y', label: 'Last year' },
            ]}
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-40"
          />
          <Button variant="outline" size="sm" icon={<Download className="h-4 w-4" />}>
            Export Report
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Employees"
              value={analyticsOverview.totalEmployees}
              subtitle={`${analyticsOverview.activeEmployees} active`}
              change={analyticsOverview.employeeGrowth}
              changeLabel="vs last month"
              trend="up"
              icon={<Users className="h-6 w-6 text-primary-500" />}
            />
            <StatCard
              title="Retention Rate"
              value={`${analyticsOverview.retentionRate}%`}
              subtitle="This quarter"
              change={1.2}
              changeLabel="vs last quarter"
              trend="up"
              icon={<Target className="h-6 w-6 text-success-500" />}
            />
            <StatCard
              title="Avg. Tenure"
              value={`${analyticsOverview.averageTenure} yrs`}
              subtitle="Employee longevity"
              change={0.3}
              changeLabel="vs last year"
              trend="up"
              icon={<Clock className="h-6 w-6 text-warning-500" />}
            />
            <StatCard
              title="Payroll This Month"
              value={`₹${(payroll.totalAmount / 100000).toFixed(0)}L`}
              subtitle={`${payroll.processed} processed`}
              change={7.6}
              changeLabel="vs last month"
              trend="up"
              icon={<DollarSign className="h-6 w-6 text-danger-500" />}
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Employee Growth Trend */}
            <Card className="lg:col-span-2" title="Workforce Trends" subtitle="Employee count over time">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="employees"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="hires"
                      stroke="#22c55e"
                      fill="#22c55e"
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="departures"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Department Distribution */}
            <Card title="By Department" subtitle="Employee distribution">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departmentDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {departmentDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Performance Distribution */}
            <Card title="Performance Ratings" subtitle="Current review cycle distribution">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                    <YAxis type="category" dataKey="rating" stroke="#9ca3af" fontSize={12} width={120} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Training Progress */}
            <Card title="Training Progress" subtitle="Enrollment vs completion">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trainingCompletion}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="enrolled" fill="#3b82f6" name="Enrolled" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" fill="#22c55e" name="Completed" radius={[4, 4, 0, 0]} />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Module Summary */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <Card className="text-center">
              <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-success-50 mb-3">
                <Clock className="h-6 w-6 text-success-500" />
              </div>
              <p className="text-2xl font-semibold text-gray-900">{attendance.rate}%</p>
              <p className="text-sm text-gray-500">Attendance Rate</p>
            </Card>
            <Card className="text-center">
              <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-primary-50 mb-3">
                <FileText className="h-6 w-6 text-primary-500" />
              </div>
              <p className="text-2xl font-semibold text-gray-900">{leave.pending}</p>
              <p className="text-sm text-gray-500">Pending Leaves</p>
            </Card>
            <Card className="text-center">
              <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-warning-50 mb-3">
                <Award className="h-6 w-6 text-warning-500" />
              </div>
              <p className="text-2xl font-semibold text-gray-900">{performance.averageRating}</p>
              <p className="text-sm text-gray-500">Avg. Rating</p>
            </Card>
            <Card className="text-center">
              <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-primary-50 mb-3">
                <GraduationCap className="h-6 w-6 text-primary-500" />
              </div>
              <p className="text-2xl font-semibold text-gray-900">{training.completionRate}%</p>
              <p className="text-sm text-gray-500">Training Rate</p>
            </Card>
            <Card className="text-center">
              <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-danger-50 mb-3">
                <Target className="h-6 w-6 text-danger-500" />
              </div>
              <p className="text-2xl font-semibold text-gray-900">{performance.goalsAtRisk}</p>
              <p className="text-sm text-gray-500">Goals at Risk</p>
            </Card>
          </div>
        </>
      )}

      {/* Workforce Tab */}
      {activeTab === 'workforce' && (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card title="Headcount by Department" subtitle="Current distribution">
              <div className="space-y-4">
                {departmentDistribution
                  .sort((a, b) => b.value - a.value)
                  .map((dept, index) => (
                    <div key={dept.name} className="flex items-center gap-4">
                      <div className="w-24 text-sm font-medium text-gray-700">{dept.name}</div>
                      <div className="flex-1">
                        <div className="h-6 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(dept.value / Math.max(...departmentDistribution.map((d) => d.value))) * 100}%`,
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                      <div className="w-12 text-right text-sm font-medium text-gray-900">{dept.value}</div>
                    </div>
                  ))}
              </div>
            </Card>

            <Card title="Workforce Composition" subtitle="By employment type">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Full Time', value: 120 },
                        { name: 'Part Time', value: 8 },
                        { name: 'Contract', value: 4 },
                        { name: 'Intern', value: 2 },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card title="Monthly Hires & Departures" subtitle="Hiring trends">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="hires" fill="#22c55e" name="New Hires" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="departures" fill="#ef4444" name="Departures" radius={[4, 4, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <StatCard
              title="Goals Completed"
              value={performance.goalsCompleted}
              subtitle="This quarter"
              change={15.2}
              trend="up"
              icon={<Target className="h-6 w-6 text-success-500" />}
            />
            <StatCard
              title="Goals at Risk"
              value={performance.goalsAtRisk}
              subtitle="Need attention"
              change={-8.5}
              trend="down"
              icon={<TrendingDown className="h-6 w-6 text-warning-500" />}
            />
            <StatCard
              title="Reviews Submitted"
              value={`${performance.submitted}/${performance.submitted + performance.pending}`}
              subtitle="Completion rate"
              change={12.3}
              trend="up"
              icon={<Award className="h-6 w-6 text-primary-500" />}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card title="Performance Distribution" subtitle="By rating">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={performanceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="count"
                      label={({ rating, percentage }) => `${rating}: ${percentage}%`}
                      labelLine={false}
                    >
                      {performanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Average Rating Trend" subtitle="Monthly average">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} domain={[3, 4.5]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey={3.8}
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      name="Avg Rating"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Financial Tab */}
      {activeTab === 'financial' && (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <StatCard
              title="Monthly Payroll"
              value={`₹${(payroll.totalAmount / 100000).toFixed(0)}L`}
              subtitle="May 2026"
              change={7.6}
              trend="up"
              icon={<DollarSign className="h-6 w-6 text-primary-500" />}
            />
            <StatCard
              title="Avg. Salary"
              value={`₹${(payroll.averageSalary / 1000).toFixed(0)}K`}
              subtitle="Per employee"
              change={4.2}
              trend="up"
              icon={<TrendingUp className="h-6 w-6 text-success-500" />}
            />
            <StatCard
              title="Payroll Status"
              value={`${payroll.processed}/${payroll.processed + payroll.pending}`}
              subtitle="Processed this month"
              icon={<FileText className="h-6 w-6 text-warning-500" />}
            />
          </div>

          <Card title="Payroll Trend" subtitle="Monthly payroll amount">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={payrollTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={12}
                    tickFormatter={(value) => `₹${value / 100000}L`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`₹${(value / 100000).toFixed(1)}L`, 'Amount']}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
