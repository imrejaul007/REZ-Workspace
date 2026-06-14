'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Users,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  Calendar,
  ChefHat,
  Utensils,
  User,
  FileText,
  Star,
  TrendingUp,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface Job {
  id: string;
  title: string;
  department: string;
  jobType: string;
  experienceMin?: number;
  experienceMax?: number;
  salaryMin?: number;
  salaryMax?: number;
  location: string;
  description: string;
  requirements: string[];
  benefits: string[];
  postedAt: string;
  deadline?: string;
  status: string;
  applicationCount: number;
  viewCount: number;
}

interface PaginatedJobs {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200';
    case 'paused':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'closed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    case 'draft':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

const getTypeColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'full_time':
    case 'full-time':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'part_time':
    case 'part-time':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'contract':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'internship':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

const getDepartmentIcon = (department: string) => {
  switch (department?.toLowerCase()) {
    case 'kitchen':
      return <ChefHat className="h-4 w-4" />;
    case 'service':
      return <Utensils className="h-4 w-4" />;
    case 'management':
      return <User className="h-4 w-4" />;
    default:
      return <Briefcase className="h-4 w-4" />;
  }
};

export default function RestaurantJobs() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<PaginatedJobs>(
        `/jobs/my-jobs?page=${page}&limit=20`
      );
      setJobs(data.jobs ?? []);
      setTotalPages(data.totalPages ?? 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;
    setDeletingId(jobId);
    try {
      await apiFetch(`/jobs/${jobId}`, { method: 'DELETE' });
      setJobs(prev => prev.filter(j => j.id !== jobId));
      setSelectedJobs(prev => prev.filter(id => id !== jobId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete job');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || job.status?.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectJob = (jobId: string) => {
    setSelectedJobs(prev =>
      prev.includes(jobId)
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const handleSelectAll = () => {
    if (selectedJobs.length === filteredJobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(filteredJobs.map(job => job.id));
    }
  };

  const activeCount = jobs.filter(j => j.status?.toLowerCase() === 'active').length;
  const totalApplications = jobs.reduce((sum, j) => sum + (j.applicationCount ?? 0), 0);
  const totalViews = jobs.reduce((sum, j) => sum + (j.viewCount ?? 0), 0);

  const jobStats = [
    {
      title: 'Active Jobs',
      value: String(activeCount),
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      title: 'Total Applications',
      value: String(totalApplications),
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      title: 'Total Views',
      value: totalViews.toLocaleString(),
      icon: Eye,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
    },
    {
      title: 'Total Postings',
      value: String(jobs.length),
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Job Portal</h1>
            <p className="text-muted-foreground mt-1">
              Manage your job postings and track applications
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Button variant="outline" disabled title="Coming soon">
              <FileText className="h-4 w-4 mr-2" />
              Templates
            </Button>
            <Button variant="outline" onClick={() => router.push('/restaurant/analytics')}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button onClick={() => router.push('/restaurant/jobs/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Post New Job
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {jobStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                          {loading ? '—' : stat.value}
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

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search jobs by title or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="closed">Closed</option>
                    <option value="draft">Draft</option>
                  </select>
                  <Button variant="outline" onClick={fetchJobs} disabled={loading}>
                    <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedJobs.length > 0 && (
                <div className="mt-4 p-3 bg-primary/10 rounded-lg border-l-4 border-primary">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-primary font-medium">
                      {selectedJobs.length} job{selectedJobs.length > 1 ? 's' : ''} selected
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          selectedJobs.forEach(id => handleDeleteJob(id));
                        }}
                      >
                        Delete Selected
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Jobs List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-semibold">
                Job Listings ({filteredJobs.length})
              </CardTitle>
              {filteredJobs.length > 0 && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedJobs.length === filteredJobs.length && filteredJobs.length > 0}
                    onChange={() => handleSelectAll()}
                    className="rounded border-border"
                  />
                  <label className="text-sm text-muted-foreground">Select All</label>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {/* Loading state */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3 text-muted-foreground">Loading jobs...</span>
                </div>
              )}

              {/* Error state */}
              {!loading && error && (
                <div className="flex flex-col items-center py-12 space-y-4">
                  <AlertCircle className="h-12 w-12 text-destructive" />
                  <p className="text-destructive font-medium">{error}</p>
                  <Button variant="outline" onClick={fetchJobs}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              )}

              {/* Jobs */}
              {!loading && !error && (
                <div className="space-y-4">
                  {filteredJobs.map((job) => (
                    <div
                      key={job.id}
                      className={cn(
                        'p-6 rounded-lg border transition-colors hover:bg-accent/30',
                        selectedJobs.includes(job.id) ? 'bg-primary/5 border-primary/20' : 'bg-background'
                      )}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedJobs.includes(job.id)}
                            onChange={() => handleSelectJob(job.id)}
                            className="mt-1 rounded border-border"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-foreground">{job.title}</h3>
                              <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(job.status)}`}>
                                {job.status}
                              </div>
                              {job.jobType && (
                                <div className={`text-xs px-2 py-1 rounded-full ${getTypeColor(job.jobType)}`}>
                                  {job.jobType.replace('_', '-').toLowerCase()}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground mb-3">
                              {job.department && (
                                <div className="flex items-center space-x-1">
                                  {getDepartmentIcon(job.department)}
                                  <span>{job.department}</span>
                                </div>
                              )}
                              {job.location && (
                                <div className="flex items-center space-x-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>{job.location}</span>
                                </div>
                              )}
                              {job.salaryMin != null && job.salaryMax != null && (
                                <div className="flex items-center space-x-1">
                                  <DollarSign className="h-4 w-4" />
                                  <span>
                                    {formatCurrency(job.salaryMin)} - {formatCurrency(job.salaryMax)}
                                  </span>
                                </div>
                              )}
                              {(job.experienceMin != null || job.experienceMax != null) && (
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    {job.experienceMin ?? 0}
                                    {job.experienceMax != null ? `–${job.experienceMax}` : '+'} yrs
                                  </span>
                                </div>
                              )}
                            </div>

                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {job.description}
                            </p>

                            <div className="flex items-center space-x-4 text-sm">
                              <div className="flex items-center space-x-1">
                                <Users className="h-4 w-4 text-primary" />
                                <span>{job.applicationCount ?? 0} applications</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Eye className="h-4 w-4 text-muted-foreground" />
                                <span>{job.viewCount ?? 0} views</span>
                              </div>
                              {job.deadline && (
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span>
                                    Deadline: {formatDate(job.deadline, { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="ghost"
                            onClick={() => router.push(`/restaurant/jobs/${job.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => router.push(`/restaurant/jobs/${job.id}/edit`)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            disabled={deletingId === job.id}
                            onClick={() => handleDeleteJob(job.id)}
                          >
                            {deletingId === job.id
                              ? <RefreshCw className="h-4 w-4 animate-spin" />
                              : <Trash2 className="h-4 w-4" />
                            }
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredJobs.length === 0 && (
                    <div className="text-center py-12">
                      <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No jobs found</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchTerm || statusFilter !== 'all'
                          ? 'Try adjusting your search or filters'
                          : 'Get started by posting your first job'
                        }
                      </p>
                      <Button onClick={() => router.push('/restaurant/jobs/create')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Post New Job
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {!loading && !error && totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-6">
                  <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
