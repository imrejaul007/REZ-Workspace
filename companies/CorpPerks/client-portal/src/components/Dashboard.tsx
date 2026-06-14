'use client';

import { DashboardStats } from '@/types';
import { formatCurrency, formatRelativeTime, cn } from '@/lib/utils';
import {
  FolderKanban,
  Receipt,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  Calendar,
  ArrowRight,
  FileText,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardProps {
  stats: DashboardStats;
}

const activityIcons = {
  project_update: { icon: FolderKanban, color: 'bg-blue-100 text-blue-600' },
  invoice_paid: { icon: CreditCard, color: 'bg-green-100 text-green-600' },
  message_received: { icon: MessageSquare, color: 'bg-purple-100 text-purple-600' },
  document_uploaded: { icon: FileText, color: 'bg-amber-100 text-amber-600' },
};

export default function Dashboard({ stats }: DashboardProps) {
  const statCards = [
    {
      label: 'Active Projects',
      value: stats.activeProjects,
      icon: FolderKanban,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      href: '/projects',
    },
    {
      label: 'Pending Invoices',
      value: stats.pendingInvoices,
      icon: Receipt,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      href: '/invoices',
    },
    {
      label: 'Unread Messages',
      value: stats.unreadMessages,
      icon: MessageSquare,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      href: '/messages',
    },
    {
      label: 'Completed Projects',
      value: stats.completedProjects,
      icon: CheckCircle2,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      href: '/projects',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative">
          <h1 className="font-heading text-3xl font-bold text-white mb-2">
            Welcome back, {stats.clientName}
          </h1>
          <p className="text-primary-100 text-lg">
            Here&apos;s what&apos;s happening with your projects
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group animate-stagger"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-card transition-all duration-300 group-hover:border-primary-200">
              <div className="flex items-start justify-between mb-4">
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', stat.bgColor)}>
                  <stat.icon className={cn('w-6 h-6 text-primary-600')} />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="text-3xl font-heading font-bold text-slate-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Spent Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Spent</p>
              <p className="font-heading font-bold text-2xl text-slate-900">
                {formatCurrency(stats.totalSpent, 'INR')}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Completed Projects</span>
              <span className="font-medium text-slate-700">{stats.completedProjects}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Upcoming Milestones</span>
              <span className="font-medium text-slate-700">{stats.upcomingMilestones}</span>
            </div>
          </div>
        </div>

        {/* Upcoming Milestones */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-slate-900">Upcoming Milestones</h3>
            <Link href="/projects" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/50 border border-blue-100">
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">Development Sprint 2</p>
                <p className="text-xs text-slate-500">June 1, 2024</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100">
              <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">QA & Testing</p>
                <p className="text-xs text-slate-500">June 15, 2024</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-heading font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              href="/messages"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">Send a Message</p>
                <p className="text-xs text-slate-500">Contact your project team</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 transition-colors" />
            </Link>
            <Link
              href="/documents"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">View Documents</p>
                <p className="text-xs text-slate-500">Access project files</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 transition-colors" />
            </Link>
            <Link
              href="/invoices"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">Manage Invoices</p>
                <p className="text-xs text-slate-500">View billing history</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 transition-colors" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-heading font-semibold text-slate-900">Recent Activity</h3>
          <Link href="/dashboard" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View All
          </Link>
        </div>
        <div className="space-y-4">
          {stats.recentActivity.map((activity) => {
            const config = activityIcons[activity.type];
            const Icon = config.icon;
            return (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', config.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                  <p className="text-sm text-slate-500 truncate">{activity.description}</p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {formatRelativeTime(activity.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
