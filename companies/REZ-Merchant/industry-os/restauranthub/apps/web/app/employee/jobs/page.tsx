'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  MapPin,
  DollarSign,
  Clock,
  Briefcase,
  Building2,
  Star,
  Heart,
  Send,
  Eye,
  SlidersHorizontal,
  ArrowUpDown,
  Bookmark,
  TrendingUp,
  Users,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import toast from '@/lib/toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api';

function normalizeJob(raw): Job {
  return {
    id: raw.id,
    title: raw.title,
    company: {
      id: raw.restaurant?.id ?? raw.restaurantId ?? '',
      name: raw.restaurant?.name ?? 'Unknown',
      rating: raw.restaurant?.rating ?? 0,
      verified: false,
      location: raw.location ?? '',
    },
    description: raw.description ?? '',
    requirements: raw.requirements ?? [],
    responsibilities: raw.responsibilities ?? [],
    benefits: raw.benefits ?? [],
    salary: {
      min: raw.salaryMin ?? 0,
      max: raw.salaryMax ?? 0,
      period: 'monthly',
      negotiable: false,
    },
    location: raw.location ?? '',
    type: (raw.jobType ?? raw.employmentType ?? 'FULL_TIME')
      .toLowerCase()
      .replace('_', '-') as Job['type'],
    experience: { min: 0, max: 0 },
    skills: raw.skills ?? [],
    postedAt: raw.createdAt ?? new Date().toISOString(),
    expiresAt: raw.validTill ?? raw.applicationDeadline ?? '',
    applicationsCount: raw.applicationCount ?? 0,
    viewsCount: raw.viewCount ?? 0,
    isUrgent: false,
    isFeatured: false,
    isApplied: false,
    isSaved: false,
  };
}

interface Job {
  id: string;
  title: string;
  company: {
    id: string;
    name: string;
    logo?: string;
    rating: number;
    verified: boolean;
    location: string;
  };
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  salary: {
    min: number;
    max: number;
    period: 'monthly' | 'annually';
    negotiable: boolean;
  };
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  experience: {
    min: number;
    max: number;
  };
  skills: string[];
  postedAt: string;
  expiresAt: string;
  applicationsCount: number;
  viewsCount: number;
  matchPercentage?: number;
  isUrgent: boolean;
  isFeatured: boolean;
  isApplied: boolean;
  isSaved: boolean;
}


export default function EmployeeJobs() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);

  const fetchJobs = useCallback(async () => {
    setJobsLoading(true);
    setJobsError(null);
    try {
      const params = new URLSearchParams({ status: 'OPEN', limit: '50' });
      const res = await fetch(`${API_BASE}/jobs?${params.toString()}`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const raw: unknown[] = json.data ?? json ?? [];
      setJobs(raw.map(normalizeJob));
    } catch (err: unknown) {
      setJobsError(err instanceof Error ? err.message : String(err));
    } finally {
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLocation = locationFilter === 'all' || job.location.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesType = typeFilter === 'all' || job.type === typeFilter;
    return matchesSearch && matchesLocation && matchesType;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case 'salary-high':
        return b.salary.max - a.salary.max;
      case 'salary-low':
        return a.salary.min - b.salary.min;
      case 'newest':
        return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      case 'applications':
        return a.applicationsCount - b.applicationsCount;
      default:
        return 0;
    }
  });

  const toggleSaveJob = (jobId: string) => {
    setSavedJobs(prev =>
      prev.includes(jobId)
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const getJobTypeColor = (type: Job['type']) => {
    switch (type) {
      case 'full-time':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
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

  const JobCard = ({ job }: { job: Job }) => {
    return (
      <Card
        className="hover:shadow-lg transition-all duration-300 cursor-pointer"
        onClick={() => router.push(`/employee/jobs/${job.id}`)}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-4 flex-1">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-foreground text-lg line-clamp-1">
                      {job.title}
                      {job.matchPercentage && (
                        <span className="ml-2 text-sm bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200 px-2 py-1 rounded-full">
                          {job.matchPercentage}% match
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-muted-foreground font-medium">{job.company.name}</p>
                      {job.company.verified && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-muted-foreground">{job.company.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="default"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSaveJob(job.id);
                      }}
                    >
                      <Heart className={cn(
                        "h-4 w-4",
                        savedJobs.includes(job.id) ? "fill-destructive text-destructive" : "text-muted-foreground"
                      )} />
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {job.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <div className={`text-xs px-2 py-1 rounded-full ${getJobTypeColor(job.type)}`}>
                    {job.type.replace('-', ' ')}
                  </div>
                  {job.isUrgent && (
                    <div className="bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-full">
                      Urgent
                    </div>
                  )}
                  {job.isFeatured && (
                    <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                      Featured
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-4 w-4" />
                    <span>
                      {formatCurrency(job.salary.min)} - {formatCurrency(job.salary.max)}
                      {job.salary.negotiable && ' (Negotiable)'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{job.experience.min}-{job.experience.max} years</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{job.applicationsCount} applicants</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {job.skills.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{job.skills.length - 3} more
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <p className="text-xs text-muted-foreground">
                      {formatDate(job.postedAt, { month: 'short', day: 'numeric' })}
                    </p>
                    {job.isApplied ? (
                      <Button variant="outline" disabled size="default">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Applied
                      </Button>
                    ) : (
                      <Button
                        size="default"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/employee/jobs/${job.id}`);
                        }}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Apply Now
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Job Search</h1>
            <p className="text-muted-foreground mt-1">
              Discover opportunities that match your skills and preferences
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Button
              variant="outline"
              size="default"
              onClick={() => router.push('/jobs/saved')}
            >
              <Bookmark className="h-4 w-4 mr-2" />
              Saved Jobs ({savedJobs.length})
            </Button>
            <Button variant="outline" size="default">
              <TrendingUp className="h-4 w-4 mr-2" />
              Job Alerts
            </Button>
          </div>
        </div>

        {/* Job count summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Available Jobs</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {jobsLoading ? '...' : jobs.length}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search for jobs, companies, or skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="all">All Locations</option>
                    <option value="mumbai">Mumbai</option>
                    <option value="delhi">Delhi</option>
                    <option value="bangalore">Bangalore</option>
                    <option value="pune">Pune</option>
                    <option value="goa">Goa</option>
                  </select>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="relevance">Most Relevant</option>
                    <option value="match">Best Match</option>
                    <option value="newest">Newest First</option>
                    <option value="salary-high">Salary: High to Low</option>
                    <option value="salary-low">Salary: Low to High</option>
                    <option value="applications">Fewest Applications</option>
                  </select>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    More Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Job Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-muted-foreground">
              {jobsLoading ? 'Loading...' : `Showing ${sortedJobs.length} job${sortedJobs.length !== 1 ? 's' : ''}`}
              {searchTerm && ` for "${searchTerm}"`}
            </p>
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

          {!jobsLoading && !jobsError && (
            <div className="space-y-4">
              {sortedJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}

              {sortedJobs.length === 0 && (
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No jobs found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search criteria
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}