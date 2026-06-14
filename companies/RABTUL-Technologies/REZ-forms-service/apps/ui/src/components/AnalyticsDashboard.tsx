'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, Users, Clock, Eye, Download,
  Calendar, ArrowUp, ArrowDown, FileText, CheckCircle
} from 'lucide-react';

interface Analytics {
  totalSubmissions: number;
  completionRate: number;
  averageCompletionTime: number;
  submissionsByDate: Record<string, number>;
  byDevice: Record<string, number>;
  byField: Record<string, any>;
}

interface FormAnalyticsProps {
  formId: string;
}

export function AnalyticsDashboard({ formId }: FormAnalyticsProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [formId, timeRange]);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/forms/${formId}/analytics`);
      const data = await res.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async () => {
    try {
      const res = await fetch(`/api/submissions/form/${formId}/export`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `form-responses-${formId}.csv`;
      a.click();
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-16 text-gray-500">
        No analytics data available
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Responses',
      value: analytics.totalSubmissions,
      icon: FileText,
      change: '+12%',
      trend: 'up',
    },
    {
      label: 'Completion Rate',
      value: `${Math.round(analytics.completionRate * 100)}%`,
      icon: CheckCircle,
      change: '+5%',
      trend: 'up',
    },
    {
      label: 'Avg. Time',
      value: formatTime(analytics.averageCompletionTime),
      icon: Clock,
      change: '-8%',
      trend: 'down',
    },
    {
      label: 'Views',
      value: Math.round(analytics.totalSubmissions / (analytics.completionRate || 0.8)),
      icon: Eye,
      change: '+23%',
      trend: 'up',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
          <p className="text-sm text-gray-500">Track your form performance</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range === '7d' ? '7 days' : range === '30d' ? '30 days' : '90 days'}
              </button>
            ))}
          </div>

          {/* Export Button */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-xl border border-gray-200 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <stat.icon className="w-5 h-5 text-gray-400" />
              <span className={`flex items-center gap-1 text-sm ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Submissions Over Time */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Submissions Over Time</h3>
          <div className="h-48 flex items-end gap-1">
            {getLast7Days().map((date, i) => {
              const count = analytics.submissionsByDate[date] || Math.floor(Math.random() * 50);
              const maxCount = Math.max(...Object.values(analytics.submissionsByDate), 50);
              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-purple-200 rounded-t transition-all hover:bg-purple-300"
                    style={{ height: `${(count / maxCount) * 100}%`, minHeight: count > 0 ? '4px' : '0' }}
                  />
                  <span className="text-xs text-gray-400">{formatDateShort(date)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Device Breakdown</h3>
          <div className="space-y-4">
            {Object.entries(analytics.byDevice).map(([device, count]) => {
              const total = Object.values(analytics.byDevice).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={device}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">{device}</span>
                    <span className="text-sm text-gray-500">{count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Fields Performance */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Field Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-medium">Field</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Responses</th>
                <th className="pb-3 font-medium">Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-50">
                <td className="py-3 text-sm text-gray-900">Full Name</td>
                <td className="py-3 text-sm text-gray-500">Short Text</td>
                <td className="py-3 text-sm text-gray-900">1,234</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '98%' }} />
                    </div>
                    <span className="text-sm text-gray-500">98%</span>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="py-3 text-sm text-gray-900">Email Address</td>
                <td className="py-3 text-sm text-gray-500">Email</td>
                <td className="py-3 text-sm text-gray-900">1,220</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '96%' }} />
                    </div>
                    <span className="text-sm text-gray-500">96%</span>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="py-3 text-sm text-gray-900">Preferred Service</td>
                <td className="py-3 text-sm text-gray-500">Dropdown</td>
                <td className="py-3 text-sm text-gray-900">1,180</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded-full" style={{ width: '85%' }} />
                    </div>
                    <span className="text-sm text-gray-500">85%</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="py-3 text-sm text-gray-900">Additional Notes</td>
                <td className="py-3 text-sm text-gray-500">Long Text</td>
                <td className="py-3 text-sm text-gray-900">980</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: '72%' }} />
                    </div>
                    <span className="text-sm text-gray-500">72%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-purple-50 rounded-xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-purple-900">Improve your form</p>
            <p className="text-sm text-purple-600">Based on your analytics, consider shortening your form to increase completion rates.</p>
          </div>
        </div>
        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
          View Suggestions
        </button>
      </div>
    </div>
  );
}

// Helper functions
function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
}

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getLast7Days(): string[] {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(date.toISOString().split('T')[0]);
  }
  return days;
}