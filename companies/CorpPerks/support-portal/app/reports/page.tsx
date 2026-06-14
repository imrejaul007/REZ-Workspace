'use client';

import { useState } from 'react';
import {
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  Ticket,
  Users,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';
import { Card, Badge, Button, StatCard, Avatar, Select } from '@/components/ui';
import { reportData, supportStats, supportAgents } from '@/lib/mock-data';
import { cn, categoryConfig } from '@/lib/utils';
import { TicketStatus, TicketPriority, TicketCategory } from '@/types';

type DateRange = '7d' | '30d' | '90d' | 'custom';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');

  const maxVolume = Math.max(...reportData.volumeTrend.map((v) => v.count));
  const maxResolutionTime = Math.max(...reportData.resolutionTimeTrend.map((v) => v.avgTime));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Reports</h1>
          <p className="text-gray-500 mt-1">
            Analytics and insights for support performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            options={[
              { value: '7d', label: 'Last 7 days' },
              { value: '30d', label: 'Last 30 days' },
              { value: '90d', label: 'Last 90 days' },
              { value: 'custom', label: 'Custom range' },
            ]}
            className="w-40"
          />
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Tickets"
          value={supportStats.totalTickets}
          change="+12% from last period"
          changeType="increase"
          icon={<Ticket className="w-6 h-6 text-blue-600" />}
        />
        <StatCard
          label="Avg Resolution Time"
          value={`${supportStats.avgResolutionTime}h`}
          change="-8% faster"
          changeType="increase"
          icon={<Clock className="w-6 h-6 text-green-600" />}
        />
        <StatCard
          label="SLA Compliance"
          value={`${supportStats.slaCompliance}%`}
          change="Above 90% target"
          changeType="increase"
          icon={<CheckCircle className="w-6 h-6 text-purple-600" />}
        />
        <StatCard
          label="Avg CSAT Score"
          value={`${supportStats.avgCsat}/5`}
          change="+0.2 from last period"
          changeType="increase"
          icon={<TrendingUp className="w-6 h-6 text-amber-600" />}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Volume Trend */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ticket Volume Trend</h3>
              <p className="text-sm text-gray-500">Number of tickets created over time</p>
            </div>
            <Badge variant="success" className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +8%
            </Badge>
          </div>
          <div className="h-64 flex items-end gap-2">
            {reportData.volumeTrend.map((item, i) => (
              <div key={item.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center">
                  <span className="text-xs text-gray-500 mb-1">{item.count}</span>
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all hover:from-blue-700 hover:to-blue-500"
                    style={{ height: `${(item.count / maxVolume) * 180}px` }}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Resolution Time Trend */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Avg Resolution Time</h3>
              <p className="text-sm text-gray-500">Average time to resolve tickets</p>
            </div>
            <Badge variant="success" className="flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              -12%
            </Badge>
          </div>
          <div className="h-64 flex items-end gap-2">
            {reportData.resolutionTimeTrend.map((item, i) => (
              <div key={item.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center">
                  <span className="text-xs text-gray-500 mb-1">{item.avgTime}h</span>
                  <div
                    className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all hover:from-green-700 hover:to-green-500"
                    style={{ height: `${(item.avgTime / maxResolutionTime) * 180}px` }}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets by Status */}
        <Card>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Tickets by Status</h3>
            <p className="text-sm text-gray-500">Current distribution</p>
          </div>
          <div className="flex flex-col gap-4">
            {Object.entries(reportData.ticketsByStatus).map(([status, count]) => {
              const percentage = Math.round((count / supportStats.totalTickets) * 100);
              const colors: Record<TicketStatus, string> = {
                open: 'bg-blue-500',
                in_progress: 'bg-amber-500',
                pending: 'bg-purple-500',
                resolved: 'bg-green-500',
                closed: 'bg-gray-500',
              };
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {status.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-500">{count} ({percentage}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', colors[status as TicketStatus])}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Tickets by Priority */}
        <Card>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Tickets by Priority</h3>
            <p className="text-sm text-gray-500">Priority distribution</p>
          </div>
          <div className="flex flex-col gap-4">
            {Object.entries(reportData.ticketsByPriority).map(([priority, count]) => {
              const percentage = Math.round((count / supportStats.totalTickets) * 100);
              const colors: Record<TicketPriority, string> = {
                low: 'bg-gray-400',
                medium: 'bg-blue-500',
                high: 'bg-orange-500',
                urgent: 'bg-red-500',
              };
              return (
                <div key={priority}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">{priority}</span>
                    <span className="text-sm text-gray-500">{count} ({percentage}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', colors[priority as TicketPriority])}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Tickets by Category */}
        <Card>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Tickets by Category</h3>
            <p className="text-sm text-gray-500">Category distribution</p>
          </div>
          <div className="space-y-3">
            {reportData.categoryBreakdown.slice(0, 5).map((item, i) => {
              const config = categoryConfig[item.category];
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500'];
              return (
                <div key={item.category} className="flex items-center gap-3">
                  <div className={cn('w-3 h-3 rounded-full', colors[i])} />
                  <span className="flex-1 text-sm text-gray-700">{config.label}</span>
                  <span className="text-sm font-medium text-gray-900">{item.count}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Agent Performance */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Agent Performance</h3>
            <p className="text-sm text-gray-500">Individual agent metrics</p>
          </div>
          <Select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            options={[
              { value: 'all', label: 'All Agents' },
              ...supportAgents.map((agent) => ({
                value: agent.id,
                label: agent.name,
              })),
            ]}
            className="w-48"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Agent</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Tickets Resolved</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Avg Response Time</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Avg Resolution Time</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Performance</th>
              </tr>
            </thead>
            <tbody>
              {reportData.agentPerformance.map((data, i) => (
                <tr key={data.agent.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={data.agent.name} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900">{data.agent.name}</p>
                        <p className="text-sm text-gray-500">{data.agent.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">{data.ticketsResolved}</span>
                      <Badge variant="success" size="sm">
                        +{Math.floor(Math.random() * 10 + 5)}%
                      </Badge>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{data.avgResponseTime}m</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{data.avgResolutionTime}h</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                          style={{ width: `${85 + Math.random() * 15}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {85 + Math.floor(Math.random() * 15)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* SLA Compliance */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">SLA Compliance</h3>
            <p className="text-sm text-gray-500">Percentage of tickets resolved within SLA</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-green-50 rounded-xl">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
              <span className="text-3xl font-bold text-green-700">{supportStats.slaCompliance}%</span>
            </div>
            <p className="font-medium text-gray-900">Overall Compliance</p>
            <p className="text-sm text-gray-500 mt-1">Above 90% target</p>
          </div>
          <div className="text-center p-6 bg-blue-50 rounded-xl">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-4">
              <span className="text-3xl font-bold text-blue-700">94%</span>
            </div>
            <p className="font-medium text-gray-900">Urgent Priority</p>
            <p className="text-sm text-gray-500 mt-1">4h SLA target</p>
          </div>
          <div className="text-center p-6 bg-purple-50 rounded-xl">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-100 mb-4">
              <span className="text-3xl font-bold text-purple-700">96%</span>
            </div>
            <p className="font-medium text-gray-900">High Priority</p>
            <p className="text-sm text-gray-500 mt-1">8h SLA target</p>
          </div>
        </div>
      </Card>

      {/* Category Analysis */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Category Analysis</h3>
            <p className="text-sm text-gray-500">Average resolution time by category</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Tickets</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Avg Resolution</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Distribution</th>
              </tr>
            </thead>
            <tbody>
              {reportData.categoryBreakdown.map((item) => {
                const config = categoryConfig[item.category];
                const percentage = Math.round((item.count / supportStats.totalTickets) * 100);
                return (
                  <tr key={item.category} className="border-b border-gray-100">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{config.icon}</span>
                        <span className="font-medium text-gray-900">{config.label}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-lg font-bold text-gray-900">{item.count}</span>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={item.avgTime < 4 ? 'success' : item.avgTime < 6 ? 'warning' : 'danger'}>
                        {item.avgTime}h
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-32">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${percentage * 2}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500">{percentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
