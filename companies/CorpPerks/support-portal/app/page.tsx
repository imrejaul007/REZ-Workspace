'use client';

import Link from 'next/link';
import {
  Ticket,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  MessageSquare,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { Card, StatCard, Badge, StatusBadge, PriorityBadge, Avatar, Button } from '@/components/ui';
import { tickets, supportStats, chatSessions } from '@/lib/mock-data';
import { formatRelativeTime, getSlaStatus, getSlaTimeRemaining, cn } from '@/lib/utils';

export default function DashboardPage() {
  const urgentTickets = tickets.filter(
    (t) => t.priority === 'urgent' && t.status !== 'resolved' && t.status !== 'closed'
  );
  const activeChats = chatSessions.filter((s) => s.status === 'active');
  const recentTickets = [...tickets]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back, Sarah. Here is your support overview.
          </p>
        </div>
        <Link href="/tickets">
          <Button>
            <Ticket className="w-4 h-4 mr-2" />
            View All Tickets
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Open Tickets"
          value={supportStats.openTickets}
          change="+3 from yesterday"
          changeType="increase"
          icon={<Ticket className="w-6 h-6 text-blue-600" />}
        />
        <StatCard
          label="In Progress"
          value={supportStats.inProgressTickets}
          change="Steady"
          changeType="neutral"
          icon={<Clock className="w-6 h-6 text-amber-600" />}
        />
        <StatCard
          label="Resolved Today"
          value={supportStats.resolvedToday}
          change="+5 from yesterday"
          changeType="increase"
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
        />
        <StatCard
          label="SLA Compliance"
          value={`${supportStats.slaCompliance}%`}
          change="Above target"
          changeType="increase"
          icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Tickets */}
        <Card className="lg:col-span-2" padding="none">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Urgent Tickets</h2>
                  <p className="text-sm text-gray-500">{urgentTickets.length} tickets need immediate attention</p>
                </div>
              </div>
              <Link href="/tickets?priority=urgent">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {urgentTickets.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-500">No urgent tickets. Great job!</p>
              </div>
            ) : (
              urgentTickets.slice(0, 4).map((ticket) => {
                const slaStatus = getSlaStatus(ticket.slaDeadline);
                return (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">{ticket.id}</span>
                        <StatusBadge status={ticket.status} />
                        <PriorityBadge priority={ticket.priority} />
                      </div>
                      <p className="mt-1 font-medium text-gray-900 truncate">{ticket.title}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        {ticket.employee.name} - {formatRelativeTime(ticket.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          slaStatus === 'breached'
                            ? 'danger'
                            : slaStatus === 'at_risk'
                            ? 'warning'
                            : 'info'
                        }
                      >
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {getSlaTimeRemaining(ticket.slaDeadline)}
                      </Badge>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </Card>

        {/* Active Chats */}
        <Card padding="none">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Active Chats</h2>
                <p className="text-sm text-gray-500">{activeChats.length} conversations</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {activeChats.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No active chats</p>
              </div>
            ) : (
              activeChats.map((chat) => (
                <Link
                  key={chat.id}
                  href="/chat"
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                >
                  <Avatar name={chat.employee.name} status={chat.employee.chatStatus} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{chat.employee.name}</p>
                    <p className="text-sm text-gray-500 truncate">{chat.employee.department}</p>
                  </div>
                  {chat.isTyping ? (
                    <Badge variant="warning">Typing...</Badge>
                  ) : (
                    <Badge variant="success">Active</Badge>
                  )}
                </Link>
              ))
            )}
          </div>
          <div className="p-4 border-t border-gray-100">
            <Link href="/chat">
              <Button variant="outline" className="w-full">
                Open Chat Panel
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Avg Resolution Time</span>
              <span className="font-semibold text-gray-900">{supportStats.avgResolutionTime}h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Avg CSAT Score</span>
              <span className="font-semibold text-gray-900">{supportStats.avgCsat}/5</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Tickets (Month)</span>
              <span className="font-semibold text-gray-900">{supportStats.totalTickets}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Pending Response</span>
              <span className="font-semibold text-gray-900">
                {tickets.filter((t) => t.status === 'pending').length}
              </span>
            </div>
          </div>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tickets by Category</h3>
          <div className="space-y-3">
            {[
              { name: 'HR Policy', count: 42, color: 'bg-blue-500' },
              { name: 'Payroll', count: 38, color: 'bg-green-500' },
              { name: 'Benefits', count: 29, color: 'bg-purple-500' },
              { name: 'Leave', count: 25, color: 'bg-amber-500' },
              { name: 'Onboarding', count: 12, color: 'bg-pink-500' },
            ].map((cat) => (
              <div key={cat.name} className="flex items-center gap-3">
                <div className={cn('w-2 h-2 rounded-full', cat.color)} />
                <span className="flex-1 text-sm text-gray-600">{cat.name}</span>
                <span className="text-sm font-medium text-gray-900">{cat.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="flex items-start gap-3 group"
              >
                <div
                  className={cn(
                    'w-2 h-2 rounded-full mt-2',
                    ticket.status === 'resolved' ? 'bg-green-500' : 'bg-blue-500'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {ticket.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatRelativeTime(ticket.updatedAt)}
                  </p>
                </div>
                <StatusBadge status={ticket.status} />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
