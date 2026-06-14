'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import {
  BriefcaseIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserGroupIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PauseIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  StarIcon,
  ChatBubbleLeftIcon,
  ArrowLeftIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

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

interface JobApplication {
  id: string;
  applicantName: string;
  email: string;
  phone: string;
  experience: number;
  currentSalary?: number;
  expectedSalary: number;
  appliedAt: string;
  status: string;
  resume?: string;
  rating?: number;
  notes?: string;
  availableFrom?: string;
  // API may return employee nested object
  employee?: {
    id: string;
    user?: { profile?: { firstName?: string; lastName?: string }; email?: string };
    phone?: string;
  };
  coverLetter?: string;
  resumeUrl?: string;
}

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  jobType: string;
  experienceMin?: number;
  experienceMax?: number;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  requirements: string[];
  benefits: string[];
  status: string;
  createdAt: string;
  deadline?: string;
  applicationCount: number;
  viewCount: number;
  applications: JobApplication[];
  restaurant?: { name?: string };
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingApplicationId, setUpdatingApplicationId] = useState<string | null>(null);

  const jobId = Array.isArray(params.id) ? params.id[0] : params.id;

  const loadJob = useCallback(async () => {
    if (!jobId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<JobPosting>(`/jobs/${jobId}`);
      setJob(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load job details');
      toast.error('Failed to load job details');
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  const handleStatusChange = async (newStatus: string) => {
    if (!job) return;
    setUpdatingStatus(true);
    try {
      const updated = await apiFetch<JobPosting>(`/jobs/${job.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      setJob(updated);
      toast.success(`Job ${newStatus.toLowerCase()} successfully`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update job status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleApplicationAction = async (
    applicationId: string,
    action: 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED' | 'REVIEWED'
  ) => {
    setUpdatingApplicationId(applicationId);
    try {
      await apiFetch(`/jobs/applications/${applicationId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: action }),
      });
      // Refresh the job to get updated application statuses
      await loadJob();
      toast.success('Application updated successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update application');
    } finally {
      setUpdatingApplicationId(null);
    }
  };

  const handleDeleteJob = async () => {
    if (!job) return;
    if (!confirm('Are you sure you want to delete this job posting? This cannot be undone.')) return;
    try {
      await apiFetch(`/jobs/${job.id}`, { method: 'DELETE' });
      toast.success('Job deleted successfully');
      router.push('/restaurant/jobs');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete job');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'green';
      case 'PAUSED': return 'yellow';
      case 'CLOSED': return 'red';
      case 'DRAFT': return 'gray';
      default: return 'gray';
    }
  };

  const getApplicationStatusBadgeColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACCEPTED': return 'green';
      case 'REVIEWED': return 'blue';
      case 'SHORTLISTED': return 'yellow';
      case 'REJECTED': return 'red';
      case 'PENDING': return 'gray';
      default: return 'gray';
    }
  };

  const getApplicantName = (app: JobApplication): string => {
    if (app.applicantName) return app.applicantName;
    const p = app.employee?.user?.profile;
    if (p?.firstName || p?.lastName) {
      return `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim();
    }
    return 'Unknown Applicant';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <ExclamationCircleIcon className="w-16 h-16 text-red-400 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">
            {error ? 'Failed to load job' : 'Job Not Found'}
          </h2>
          <p className="text-gray-600">
            {error ?? "The job posting you're looking for doesn't exist."}
          </p>
          <div className="flex items-center justify-center space-x-3">
            <Button variant="outline" onClick={loadJob}>
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BriefcaseIcon },
    { id: 'applications', label: `Applications (${job.applications?.length ?? 0})`, icon: UserGroupIcon },
    { id: 'analytics', label: 'Analytics', icon: StarIcon },
    { id: 'settings', label: 'Settings', icon: PencilIcon },
  ];

  const applications = job.applications ?? [];
  const applicationStats = {
    total: applications.length,
    pending: applications.filter(a => a.status?.toUpperCase() === 'PENDING').length,
    shortlisted: applications.filter(a => a.status?.toUpperCase() === 'SHORTLISTED').length,
    reviewed: applications.filter(a => a.status?.toUpperCase() === 'REVIEWED').length,
    accepted: applications.filter(a => a.status?.toUpperCase() === 'ACCEPTED').length,
    rejected: applications.filter(a => a.status?.toUpperCase() === 'REJECTED').length,
  };

  const salaryStr =
    job.salaryMin != null && job.salaryMax != null
      ? `₹${job.salaryMin.toLocaleString()} - ₹${job.salaryMax.toLocaleString()} per month`
      : 'Not specified';

  const experienceStr =
    job.experienceMin != null || job.experienceMax != null
      ? `${job.experienceMin ?? 0}–${job.experienceMax ?? '?'} years`
      : null;

  const daysActive = Math.ceil(
    (Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <Badge color={getStatusBadgeColor(job.status)}>
                {job.status}
              </Badge>
            </div>
            <p className="text-gray-600">
              {[job.department, job.location].filter(Boolean).join(' • ')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button variant="outline" onClick={() => router.push(`/restaurant/jobs/${job.id}/edit`)}>
            <PencilIcon className="w-4 h-4 mr-2" />
            Edit
          </Button>
          {job.status?.toUpperCase() === 'ACTIVE' ? (
            <Button
              variant="outline"
              disabled={updatingStatus}
              onClick={() => handleStatusChange('PAUSED')}
            >
              <PauseIcon className="w-4 h-4 mr-2" />
              {updatingStatus ? 'Updating...' : 'Pause'}
            </Button>
          ) : (
            <Button
              variant="outline"
              disabled={updatingStatus}
              onClick={() => handleStatusChange('ACTIVE')}
            >
              <PlayIcon className="w-4 h-4 mr-2" />
              {updatingStatus ? 'Updating...' : 'Activate'}
            </Button>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <EyeIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">{job.viewCount ?? 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Applications</p>
              <p className="text-2xl font-bold text-gray-900">{applicationStats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Days Active</p>
              <p className="text-2xl font-bold text-gray-900">{daysActive}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Accepted</p>
              <p className="text-2xl font-bold text-gray-900">{applicationStats.accepted}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {tabs.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id}>
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Job Details</h3>

                  <div className="space-y-3">
                    {job.location && (
                      <div className="flex items-center space-x-2">
                        <MapPinIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-900">{job.location}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <BriefcaseIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">
                        {job.jobType?.replace('_', '-').toLowerCase() ?? 'N/A'}
                        {experienceStr ? ` • ${experienceStr}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CurrencyDollarIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{salaryStr}</span>
                    </div>
                    {job.deadline && (
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-900">
                          Closes on {format(new Date(job.deadline), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>

                  {job.requirements?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
                      <ul className="space-y-1">
                        {job.requirements.map((req, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Description</h3>
                  <div className="prose prose-sm text-gray-600">
                    {job.description?.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-3">{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>

              {job.benefits?.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Benefits</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {job.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Applications</h3>
              </div>

              {/* Application Stats */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {[
                  { label: 'Total', value: applicationStats.total, bg: 'bg-gray-50', textColor: 'text-gray-900', labelColor: 'text-gray-600' },
                  { label: 'Pending', value: applicationStats.pending, bg: 'bg-gray-50', textColor: 'text-gray-600', labelColor: 'text-gray-600' },
                  { label: 'Shortlisted', value: applicationStats.shortlisted, bg: 'bg-yellow-50', textColor: 'text-yellow-600', labelColor: 'text-yellow-600' },
                  { label: 'Reviewed', value: applicationStats.reviewed, bg: 'bg-blue-50', textColor: 'text-blue-600', labelColor: 'text-blue-600' },
                  { label: 'Accepted', value: applicationStats.accepted, bg: 'bg-green-50', textColor: 'text-green-600', labelColor: 'text-green-600' },
                  { label: 'Rejected', value: applicationStats.rejected, bg: 'bg-red-50', textColor: 'text-red-600', labelColor: 'text-red-600' },
                ].map(({ label, value, bg, textColor, labelColor }) => (
                  <div key={label} className={`text-center p-3 ${bg} rounded-lg`}>
                    <div className={`text-lg font-semibold ${textColor}`}>{value}</div>
                    <div className={`text-xs ${labelColor}`}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Applications List */}
              {applications.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <UserGroupIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No applications yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((application) => {
                    const name = getApplicantName(application);
                    const email = application.email || application.employee?.user?.email || '';
                    const isUpdating = updatingApplicationId === application.id;
                    const statusUpper = application.status?.toUpperCase() ?? 'PENDING';

                    return (
                      <Card key={application.id} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-gray-600 font-medium">
                                {name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{name}</h4>
                              {email && <p className="text-sm text-gray-600">{email}</p>}
                            </div>
                          </div>
                          <Badge color={getApplicationStatusBadgeColor(application.status)}>
                            {application.status?.toLowerCase() ?? 'pending'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 text-sm">
                          {application.experience != null && (
                            <div>
                              <span className="text-gray-600">Experience:</span>
                              <span className="ml-1 text-gray-900">{application.experience} years</span>
                            </div>
                          )}
                          {application.expectedSalary != null && (
                            <div>
                              <span className="text-gray-600">Expected Salary:</span>
                              <span className="ml-1 text-gray-900">
                                ₹{application.expectedSalary.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {application.appliedAt && (
                            <div>
                              <span className="text-gray-600">Applied:</span>
                              <span className="ml-1 text-gray-900">
                                {format(new Date(application.appliedAt), 'MMM dd, yyyy')}
                              </span>
                            </div>
                          )}
                          {application.availableFrom && (
                            <div>
                              <span className="text-gray-600">Available from:</span>
                              <span className="ml-1 text-gray-900">
                                {format(new Date(application.availableFrom), 'MMM dd, yyyy')}
                              </span>
                            </div>
                          )}
                        </div>

                        {application.rating != null && (
                          <div className="flex items-center space-x-1 mb-3">
                            <span className="text-sm text-gray-600">Rating:</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <StarIcon
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < Math.floor(application.rating ?? 0)
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-900">{application.rating}</span>
                          </div>
                        )}

                        {application.notes && (
                          <div className="mb-3">
                            <span className="text-sm text-gray-600">Notes:</span>
                            <p className="text-sm text-gray-900 mt-1">{application.notes}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex space-x-2">
                            {(application.resumeUrl || application.resume) && (
                              <Button
                                variant="outline"
                                onClick={() =>
                                  window.open(application.resumeUrl || application.resume, '_blank')
                                }
                              >
                                <EyeIcon className="w-4 h-4 mr-1" />
                                View Resume
                              </Button>
                            )}
                          </div>

                          <div className="flex space-x-2">
                            {statusUpper === 'PENDING' && (
                              <>
                                <Button
                                  disabled={isUpdating}
                                  onClick={() => handleApplicationAction(application.id, 'SHORTLISTED')}
                                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                                >
                                  Shortlist
                                </Button>
                                <Button
                                  disabled={isUpdating}
                                  onClick={() => handleApplicationAction(application.id, 'REJECTED')}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Reject
                                </Button>
                              </>
                            )}

                            {statusUpper === 'SHORTLISTED' && (
                              <>
                                <Button
                                  disabled={isUpdating}
                                  onClick={() => handleApplicationAction(application.id, 'REVIEWED')}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  Mark Reviewed
                                </Button>
                                <Button
                                  disabled={isUpdating}
                                  onClick={() => handleApplicationAction(application.id, 'REJECTED')}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Reject
                                </Button>
                              </>
                            )}

                            {statusUpper === 'REVIEWED' && (
                              <>
                                <Button
                                  disabled={isUpdating}
                                  onClick={() => handleApplicationAction(application.id, 'ACCEPTED')}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  Accept
                                </Button>
                                <Button
                                  disabled={isUpdating}
                                  onClick={() => handleApplicationAction(application.id, 'REJECTED')}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Job Performance Analytics</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Application Rate</h4>
                  <div className="text-3xl font-bold text-blue-600">
                    {job.viewCount && job.viewCount > 0
                      ? (((applicationStats.total / job.viewCount) * 100).toFixed(1))
                      : '0'}%
                  </div>
                  <p className="text-sm text-gray-600">
                    {applicationStats.total} applications from {job.viewCount ?? 0} views
                  </p>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Success Rate</h4>
                  <div className="text-3xl font-bold text-green-600">
                    {applicationStats.total > 0
                      ? ((applicationStats.accepted / applicationStats.total) * 100).toFixed(1)
                      : '0'}%
                  </div>
                  <p className="text-sm text-gray-600">
                    {applicationStats.accepted} accepted from {applicationStats.total} applications
                  </p>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Days Active</h4>
                  <div className="text-3xl font-bold text-purple-600">{daysActive}</div>
                  <p className="text-sm text-gray-600">Since posting date</p>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Job Settings</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h4 className="font-medium text-gray-900 mb-4">Status Management</h4>
                  <div className="space-y-3">
                    <Button
                      onClick={() => handleStatusChange('ACTIVE')}
                      disabled={job.status?.toUpperCase() === 'ACTIVE' || updatingStatus}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      Activate Job
                    </Button>
                    <Button
                      onClick={() => handleStatusChange('PAUSED')}
                      disabled={job.status?.toUpperCase() === 'PAUSED' || updatingStatus}
                      variant="outline"
                      className="w-full"
                    >
                      Pause Job
                    </Button>
                    <Button
                      onClick={() => handleStatusChange('CLOSED')}
                      disabled={job.status?.toUpperCase() === 'CLOSED' || updatingStatus}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                    >
                      Close Job
                    </Button>
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium text-gray-900 mb-4">Danger Zone</h4>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full border-red-300 text-red-600 hover:bg-red-50"
                      onClick={handleDeleteJob}
                    >
                      <TrashIcon className="w-4 h-4 mr-2" />
                      Delete Job
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
