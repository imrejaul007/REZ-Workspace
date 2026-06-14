'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  FileText,
  Clock,
  Award,
  TrendingUp,
  Eye,
  Send,
  Star,
  MapPin,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  User,
  BookOpen,
  Target,
  MessageSquare,
  Bell,
  Trophy
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { EmailVerificationAlert } from '@/components/auth/email-verification-alert';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api';

interface JobApplication {
  id: string;
  jobTitle: string;
  company: string;
  appliedAt: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'interview' | 'rejected' | 'offered';
  location: string;
  salary?: {
    min: number;
    max: number;
  };
  type: 'full-time' | 'part-time' | 'contract';
  logo?: string;
}

interface JobRecommendation {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: {
    min: number;
    max: number;
  };
  type: 'full-time' | 'part-time' | 'contract';
  matchPercentage: number;
  postedAt: string;
  skills: string[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  type: 'skill' | 'certification' | 'milestone';
  earnedAt: string;
  icon;
}


export default function EmployeeDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const router = useRouter();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs/my-applications?limit=4`, {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const raw: unknown[] = json.data ?? json ?? [];
        const normalized: JobApplication[] = raw.map((app) => ({
          id: app.id,
          jobTitle: app.job?.title ?? 'Unknown Position',
          company: app.job?.restaurant?.name ?? app.job?.company ?? 'Unknown',
          appliedAt: app.appliedAt ?? app.createdAt ?? new Date().toISOString(),
          status: (app.status ?? 'pending').toLowerCase() as JobApplication['status'],
          location: app.job?.location ?? '',
          salary: app.job?.salaryMin && app.job?.salaryMax
            ? { min: app.job.salaryMin, max: app.job.salaryMax }
            : undefined,
          type: (app.job?.employmentType ?? 'full-time').toLowerCase().replace('_', '-') as JobApplication['type'],
        }));
        setApplications(normalized);
      } catch {
        // Silently degrade — show empty state rather than error in dashboard
        setApplications([]);
      } finally {
        setAppsLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const appCount = applications.length;
  const interviewCount = applications.filter(a => a.status === 'interview').length;
  
  const quickActions = [
    { icon: User, label: 'Update Profile', href: '/employee/profile', color: 'bg-blue-500' },
    { icon: Briefcase, label: 'Find Jobs', href: '/employee/jobs', color: 'bg-green-500' },
    { icon: FileText, label: 'My Applications', href: '/employee/applications', color: 'bg-purple-500' },
    { icon: BookOpen, label: 'Learning Hub', href: '/employee/learning', color: 'bg-orange-500' },
  ];

  const getApplicationStatusColor = (status: JobApplication['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'shortlisted':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'interview':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'offered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getApplicationStatusIcon = (status: JobApplication['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'reviewed':
        return <Eye className="h-4 w-4 text-blue-600" />;
      case 'shortlisted':
        return <CheckCircle className="h-4 w-4 text-purple-600" />;
      case 'interview':
        return <MessageSquare className="h-4 w-4 text-orange-600" />;
      case 'offered':
        return <Award className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Track your job search progress and discover new opportunities
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Button variant="outline" >
              <BookOpen className="h-4 w-4 mr-2" />
              Learning Hub
            </Button>
            <Button >
              <Briefcase className="h-4 w-4 mr-2" />
              Browse Jobs
            </Button>
          </div>
        </div>

        {/* Email Verification Alert */}
        <EmailVerificationAlert />

        {/* Stats Grid — sourced from real applications data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Applications Sent', value: appsLoading ? '...' : String(appCount), icon: Send, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900', description: 'Total' },
            { title: 'Interview Calls', value: appsLoading ? '...' : String(interviewCount), icon: MessageSquare, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900', description: 'Scheduled' },
          ].map((stat, index) => {
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
                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                        <p className="text-sm text-muted-foreground mt-2">{stat.description}</p>
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
                  <Button variant="ghost" >
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {appsLoading && (
                    <div className="space-y-3">
                      {[1, 2, 3].map(n => (
                        <div key={n} className="h-16 rounded-lg bg-muted animate-pulse" />
                      ))}
                    </div>
                  )}
                  {!appsLoading && applications.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <Briefcase className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">No applications yet. Start applying to jobs!</p>
                    </div>
                  )}
                  {!appsLoading && applications.slice(0, 4).map((application) => (
                    <div
                      key={application.id}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Briefcase className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{application.jobTitle}</h4>
                          <p className="text-xs text-muted-foreground">
                            {application.company} • {application.location}
                          </p>
                          {application.salary && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatCurrency(application.salary.min)} - {formatCurrency(application.salary.max)} / month
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-1">
                          {getApplicationStatusIcon(application.status)}
                          <div className={`text-xs px-2 py-1 rounded-full ${getApplicationStatusColor(application.status)}`}>
                            {application.status}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(application.appliedAt, { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
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
                  Enhance your job search
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
                        <p className="font-medium text-sm">{action.label}</p>
                        <p className="text-xs text-muted-foreground">
                          Navigate to {action.label.toLowerCase()}
                        </p>
                      </div>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Job Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">
                Browse Open Jobs
              </CardTitle>
              <Button variant="ghost" onClick={() => router.push('/employee/jobs')}>
                <TrendingUp className="h-4 w-4 mr-2" />
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-muted-foreground">
                <Briefcase className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Job recommendations will appear here as the feature is built.</p>
                <Button className="mt-4" onClick={() => router.push('/employee/jobs')}>
                  Browse Jobs
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg font-semibold">Achievements</CardTitle>
                <CardDescription>
                  Your progress milestones and certifications
                </CardDescription>
              </div>
              <Button variant="outline" disabled className="opacity-50 cursor-not-allowed">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-muted-foreground">
                <Trophy className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Complete tasks and milestones to earn badges</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}