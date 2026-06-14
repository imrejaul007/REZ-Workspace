'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Filter,
  Search,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Award,
  MessageSquare,
  FileText,
  ArrowUpDown,
  MoreHorizontal,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/auth/auth-provider';
import { UserRole } from '@/types/auth';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';

interface JobApplication {
  id: string;
  applicant: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
    location: {
      city: string;
      state: string;
    };
    profile: {
      title: string;
      experience: number;
      rating?: number;
      verified: boolean;
    };
  };
  job: {
    id: string;
    title: string;
    department: string;
  };
  appliedAt: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'interview-scheduled' | 'offered' | 'rejected' | 'withdrawn';
  coverLetter: string;
  resume?: {
    url: string;
    filename: string;
  };
  experience: {
    totalYears: number;
    relevantYears: number;
    previousRoles: Array<{
      title: string;
      company: string;
      duration: string;
    }>;
  };
  skills: string[];
  expectedSalary: {
    amount: number;
    negotiable: boolean;
  };
  availability: {
    startDate: string;
    noticePeriod: string;
  };
  score?: number;
  notes?: string;
}

const statusColors = {
  'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'reviewed': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'shortlisted': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'interview-scheduled': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'offered': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  'rejected': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'withdrawn': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
};

// Helper to map API response to the page's JobApplication shape
function mapApiApplication(raw): JobApplication {
  const profile = raw.employee?.user?.profile;
  const firstName = profile?.firstName ?? '';
  const lastName = profile?.lastName ?? '';
  return {
    id: raw.id,
    applicant: {
      id: raw.employee?.id ?? '',
      name: `${firstName} ${lastName}`.trim() || 'Unknown',
      email: raw.employee?.user?.email ?? '',
      phone: raw.employee?.user?.phone ?? '',
      location: {
        city: profile?.city ?? '',
        state: profile?.state ?? '',
      },
      profile: {
        title: raw.employee?.designation ?? '',
        experience: 0,
        verified: false,
      },
    },
    job: {
      id: raw.job?.id ?? '',
      title: raw.job?.title ?? '',
      department: '',
    },
    appliedAt: raw.createdAt ?? new Date().toISOString(),
    status: (raw.status?.toLowerCase().replace('_', '-') ?? 'pending') as JobApplication['status'],
    coverLetter: raw.coverLetter ?? '',
    resume: raw.resume ? { url: raw.resume, filename: 'Resume' } : undefined,
    experience: { totalYears: 0, relevantYears: 0, previousRoles: [] },
    skills: [],
    expectedSalary: { amount: 0, negotiable: false },
    availability: { startDate: '', noticePeriod: '' },
    notes: raw.reviewNotes,
  };
}

