'use client';

import React, { useState, useMemo, useCallback, Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import toast from '@/lib/toast';
import {
  Search,
  MapPin,
  Briefcase,
  Plus,
  SlidersHorizontal,
  X,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/auth/auth-provider';
import { UserRole } from '@/types/auth';
import JobCard from '@/components/jobs/job-card';
import { cn } from '@/lib/utils';

// Dynamic imports for better bundle splitting
const JobApplicationFormOptimized = dynamic(() => import('@/components/jobs/job-application-form-optimized'), {
  loading: () => (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
            <div className="h-4 bg-muted rounded w-4/6"></div>
          </div>
        </div>
      </div>
    </div>
  ),
  ssr: false
});

interface Job {
  id: string;
  title: string;
  company: {
    id: string;
    name: string;
    logo?: string;
    verified: boolean;
    rating?: number;
    location: string;
  };
  description: string;
  requirements: string[];
  responsibilities?: string[];
  benefits?: string[];
  location: {
    city: string;
    state: string;
    remote: boolean;
    hybrid: boolean;
  };
  employment: {
    type: 'full-time' | 'part-time' | 'contract' | 'temporary' | 'internship';
    experience: string;
    department: string;
  };
  salary: {
    min?: number;
    max?: number;
    currency: string;
    period: 'hourly' | 'monthly' | 'yearly';
    negotiable: boolean;
  };
  application: {
    deadline?: string;
    method: 'internal' | 'external' | 'email';
    externalUrl?: string;
    email?: string;
    status: 'open' | 'closed' | 'filled';
  };
  stats: {
    views: number;
    applications: number;
    likes: number;
  };
  tags: string[];
  featured: boolean;
  urgent: boolean;
  /** 'rez_shift_sync' when created by the REZ hiring pipeline */
  source?: string;
  createdAt: string;
  updatedAt: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api';

/** Map a raw API job record to the local Job shape. */
function normalizeJob(raw): Job {
  return {
    id: raw.id,
    title: raw.title,
    company: {
      id: raw.restaurant?.id ?? raw.restaurantId ?? '',
      name: raw.restaurant?.name ?? 'Unknown',
      verified: false,
      location: raw.location ?? '',
    },
    description: raw.description ?? '',
    requirements: raw.requirements ?? [],
    location: {
      city: raw.location ?? '',
      state: '',
      remote: false,
      hybrid: false,
    },
    employment: {
      type: raw.jobType?.toLowerCase().replace(' ', '-') ?? 'full-time',
      experience: '',
      department: '',
    },
    salary: {
      min: raw.salaryMin ?? undefined,
      max: raw.salaryMax ?? undefined,
      currency: 'INR',
      period: 'monthly',
      negotiable: false,
    },
    application: {
      deadline: raw.validTill,
      method: 'internal',
      status: raw.status === 'OPEN' ? 'open' : raw.status === 'FILLED' ? 'filled' : 'closed',
    },
    stats: {
      views: raw.viewCount ?? 0,
      applications: raw.applicationCount ?? 0,
      likes: 0,
    },
    tags: raw.skills ?? [],
    featured: false,
    urgent: false,
    source: raw.source ?? 'manual',
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  };
}


export default function JobsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [salaryFilter, setSalaryFilter] = useState('all');
  const [rezSyncFilter, setRezSyncFilter] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [bookmarkedJobs, setBookmarkedJobs] = useState<Set<string>>(new Set());
  const [likedJobs, setLikedJobs] = useState<Set<string>>(new Set());
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  const fetchJobs = useCallback(async () => {
    setJobsLoading(true);
    setJobsError(null);
    try {
      const params = new URLSearchParams({ status: 'OPEN', limit: '50' });
      const res = await fetch(`${API_BASE}/jobs?${params.toString()}`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Failed to load jobs (HTTP ${res.status})`);
      const json = await res.json();
      const raw: unknown[] = json.data ?? json ?? [];
      setJobs(raw.map(normalizeJob));
    } catch (err: unknown) {
      setJobsError(err instanceof Error ? err.message : String(err));
    } finally {
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = !searchTerm ||
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.requirements.some(req => req.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesLocation = !locationFilter ||
        job.location.city.toLowerCase().includes(locationFilter.toLowerCase()) ||
        job.location.state.toLowerCase().includes(locationFilter.toLowerCase());

      const matchesType = typeFilter === 'all' || job.employment.type === typeFilter;

      const matchesExperience = experienceFilter === 'all' ||
        (experienceFilter === 'entry' && job.employment.experience.includes('0-2')) ||
        (experienceFilter === 'mid' && (job.employment.experience.includes('2-5') || job.employment.experience.includes('3-5'))) ||
        (experienceFilter === 'senior' && (job.employment.experience.includes('5+') || job.employment.experience.includes('8+')));

      const matchesSalary = salaryFilter === 'all' ||
        (salaryFilter === 'under-30k' && job.salary.max && job.salary.max <= 30000) ||
        (salaryFilter === '30k-50k' && job.salary.min && job.salary.min >= 30000 && job.salary.max && job.salary.max <= 50000) ||
        (salaryFilter === '50k-80k' && job.salary.min && job.salary.min >= 50000 && job.salary.max && job.salary.max <= 80000) ||
        (salaryFilter === 'above-80k' && job.salary.min && job.salary.min >= 80000);

      const matchesRezSync = !rezSyncFilter || job.source === 'rez_shift_sync';

      return matchesSearch && matchesLocation && matchesType && matchesExperience && matchesSalary && matchesRezSync;
    });
  }, [jobs, searchTerm, locationFilter, typeFilter, experienceFilter, salaryFilter, rezSyncFilter]);

  const sortedJobs = useMemo(() => {
    return [...filteredJobs].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'salary':
          const aSalary = a.salary.max || a.salary.min || 0;
          const bSalary = b.salary.max || b.salary.min || 0;
          return bSalary - aSalary;
        case 'applications':
          return a.stats.applications - b.stats.applications;
        case 'relevance':
        default:
          return (b.featured ? 1000 : 0) + (b.urgent ? 500 : 0) - ((a.featured ? 1000 : 0) + (a.urgent ? 500 : 0));
      }
    });
  }, [filteredJobs, sortBy]);

  const handleJobApply = useCallback((jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      setSelectedJob(job);
      setShowApplicationForm(true);
    }
  }, [jobs]);

  const handleJobBookmark = useCallback((jobId: string) => {
    setBookmarkedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  }, []);

  const handleJobShare = useCallback((jobId: string) => {
    // Copy job URL to clipboard
    const url = `${window.location.origin}/jobs/${jobId}`;
    navigator.clipboard.writeText(url);
    toast.success('Job link copied to clipboard!');
  }, []);

  const handleJobView = useCallback((jobId: string) => {
    // Navigate to job detail page
    window.open(`/jobs/${jobId}`, '_blank');
  }, []);

  const handleApplicationSubmit = useCallback(async (applicationData) => {
    const loadingToast = toast.loading('Submitting application...');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock API submission
      const submissionData = {
        ...applicationData,
        jobId: selectedJob?.id,
        submittedAt: new Date().toISOString()
      };

      toast.dismiss(loadingToast);
      toast.success('Application submitted successfully!', 'You will be notified when the employer reviews your application.');
      setShowApplicationForm(false);
      setSelectedJob(null);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to submit application', 'Please try again later.');
    }
  }, [selectedJob?.id]);

  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setLocationFilter('');
    setTypeFilter('all');
    setExperienceFilter('all');
    setSalaryFilter('all');
    setRezSyncFilter(false);
  }, []);

  const jobTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'temporary', label: 'Temporary' },
    { value: 'internship', label: 'Internship' }
  ];

  const experienceOptions = [
    { value: 'all', label: 'All Experience' },
    { value: 'entry', label: 'Entry Level (0-2 years)' },
    { value: 'mid', label: 'Mid Level (2-5 years)' },
    { value: 'senior', label: 'Senior Level (5+ years)' }
  ];

  const salaryOptions = [
    { value: 'all', label: 'All Salaries' },
    { value: 'under-30k', label: 'Under ₹30,000' },
    { value: '30k-50k', label: '₹30,000 - ₹50,000' },
    { value: '50k-80k', label: '₹50,000 - ₹80,000' },
    { value: 'above-80k', label: 'Above ₹80,000' }
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'date', label: 'Latest' },
    { value: 'salary', label: 'Highest Salary' },
    { value: 'applications', label: 'Fewest Applications' }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Find Your Dream Job</h1>
            <p className="text-muted-foreground mt-1">
              Discover opportunities in the restaurant and hospitality industry
            </p>
          </div>

          <div className="flex items-center gap-2 mt-3 sm:mt-0">
            <Button variant="ghost" size="sm" onClick={fetchJobs} disabled={jobsLoading} title="Refresh jobs">
              <RefreshCw className={cn('h-4 w-4', jobsLoading && 'animate-spin')} />
            </Button>
            {user?.role === UserRole.RESTAURANT && (
              <Button onClick={() => router.push('/restaurant/jobs/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Post a Job
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search jobs, companies, or keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Location"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-48"
                    />
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="px-4 py-3"
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border"
                >
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Job Type</label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {jobTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Experience</label>
                    <select
                      value={experienceFilter}
                      onChange={(e) => setExperienceFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {experienceOptions.map(exp => (
                        <option key={exp.value} value={exp.value}>{exp.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Salary Range</label>
                    <select
                      value={salaryFilter}
                      onChange={(e) => setSalaryFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {salaryOptions.map(salary => (
                        <option key={salary.value} value={salary.value}>{salary.label}</option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center flex-wrap gap-2">
            <p className="text-muted-foreground">
              {jobsLoading ? 'Loading…' : `${sortedJobs.length} job${sortedJobs.length !== 1 ? 's' : ''} found`}
            </p>

            {/* REZ Sync filter toggle */}
            <button
              onClick={() => setRezSyncFilter(prev => !prev)}
              className={cn(
                'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors',
                rezSyncFilter
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-background text-muted-foreground border-border hover:border-orange-400 hover:text-orange-500'
              )}
            >
              REZ Sync
              {rezSyncFilter && <X className="h-3 w-3" />}
            </button>

            {/* Active Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {searchTerm && (
                <Badge variant="outline" className="cursor-pointer" onClick={() => setSearchTerm('')}>
                  "{searchTerm}"
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {locationFilter && (
                <Badge variant="outline" className="cursor-pointer" onClick={() => setLocationFilter('')}>
                  <MapPin className="h-3 w-3 mr-1" />
                  {locationFilter}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {typeFilter !== 'all' && (
                <Badge variant="outline" className="cursor-pointer" onClick={() => setTypeFilter('all')}>
                  {jobTypes.find(t => t.value === typeFilter)?.label}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Error state */}
        {jobsError && (
          <div className="text-center py-8 text-destructive">
            <p>{jobsError}</p>
            <Button variant="outline" className="mt-4" onClick={fetchJobs}>Retry</Button>
          </div>
        )}

        {/* Loading skeleton */}
        {jobsLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-28 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {/* Jobs List */}
        {!jobsLoading && !jobsError && (
          <div className="space-y-4">
            {sortedJobs.map((job) => (
              <div key={job.id} className="relative">
                {job.source === 'rez_shift_sync' && (
                  <span className="absolute top-3 right-3 z-10 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-300">
                    From REZ Shifts
                  </span>
                )}
                <JobCard
                  job={job}
                  onApply={handleJobApply}
                  onBookmark={handleJobBookmark}
                  onShare={handleJobShare}
                  onView={handleJobView}
                  isBookmarked={bookmarkedJobs.has(job.id)}
                  isLiked={likedJobs.has(job.id)}
                  currentUserRole={user?.role}
                />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!jobsLoading && !jobsError && sortedJobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No jobs found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or filters
            </p>
            <Button variant="outline" onClick={clearAllFilters}>
              Clear all filters
            </Button>
          </div>
        )}
      </div>

      {/* Job Application Form */}
      {selectedJob && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
            <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] p-8">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                  <div className="h-4 bg-muted rounded w-4/6"></div>
                </div>
              </div>
            </div>
          </div>
        }>
          <JobApplicationFormOptimized
            job={{
              id: selectedJob.id,
              title: selectedJob.title,
              company: selectedJob.company.name,
              location: `${selectedJob.location.city}, ${selectedJob.location.state}`,
              type: selectedJob.employment.type,
              salary: `${selectedJob.salary.min ? '₹' + selectedJob.salary.min.toLocaleString() : ''}${selectedJob.salary.max ? ' - ₹' + selectedJob.salary.max.toLocaleString() : ''} ${selectedJob.salary.period}`,
              requirements: selectedJob.requirements,
              description: selectedJob.description
            }}
            isOpen={showApplicationForm}
            onClose={() => {
              setShowApplicationForm(false);
              setSelectedJob(null);
            }}
            onSubmit={handleApplicationSubmit}
          />
        </Suspense>
      )}
    </DashboardLayout>
  );
}