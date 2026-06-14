'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Users,
  Building2,
  Package,
  TrendingUp,
  TrendingDown,
  Calendar,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { EmailVerificationAlert } from '@/components/auth/email-verification-alert';
import { adminApi } from '@/lib/api/admin';
import type { AdminDashboard } from '@/lib/api/admin';

interface StatCard {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

export default function AdminDashboard() {
  const router = useRouter();

  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await adminApi.getDashboard();
        setDashboard(res.data);
      } catch {
        // keep dashboard null — UI will show "—"
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const fmt = (n: number | undefined | null): string =>
    n !== undefined && n !== null ? n.toLocaleString() : '—';

  const stats: StatCard[] = [
    {
      title: 'Total Users',
      value: loading ? '—' : fmt(dashboard?.users?.total),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      title: 'Active Restaurants',
      value: loading ? '—' : fmt(dashboard?.restaurants?.total),
      icon: Building2,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      title: 'Pending Verifications',
      value: loading ? '—' : fmt(dashboard?.restaurants?.pending),
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
    },
    {
      title: 'Monthly Revenue',
      value: loading
        ? '—'
        : dashboard?.orders?.revenue !== undefined && dashboard.orders.revenue !== null
        ? `₹${dashboard.orders.revenue.toLocaleString()}`
        : '—',
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
    },
  ];

  const quickActions = [
    { icon: Users, label: 'Manage Users', href: '/admin/users' },
    { icon: CheckCircle, label: 'Verifications', href: '/admin/verification' },
    { icon: AlertCircle, label: 'Security Alerts', href: '/admin/security' },
    { icon: TrendingUp, label: 'Analytics', href: '/admin/analytics' },
  ];

  const recentActivities = dashboard?.recentActivity ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Monitor platform activity and manage user verifications
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Last 30 days
            </Button>
            <Button>
              Generate Report
            </Button>
          </div>
        </div>

        {/* Email Verification Alert */}
        <EmailVerificationAlert />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                          {stat.value}
                        </p>
                      </div>
                      <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                        <Icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Verifications summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">
                  Pending Verifications
                </CardTitle>
                <Button variant="ghost" onClick={() => router.push('/admin/verification')}>
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                    <div className="p-2 bg-warning-100 dark:bg-warning-900 rounded-lg">
                      <Clock className="h-4 w-4 text-warning-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {fmt(dashboard?.restaurants?.pending)} restaurant
                        {(dashboard?.restaurants?.pending ?? 0) !== 1 ? 's' : ''} awaiting review
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Requires document verification
                      </p>
                    </div>
                    <div className="ml-auto">
                      <Button variant="outline" size="sm" onClick={() => router.push('/admin/verification')}>
                        Review
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">
                  Recent Activity
                </CardTitle>
                <Button variant="ghost">
                  <Activity className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
                ) : recentActivities.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No recent activity
                  </p>
                ) : (
                  recentActivities.map((activity) => {
                    const getActivityIcon = (priority: string) => {
                      switch (priority) {
                        case 'high':
                          return <AlertCircle className="h-4 w-4 text-warning-500" />;
                        case 'low':
                          return <CheckCircle className="h-4 w-4 text-success-500" />;
                        default:
                          return <Activity className="h-4 w-4 text-primary" />;
                      }
                    };

                    return (
                      <div
                        key={activity.id}
                        className="flex items-center space-x-3 p-3 hover:bg-muted/30 rounded-lg transition-colors"
                      >
                        <div className="flex-shrink-0">
                          {getActivityIcon(activity.priority)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.type} • {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              <CardDescription>
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-20 flex-col space-y-2"
                      onClick={() => router.push(action.href)}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm">{action.label}</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
