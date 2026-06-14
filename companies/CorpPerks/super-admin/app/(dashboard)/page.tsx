'use client';

import React, { useEffect, useState } from 'react';
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  Activity,
  HardDrive,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import DashboardWrapper from '@/components/layout/DashboardWrapper';
import StatsCard from '@/components/ui/StatsCard';
import { StatusBadge, PlanBadge } from '@/components/ui/Badge';
import { getDashboardStats, getUsageTrends, getTenants } from '@/lib/api';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';
import type { DashboardStats, UsageTrend, Tenant } from '@/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<UsageTrend[]>([]);
  const [recentTenants, setRecentTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, trendsData, tenantsData] = await Promise.all([
          getDashboardStats(),
          getUsageTrends(),
          getTenants({ limit: 5 }),
        ]);
        setStats(statsData);
        setTrends(trendsData);
        setRecentTenants(tenantsData.data);
      } catch (error) {
        logger.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading || !stats) {
    return (
      <>
        <Header title="Dashboard" subtitle="Platform Overview" />
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="h-8 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardWrapper title="Dashboard" subtitle="Platform Overview">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Tenants"
            value={stats.tenants.total}
            change={12.5}
            changeLabel="vs last month"
            icon={<Building2 className="w-6 h-6" />}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatsCard
            title="Total Users"
            value={formatNumber(stats.analytics.totalUsers)}
            change={8.2}
            changeLabel="vs last month"
            icon={<Users className="w-6 h-6" />}
            iconBg="bg-green-100"
            iconColor="text-green-600"
          />
          <StatsCard
            title="Monthly Revenue"
            value={formatCurrency(stats.billing.mrr)}
            change={15.3}
            changeLabel="vs last month"
            icon={<CreditCard className="w-6 h-6" />}
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
          />
          <StatsCard
            title="API Calls (This Month)"
            value={formatNumber(stats.analytics.apiCalls)}
            change={22.1}
            changeLabel="vs last month"
            icon={<Activity className="w-6 h-6" />}
            iconBg="bg-orange-100"
            iconColor="text-orange-600"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Revenue Trend
                </h3>
                <p className="text-sm text-gray-500">Monthly revenue over time</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.billing.arr)}
                </span>
                <span className="text-sm text-gray-500">ARR</span>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.billing.revenueByMonth}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Usage Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Usage Trends
                </h3>
                <p className="text-sm text-gray-500">Users and API calls (7 days)</p>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Bar yAxisId="left" dataKey="users" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="apiCalls" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tenant Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Tenant Status
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-600">Active</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {stats.tenants.active}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span className="text-sm text-gray-600">Inactive</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {stats.tenants.inactive}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-sm text-gray-600">Pending</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {stats.tenants.pending}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm text-gray-600">Suspended</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {stats.tenants.suspended}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">New this month</span>
                <span className="font-semibold text-green-600">
                  +{stats.tenants.newThisMonth}
                </span>
              </div>
            </div>
          </div>

          {/* Revenue by Plan */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Revenue by Plan
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Enterprise</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(stats.billing.revenueByPlan.enterprise)}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{
                      width: `${(stats.billing.revenueByPlan.enterprise / stats.billing.totalRevenue) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Professional</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(stats.billing.revenueByPlan.professional)}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      width: `${(stats.billing.revenueByPlan.professional / stats.billing.totalRevenue) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Starter</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(stats.billing.revenueByPlan.starter)}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-400 rounded-full"
                    style={{
                      width: `${(stats.billing.revenueByPlan.starter / stats.billing.totalRevenue) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Tenants */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Tenants</h3>
              <a
                href="/tenants"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View all
              </a>
            </div>
            <div className="space-y-4">
              {recentTenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={tenant.logo}
                      alt={tenant.name}
                      className="w-10 h-10 rounded-lg"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {tenant.name}
                      </p>
                      <p className="text-xs text-gray-500">{tenant.industry}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={tenant.status} />
                    <p className="text-xs text-gray-500 mt-1">
                      {formatNumber(tenant.userCount)} users
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Growth Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  +{stats.analytics.growthRate}%
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <ArrowDownRight className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Churn Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.analytics.churnRate}%
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <HardDrive className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Storage Used</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(stats.analytics.storageUsed / (1024 * 1024 * 1024))} GB
                </p>
              </div>
            </div>
          </div>
        </div>
      </DashboardWrapper>
    </>
  );
}

function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
    </header>
  );
}