export default function ApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'name'>('date');
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchApplications = useCallback(async () => {
    setLoadingApplications(true);
    setLoadError(null);
    try {
      const res = await apiClient.get<{ data?: { data?: unknown[] } | unknown[] }>('/jobs/restaurant-applications?limit=100');
      const rawList: unknown[] = res?.data?.data ?? res?.data ?? [];
      setApplications(rawList.map(mapApiApplication));
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingApplications(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === UserRole.RESTAURANT) {
      fetchApplications();
    }
  }, [user, fetchApplications]);

  // Verify user is restaurant owner
  if (user?.role !== UserRole.RESTAURANT) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Access Denied
          </h2>
          <p className="text-muted-foreground">
            Only restaurant owners can view applications.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.applicant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.job.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const sortedApplications = [...filteredApplications].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return (b.score || 0) - (a.score || 0);
      case 'name':
        return a.applicant.name.localeCompare(b.applicant.name);
      case 'date':
      default:
        return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
    }
  });

  const updateApplicationStatus = async (applicationId: string, newStatus: JobApplication['status']) => {
    try {
      // Map frontend status strings to API's ApplicationStatus enum
      const statusMap: Record<string, string> = {
        'pending': 'PENDING',
        'reviewed': 'REVIEWED',
        'shortlisted': 'SHORTLISTED',
        'interview-scheduled': 'SHORTLISTED',
        'offered': 'ACCEPTED',
        'rejected': 'REJECTED',
        'withdrawn': 'REJECTED',
      };
      const apiStatus = statusMap[newStatus] ?? newStatus.toUpperCase();
      await apiClient.put(`/jobs/applications/${applicationId}/status`, { status: apiStatus });
      setApplications(prev =>
        prev.map(app => app.id === applicationId ? { ...app, status: newStatus } : app)
      );
    } catch (err) {
      console.error('Failed to update application status:', err);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const selectAll = () => {
    if (selectedIds.size === sortedApplications.length) {
      setSelectedIds(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedIds(new Set(sortedApplications.map(app => app.id)));
      setShowBulkActions(true);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Job Applications</h1>
            <p className="text-muted-foreground">
              Review and manage applications for your job postings
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={fetchApplications} disabled={loadingApplications}>
              <Download className="h-4 w-4 mr-2" />
              {loadingApplications ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {loadError && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            {loadError}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-foreground">{applications.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-foreground">
                    {applications.filter(app => app.status === 'pending').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Shortlisted</p>
                  <p className="text-2xl font-bold text-foreground">
                    {applications.filter(app => app.status === 'shortlisted').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Interviews</p>
                  <p className="text-2xl font-bold text-foreground">
                    {applications.filter(app => app.status === 'interview-scheduled').length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search applications..."
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="interview-scheduled">Interview Scheduled</SelectItem>
                  <SelectItem value="offered">Offered</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'date' | 'score' | 'name')}>
                <SelectTrigger className="px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Sort by Date</SelectItem>
                  <SelectItem value="score">Sort by Score</SelectItem>
                  <SelectItem value="name">Sort by Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {showBulkActions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/10 border border-primary/20 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                {selectedIds.size} application{selectedIds.size > 1 ? 's' : ''} selected
              </p>
              <div className="flex items-center space-x-2">
                <Button  variant="outline">Mark as Reviewed</Button>
                <Button  variant="outline">Shortlist</Button>
                <Button  variant="outline" className="text-destructive">Reject</Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading state */}
        {loadingApplications && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Loading applications...</span>
          </div>
        )}

        {/* Applications List */}
        {!loadingApplications && (
        <>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedIds.size === sortedApplications.length && sortedApplications.length > 0}
                onChange={() => selectAll()}
                className="rounded border-border"
              />
              <span className="text-sm font-medium">Select All</span>
            </label>
            <p className="text-sm text-muted-foreground">
              {sortedApplications.length} application{sortedApplications.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Applications */}
          {sortedApplications.map((application) => (
            <motion.div
              key={application.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Card className={cn(
                "cursor-pointer hover:shadow-md transition-all",
                selectedIds.has(application.id) && "ring-2 ring-primary/20 bg-primary/5"
              )}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedIds.has(application.id)}
                      onChange={() => toggleSelection(application.id)}
                      className="rounded border-border mt-1"
                    />

                    {/* Avatar */}
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-6 w-6 text-primary" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              {application.applicant.name}
                            </h3>
                            {application.applicant.profile.verified && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Applied for {application.job.title} • {formatDate(application.appliedAt)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {application.score && (
                            <div className="flex items-center space-x-1 bg-primary/10 px-2 py-1 rounded">
                              <Star className="h-3 w-3 text-primary" />
                              <span className="text-sm font-medium text-primary">{application.score}</span>
                            </div>
                          )}
                          <Badge className={statusColors[application.status]}>
                            {application.status.replace('-', ' ')}
                          </Badge>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          <span>{application.experience.totalYears} years experience</span>
                        </div>
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{application.applicant.location.city}, {application.applicant.location.state}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Available: {application.availability.startDate}</span>
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-2">
                        {application.skills.slice(0, 4).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded"
                          >
                            {skill}
                          </span>
                        ))}
                        {application.skills.length > 4 && (
                          <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                            +{application.skills.length - 4} more
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center space-x-4 text-sm">
                          <button className="flex items-center space-x-1 text-primary hover:text-primary/80">
                            <Eye className="h-4 w-4" />
                            <span>View Details</span>
                          </button>
                          <button className="flex items-center space-x-1 text-muted-foreground hover:text-foreground">
                            <MessageSquare className="h-4 w-4" />
                            <span>Message</span>
                          </button>
                          <button className="flex items-center space-x-1 text-muted-foreground hover:text-foreground">
                            <Download className="h-4 w-4" />
                            <span>Resume</span>
                          </button>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {application.status === 'pending' && (
                            <>
                              <Button
                                
                                variant="outline"
                                onClick={() => updateApplicationStatus(application.id, 'shortlisted')}
                              >
                                Shortlist
                              </Button>
                              <Button
                                
                                variant="destructive"
                                onClick={() => updateApplicationStatus(application.id, 'rejected')}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {application.status === 'shortlisted' && (
                            <Button
                              
                              onClick={() => updateApplicationStatus(application.id, 'interview-scheduled')}
                            >
                              Schedule Interview
                            </Button>
                          )}
                          {application.status === 'interview-scheduled' && (
                            <Button
                              
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => updateApplicationStatus(application.id, 'offered')}
                            >
                              Make Offer
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {sortedApplications.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No applications found
              </h3>
              <p className="text-muted-foreground">
                {searchQuery || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Applications will appear here when candidates apply for your jobs'
                }
              </p>
            </CardContent>
          </Card>
        )}
        </>
        )}
      </div>
    </DashboardLayout>
  );
}