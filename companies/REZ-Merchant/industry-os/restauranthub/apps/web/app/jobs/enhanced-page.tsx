'use client';

import React, { useState, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  Users,
  Bookmark,
  Heart,
  TrendingUp,
  Clock,
  Building2,
  Plus,
  SlidersHorizontal,
  X,
  Grid3X3,
  List,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/auth/auth-provider';
import { UserRole } from '@/types/auth';
import {
  LoadingSpinner,
  JobCardSkeleton,
  ErrorState,
  EmptyState,
  ProgressiveLoading,
  ButtonLoading,
} from '@/components/ui/loading-states';
import {
  useJobs,
  useInfiniteJobs,
  useJobSearch,
  useJobStats,
  useSaveJob,
  useUnsaveJob,
  useApplyToJob,
} from '@/lib/hooks/useEnhancedJobs';
import { SearchFilters } from '@/types/api';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/lib/hooks/use-debounce';
import JobCard from '@/components/jobs/job-card';

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

const JobFiltersPanel = dynamic(() => import('@/components/jobs/job-filters-panel'), {
  loading: () => <div className="h-64 animate-pulse bg-muted rounded-lg"></div>,
  ssr: false
});

export default function EnhancedJobsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL-based state management
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');
  const [experienceFilter, setExperienceFilter] = useState(searchParams.get('experience') || 'all');
  const [salaryRange, setSalaryRange] = useState<[number, number]>([0, 200000]);
  const [remoteOnly, setRemoteOnly] = useState(searchParams.get('remote') === 'true');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJob, setSelectedJob] = useState<unknown>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  // Debounce search to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const debouncedLocation = useDebounce(locationFilter, 300);

  // Build filters object
  const filters: SearchFilters = useMemo(() => {
    const baseFilters: SearchFilters = {
      sortBy: sortBy === 'relevance' ? undefined : sortBy,
      sortOrder: 'desc',
    };

    if (categoryFilter && categoryFilter !== 'all') {
      baseFilters.category = [categoryFilter];
    }

    if (typeFilter && typeFilter !== 'all') {
      // Map type filter to actual employment types
      const typeMap: Record<string, string[]> = {
        'full-time': ['FULL_TIME'],
        'part-time': ['PART_TIME'],
        'contract': ['CONTRACT'],
        'internship': ['INTERNSHIP'],
      };
      baseFilters.category = typeMap[typeFilter] || [];
    }

    if (salaryRange[0] > 0 || salaryRange[1] < 200000) {
      baseFilters.priceRange = salaryRange;
    }

    return baseFilters;
  }, [categoryFilter, typeFilter, salaryRange, sortBy]);

  // API hooks with proper error handling
  const {
    data: jobsData,
    isLoading: jobsLoading,
    error: jobsError,
    refetch: refetchJobs,
  } = useJobs(filters, 1, 20);

  const {
    data: searchResults,
    isLoading: searchLoading,
    error: searchError,
  } = useJobSearch(
    debouncedSearchTerm,
    { ...filters, location: debouncedLocation },
    !!debouncedSearchTerm
  );

  const {
    data: statsData,
    isLoading: statsLoading,
  } = useJobStats();

  // Mutation hooks
  const saveJobMutation = useSaveJob();
  const unsaveJobMutation = useUnsaveJob();
  const applyJobMutation = useApplyToJob();

  // Determine which data to display
  const displayData = debouncedSearchTerm ? searchResults : jobsData;
  const isLoading = debouncedSearchTerm ? searchLoading : jobsLoading;
  const error = debouncedSearchTerm ? searchError : jobsError;

  const jobs = displayData?.data || [];
  const totalJobs = displayData?.total || 0;

  // Event handlers
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    // Update URL params
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('q', term);
    } else {
      params.delete('q');
    }
    router.push(`/jobs?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const handleLocationChange = useCallback((location: string) => {
    setLocationFilter(location);
    const params = new URLSearchParams(searchParams);
    if (location) {
      params.set('location', location);
    } else {
      params.delete('location');
    }
    router.push(`/jobs?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const handleJobApply = useCallback((jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (job) {
      setSelectedJob(job);
      setShowApplicationForm(true);
    }
  }, [jobs]);

  const handleJobSave = useCallback(async (jobId: string, isSaved: boolean) => {
    try {
      if (isSaved) {
        await unsaveJobMutation.mutateAsync(jobId);
      } else {
        await saveJobMutation.mutateAsync(jobId);
      }
    } catch (error) {
      console.error('Failed to toggle job save status:', error);
    }
  }, [saveJobMutation, unsaveJobMutation]);

  const handleJobShare = useCallback((jobId: string) => {
    const url = `${window.location.origin}/jobs/${jobId}`;
    navigator.clipboard.writeText(url);
    // Toast notification would be handled by the mutation
  }, []);

  const handleJobView = useCallback((jobId: string) => {
    window.open(`/jobs/${jobId}`, '_blank');
  }, []);

  const handleApplicationSubmit = useCallback(async (applicationData) => {
    if (!selectedJob) return;

    try {
      await applyJobMutation.mutateAsync({
        jobId: selectedJob.id,
        applicationData,
      });
      setShowApplicationForm(false);
      setSelectedJob(null);
    } catch (error) {
      console.error('Failed to submit application:', error);
    }
  }, [selectedJob, applyJobMutation]);

  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setLocationFilter('');
    setCategoryFilter('');
    setTypeFilter('all');
    setExperienceFilter('all');
    setSalaryRange([0, 200000]);
    setRemoteOnly(false);
    router.push('/jobs');
  }, [router]);

  // Filter options
  const jobTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'createdAt', label: 'Latest' },
    { value: 'salary', label: 'Highest Salary' },
    { value: 'applicationCount', label: 'Fewest Applications' },
  ];

  const activeFiltersCount = [
    searchTerm,
    locationFilter,
    categoryFilter !== '',
    typeFilter !== 'all',
    experienceFilter !== 'all',
    remoteOnly,
  ].filter(Boolean).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Stats */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-2">
              <h1 className="text-2xl font-bold text-foreground">Find Your Dream Job</h1>
              {statsLoading ? (
                <LoadingSpinner size="sm" />
              ) : statsData && (
                <Badge variant="outline" className="text-sm">
                  {statsData.data.activeJobs.toLocaleString()} active jobs
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Discover opportunities in the restaurant and hospitality industry
            </p>

            {/* Quick Stats */}
            {statsData && !statsLoading && (
              <div className="flex items-center space-x-6 mt-4">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {statsData.data.totalApplications.toLocaleString()}
                  </span> applications today
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {statsData.data.totalJobs.toLocaleString()}
                  </span> total positions
                </div>
              </div>
            )}
          </div>

          {user?.role === UserRole.RESTAURANT && (
            <Button
              onClick={() => router.push('/restaurant/jobs/create')}
              className="shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Post a Job
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Main Search Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search jobs, companies, or keywords..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Location"
                    value={locationFilter}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    className="pl-10 w-48"
                  />
                </div>

                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    'px-4 py-2',
                    activeFiltersCount > 0 && 'border-primary bg-primary/10'
                  )}
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Active Filter Tags */}
                <AnimatePresence>
                  {searchTerm && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Badge
                        variant="outline"
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => handleSearch('')}
                      >
                        "{searchTerm}"
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    </motion.div>
                  )}

                  {locationFilter && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Badge
                        variant="outline"
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => handleLocationChange('')}
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        {locationFilter}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    </motion.div>
                  )}

                  {activeFiltersCount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="h-6 px-2 text-xs"
                      >
                        Clear all
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Advanced Filters Panel */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t pt-4"
                  >
                    <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded" />}>
                      <JobFiltersPanel
                        filters={{
                          categoryFilter,
                          experienceFilter,
                          salaryRange,
                          remoteOnly,
                        }}
                        onChange={(newFilters) => {
                          setCategoryFilter(newFilters.categoryFilter || '');
                          setExperienceFilter(newFilters.experienceFilter || 'all');
                          setSalaryRange(newFilters.salaryRange || [0, 200000]);
                          setRemoteOnly(newFilters.remoteOnly || false);
                        }}
                      />
                    </Suspense>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Results Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <ProgressiveLoading
              isLoading={isLoading}
              loadingComponent={<LoadingSpinner size="sm" />}
            >
              <p className="text-muted-foreground">
                {totalJobs.toLocaleString()} job{totalJobs !== 1 ? 's' : ''} found
              </p>
            </ProgressiveLoading>
          </div>

          <div className="flex items-center space-x-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-auto">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchJobs()}
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {/* Jobs List */}
        <ProgressiveLoading
          isLoading={isLoading}
          error={error?.message || null}
          onRetry={refetchJobs}
          isEmpty={jobs.length === 0}
          loadingComponent={
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <JobCardSkeleton key={index} />
              ))}
            </div>
          }
          errorComponent={
            <ErrorState
              title="Failed to load jobs"
              message={error?.message || 'Please try again later'}
              showRetry={true}
              onRetry={refetchJobs}
            />
          }
          emptyComponent={
            <EmptyState
              icon={<Briefcase className="h-12 w-12 text-muted-foreground" />}
              title="No jobs found"
              description="Try adjusting your search criteria or filters"
              action={{
                label: 'Clear all filters',
                onClick: clearAllFilters,
              }}
            />
          }
        >
          <div className={cn(
            'grid gap-4',
            viewMode === 'grid' ? 'grid-cols-1' : 'grid-cols-1'
          )}>
            <AnimatePresence>
              {jobs.map((job, index: number) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <JobCard
                    job={job}
                    onApply={handleJobApply}
                    onBookmark={handleJobSave}
                    onShare={handleJobShare}
                    onView={handleJobView}
                    isBookmarked={job.saved || false}
                    currentUserRole={user?.role}
                    viewMode={viewMode}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ProgressiveLoading>
      </div>

      {/* Job Application Form */}
      {selectedJob && (
        <Suspense fallback={<LoadingSpinner size="lg" />}>
          <JobApplicationFormOptimized
            job={selectedJob}
            isOpen={showApplicationForm}
            onClose={() => {
              setShowApplicationForm(false);
              setSelectedJob(null);
            }}
            onSubmit={handleApplicationSubmit}
            isSubmitting={applyJobMutation.loading}
          />
        </Suspense>
      )}
    </DashboardLayout>
  );
}