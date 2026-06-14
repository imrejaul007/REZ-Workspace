'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Users,
  Briefcase,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Package,
  UserCheck,
  Eye,
  Star,
  ChefHat
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { EmailVerificationAlert } from '@/components/auth/email-verification-alert';
import { formatCurrency, formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';

interface DashboardStats {
  employeeCount: string;
  openJobCount: string;
  monthlyRevenue: string;
  orderCount: string;
  reservationCount: string;
}

interface ApplicationEntry {
  id: string;
  name: string;
  position: string;
  experience: string;
  appliedAt: string;
  status: string;
  skills: string[];
}

const quickActions = [
  {
    title: 'Manage Jobs',
    description: 'View and manage job listings',
    icon: Briefcase,
    color: 'bg-blue-500',
    href: '/restaurant/jobs',
  },
  {
    title: 'Manage Employees',
    description: 'View and manage team members',
    icon: UserCheck,
    color: 'bg-green-500',
    href: '/restaurant/employees',
  },
  {
    title: 'Browse Marketplace',
    description: 'Find suppliers & products',
    icon: Package,
    color: 'bg-purple-500',
    href: '/restaurant/marketplace',
  },
  {
    title: 'Manage Menu',
    description: 'Update restaurant menu',
    icon: ChefHat,
    color: 'bg-orange-500',
    href: '/restaurant/menu',
  },
];

export default function RestaurantDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats>({
    employeeCount: '—',
    openJobCount: '—',
    monthlyRevenue: '—',
    orderCount: '—',
    reservationCount: '—',
  });
  const [applications, setApplications] = useState<ApplicationEntry[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [applicationsEmpty, setApplicationsEmpty] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      const [jobsResult, ordersResult, staffResult, reservationsResult] =
        await Promise.allSettled([
          apiClient.getPaginated('/jobs/my-jobs', { page: 1, limit: 1 }),
          apiClient.getPaginated('/orders', { page: 1, limit: 100 }),
          apiClient.getPaginated('/staff/employees', { page: 1, limit: 1 }),
          apiClient.getPaginated('/reservations', { page: 1, limit: 1 }),
        ]);

      const nextStats: DashboardStats = {
        employeeCount: '—',
        openJobCount: '—',
        monthlyRevenue: '—',
        orderCount: '—',
        reservationCount: '—',
      };

      if (jobsResult.status === 'fulfilled') {
        const val = jobsResult.value as { total?: number; data?: { total?: number } };
        const count = val?.total ?? val?.data?.total ?? null;
        if (count !== null) nextStats.openJobCount = String(count);
      }

      if (ordersResult.status === 'fulfilled') {
        const val = ordersResult.value as { data?: unknown[]; total?: number };
        const items = (val?.data ?? []) as { total?: number; amount?: number }[];
        const total = val?.total ?? null;
        nextStats.orderCount = total !== null ? String(total) : String(items.length);
        const revenue = items.reduce(
          (sum: number, o) => sum + (o?.total ?? o?.amount ?? 0),
          0
        );
        nextStats.monthlyRevenue = formatCurrency(revenue);
      }

      if (staffResult.status === 'fulfilled') {
        const val = staffResult.value as { total?: number; data?: { total?: number } };
        const count = val?.total ?? val?.data?.total ?? null;
        if (count !== null) nextStats.employeeCount = String(count);
      }

      if (reservationsResult.status === 'fulfilled') {
        const val = reservationsResult.value as { total?: number; data?: { total?: number } };
        const count = val?.total ?? val?.data?.total ?? null;
        if (count !== null) nextStats.reservationCount = String(count);
      }

      setStats(nextStats);
    };

    const fetchApplications = async () => {
      setApplicationsLoading(true);
      try {
        const res = await apiClient.getPaginated('/jobs/applications', { limit: 5 });
        const items = (res as { data?: unknown[] })?.data ?? [];
        if (items.length === 0) {
          setApplicationsEmpty(true);
        } else {
          const mapped: ApplicationEntry[] = items.map((app) => ({
            id: app.id ?? '',
            name: app.applicant
              ? `${app.applicant.firstName ?? ''} ${app.applicant.lastName ?? ''}`.trim()
              : app.name ?? 'Unknown',
            position: app.job?.title ?? app.position ?? 'Unknown Position',
            experience: app.applicant?.experience ?? app.experience ?? '',
            appliedAt: app.appliedAt ?? app.createdAt ?? '',
            status: (app.status ?? 'pending').toLowerCase(),
            skills: app.applicant?.skills ?? app.skills ?? [],
          }));
          setApplications(mapped);
        }
      } catch {
        setApplicationsEmpty(true);
      } finally {
        setApplicationsLoading(false);
      }
    };

    fetchStats();
    fetchApplications();
  }, []);

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.employeeCount,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      description: 'Active staff members',
    },
    {
      title: 'Active Job Posts',
      value: stats.openJobCount,
      icon: Briefcase,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
      description: 'Open positions',
    },
    {
      title: 'Monthly Revenue',
      value: stats.monthlyRevenue,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      description: `${stats.orderCount} orders this month`,
    },
    {
      title: 'Upcoming Reservations',
      value: stats.reservationCount,
      icon: Calendar,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
      description: 'Scheduled reservations',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'shortlisted':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Restaurant Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's what's happening at your restaurant.
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Last 30 days
            </Button>
            <Button>
              <TrendingUp className="h-4 w-4 mr-2" />
              View Reports
            </Button>
          </div>
        </div>

        {/* Email Verification Alert */}
        <EmailVerificationAlert />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                          {stat.value}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {stat.description}
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Applications */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold">
                    Recent Applications
                  </CardTitle>
                  <Button variant="ghost">
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {applicationsLoading ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
                  ) : applicationsEmpty || applications.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No recent applications
                    </p>
                  ) : (
                    applications.map((application) => (
                      <div
                        key={application.id}
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <ChefHat className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{application.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {application.position}
                              {application.experience ? ` • ${application.experience}` : ''}
                            </p>
                            {application.skills.length > 0 && (
                              <div className="flex items-center space-x-1 mt-1">
                                {application.skills.slice(0, 2).map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded"
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {application.skills.length > 2 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{application.skills.length - 2} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(application.status)}`}>
                            {application.status}
                          </div>
                          {application.appliedAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(application.appliedAt, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks for your restaurant
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start h-auto p-4 hover:bg-muted/50"
                      onClick={() => router.push(action.href)}
                    >
                      <div className={`p-2 rounded-lg ${action.color} mr-4`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm">{action.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
