'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from '@/lib/toast';
import {
  Search,
  Filter,
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  Clock,
  Users,
  Building2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  MessageSquare,
  Download,
  RefreshCw,
  Trash2,
  Send,
  Phone,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/auth/auth-provider';
import { cn, formatDate, formatDistanceToNow } from '@/lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api';

interface JobApplication {
  id: string;
  job: {
    id: string;
    title: string;
    company: {
      name: string;
      logo?: string;
      location: string;
    };
    location: string;
    type: string;
    salary: string;
  };
  appliedAt: string;
  status: 'submitted' | 'reviewed' | 'shortlisted' | 'interview-scheduled' | 'offered' | 'rejected' | 'withdrawn';
  timeline: Array<{
    status: string;
    date: string;
    note?: string;
  }>;
  interview?: {
    date: string;
    time: string;
    type: 'phone' | 'video' | 'in-person';
    location?: string;
    interviewer?: string;
    notes?: string;
  };
  feedback?: string;
  nextSteps?: string;
  documents: {
    resume: string;
    coverLetter?: string;
    portfolio?: string;
  };
}

function normalizeApplication(raw): JobApplication {
  const salaryParts: string[] = [];
  if (raw.job?.salaryMin) salaryParts.push(`₹${raw.job.salaryMin.toLocaleString()}`);
  if (raw.job?.salaryMax) salaryParts.push(`₹${raw.job.salaryMax.toLocaleString()}`);
  const salary = salaryParts.length > 0 ? salaryParts.join(' - ') + '/month' : 'Not specified';

  const rawStatus = (raw.status ?? 'PENDING').toUpperCase();
  const statusMap: Record<string, JobApplication['status']> = {
    PENDING: 'submitted',
    REVIEWED: 'reviewed',
    SHORTLISTED: 'shortlisted',
    ACCEPTED: 'offered',
    REJECTED: 'rejected',
  };

  return {
    id: raw.id,
    job: {
      id: raw.job?.id ?? raw.jobId ?? '',
      title: raw.job?.title ?? 'Unknown Position',
      company: {
        name: raw.job?.restaurant?.name ?? 'Unknown',
        location: raw.job?.location ?? '',
      },
      location: raw.job?.location ?? '',
      type: (raw.job?.jobType ?? raw.job?.employmentType ?? 'Full-time').replace('_', '-'),
      salary,
    },
    appliedAt: raw.appliedAt ?? raw.createdAt ?? new Date().toISOString(),
    status: statusMap[rawStatus] ?? 'submitted',
    timeline: [{ status: 'submitted', date: raw.appliedAt ?? raw.createdAt ?? new Date().toISOString(), note: 'Application submitted' }],
    documents: { resume: raw.resume ?? '' },
  };
}

const statusColors = {
  'submitted': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'reviewed': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'shortlisted': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'interview-scheduled': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'offered': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'rejected': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'withdrawn': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
};

const statusIcons = {
  'submitted': Send,
  'reviewed': Eye,
  'shortlisted': CheckCircle,
  'interview-scheduled': Calendar,
  'offered': CheckCircle,
  'rejected': XCircle,
  'withdrawn': XCircle
};

export default function EmployeeApplications() {
  const { user } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [appsError, setAppsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchApplications = async () => {
      setAppsLoading(true);
      setAppsError(null);
      try {
        const res = await fetch(`${API_BASE}/jobs/my-applications?limit=50`, {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const raw: unknown[] = json.data ?? json ?? [];
        setApplications(raw.map(normalizeApplication));
      } catch (err: unknown) {
        setAppsError(err instanceof Error ? err.message : String(err));
      } finally {
        setAppsLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.job.company.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: applications.length,
    submitted: applications.filter(app => app.status === 'submitted').length,
    inProgress: applications.filter(app => ['reviewed', 'shortlisted', 'interview-scheduled'].includes(app.status)).length,
    offered: applications.filter(app => app.status === 'offered').length,
    rejected: applications.filter(app => app.status === 'rejected').length
  };

  const handleWithdrawApplication = (applicationId: string) => {
    setApplications(prev => prev.map(app => 
      app.id === applicationId 
        ? { 
            ...app, 
            status: 'withdrawn' as const,
            timeline: [...app.timeline, {
              status: 'withdrawn',
              date: new Date().toISOString(),
              note: 'Application withdrawn by candidate'
            }]
          }
        : app
    ));
    toast.success('Application withdrawn', 'Your application has been withdrawn.');
  };

  const handleViewJob = (jobId: string) => {
    window.open(`/jobs/${jobId}`, '_blank');
  };

  const StatusIcon = ({ status }: { status: string }) => {
    const IconComponent = statusIcons[status as keyof typeof statusIcons] || AlertTriangle;
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Applications</h1>
            <p className="text-muted-foreground mt-1">
              Track the status of your job applications
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={() => router.push('/jobs')}>
              <Plus className="h-4 w-4 mr-2" />
              Apply to More Jobs
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
                <Briefcase className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Submitted</p>
                  <p className="text-2xl font-bold text-foreground">{stats.submitted}</p>
                </div>
                <Send className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-foreground">{stats.inProgress}</p>
                </div>
                <RefreshCw className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Offers</p>
                  <p className="text-2xl font-bold text-foreground">{stats.offered}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold text-foreground">{stats.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="reviewed">Reviewed</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interview-scheduled">Interview Scheduled</option>
                <option value="offered">Offered</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        <div className="space-y-4">
          {appsLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-32 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          )}
          {appsError && (
            <div className="text-center py-8 text-destructive">
              <p>{appsError}</p>
            </div>
          )}
          {!appsLoading && !appsError && filteredApplications.map((application) => (
            <motion.div
              key={application.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {application.job.title}
                          </h3>
                          <Badge className={statusColors[application.status]}>
                            <StatusIcon status={application.status} />
                            <span className="ml-2 capitalize">{application.status.replace('-', ' ')}</span>
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                          <div className="flex items-center space-x-1">
                            <Building2 className="h-4 w-4" />
                            <span>{application.job.company.name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{application.job.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4" />
                            <span>{application.job.salary}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>Applied {formatDistanceToNow(application.appliedAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost"  onClick={() => handleViewJob(application.job.id)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View Job
                        </Button>
                        {!['offered', 'rejected', 'withdrawn'].includes(application.status) && (
                          <Button 
                            variant="ghost" 
                             
                            onClick={() => handleWithdrawApplication(application.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Withdraw
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">Application Timeline</h4>
                      <div className="space-y-2">
                        {application.timeline.map((event, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className={cn(
                              "w-2 h-2 rounded-full mt-2",
                              index === application.timeline.length - 1 ? "bg-primary" : "bg-muted-foreground"
                            )} />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-foreground capitalize">
                                  {event.status.replace('-', ' ')}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(event.date)}
                                </span>
                              </div>
                              {event.note && (
                                <p className="text-xs text-muted-foreground mt-1">{event.note}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Interview Details */}
                    {application.interview && application.status === 'interview-scheduled' && (
                      <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                        <h4 className="font-medium text-foreground mb-3 flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Interview Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="font-medium text-muted-foreground">Date & Time:</span>
                            <p className="text-foreground">
                              {formatDate(application.interview.date)} at {application.interview.time}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Type:</span>
                            <p className="text-foreground capitalize">{application.interview.type}</p>
                          </div>
                          {application.interview.location && (
                            <div className="md:col-span-2">
                              <span className="font-medium text-muted-foreground">Location:</span>
                              <p className="text-foreground">{application.interview.location}</p>
                            </div>
                          )}
                          {application.interview.interviewer && (
                            <div className="md:col-span-2">
                              <span className="font-medium text-muted-foreground">Interviewer:</span>
                              <p className="text-foreground">{application.interview.interviewer}</p>
                            </div>
                          )}
                        </div>
                        {application.interview.notes && (
                          <div className="mt-3">
                            <span className="font-medium text-muted-foreground">Notes:</span>
                            <p className="text-foreground text-sm mt-1">{application.interview.notes}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Feedback */}
                    {application.feedback && (
                      <div className={cn(
                        "p-4 rounded-lg",
                        application.status === 'offered' 
                          ? "bg-green-50 dark:bg-green-950" 
                          : "bg-red-50 dark:bg-red-950"
                      )}>
                        <h4 className="font-medium text-foreground mb-2">
                          {application.status === 'offered' ? 'Offer Details' : 'Feedback'}
                        </h4>
                        <p className="text-sm text-foreground">{application.feedback}</p>
                      </div>
                    )}

                    {/* Next Steps */}
                    {application.nextSteps && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <h4 className="font-medium text-foreground mb-2">Next Steps</h4>
                        <p className="text-sm text-foreground">{application.nextSteps}</p>
                      </div>
                    )}

                    {/* Documents */}
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="font-medium text-muted-foreground">Documents:</span>
                          <div className="flex items-center space-x-3">
                            <a href={application.documents.resume} className="flex items-center space-x-1 text-primary hover:underline">
                              <Download className="h-3 w-3" />
                              <span>Resume</span>
                            </a>
                            {application.documents.coverLetter && (
                              <a href={application.documents.coverLetter} className="flex items-center space-x-1 text-primary hover:underline">
                                <Download className="h-3 w-3" />
                                <span>Cover Letter</span>
                              </a>
                            )}
                            {application.documents.portfolio && (
                              <a href={application.documents.portfolio} className="flex items-center space-x-1 text-primary hover:underline">
                                <Download className="h-3 w-3" />
                                <span>Portfolio</span>
                              </a>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Message Employer
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {/* Empty State */}
          {filteredApplications.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchTerm || statusFilter !== 'all' ? 'No matching applications' : 'No applications yet'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Start applying to jobs to see your applications here'
                  }
                </p>
                <Button onClick={() => router.push('/jobs')}>
                  <Search className="h-4 w-4 mr-2" />
                  Browse Jobs
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}